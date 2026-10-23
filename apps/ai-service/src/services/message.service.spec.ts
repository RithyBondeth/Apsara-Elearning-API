import { CreditsResponseDTO } from '@app/contracts';
import { AiProviderTimeoutError } from '../providers/ai-provider.interface';
import { MAX_HISTORY_MESSAGES, MessageService } from './message.service';

/**
 * The tutor's cost controls: the allowance is checked before anything is
 * written or any provider is called, the history sent is bounded, and a slow
 * provider surfaces as a retryable 504.
 */

type Row = { role: string; content: string };

function fakeDb(prior: Row[]) {
  const inserts: unknown[] = [];
  const db = {
    select: () => {
      const node: Record<string, unknown> = {};
      for (const m of ['from', 'where', 'orderBy']) node[m] = () => node;
      node.then = (res: (v: unknown) => unknown) =>
        Promise.resolve(prior).then(res);
      return node;
    },
    insert: () => ({
      values: (v: unknown) => {
        inserts.push(v);
        const node = {
          returning: () =>
            Promise.resolve([
              { id: 'reply-1', conversationId: 'c1', ...(v as object) },
            ]),
          then: (res: (v: unknown) => unknown) => Promise.resolve().then(res),
        };
        return node;
      },
    }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  };
  return { db, inserts };
}

const credits = (hasCredits: boolean) =>
  new CreditsResponseDTO({
    used: hasCredits ? 0 : 1_000_000,
    limit: 1_000_000,
    remaining: hasCredits ? 1_000_000 : 0,
    hasCredits,
  });

const reply = {
  text: 'Here is how loops work.',
  promptTokens: 100,
  completionTokens: 20,
  provider: 'anthropic',
  model: 'configured-model',
  mock: false,
};

function build(
  prior: Row[],
  opts: { hasCredits?: boolean; chat?: jest.Mock } = {},
) {
  const { db, inserts } = fakeDb(prior);
  const chat = opts.chat ?? jest.fn().mockResolvedValue(reply);
  const usage = {
    checkCredits: jest.fn().mockResolvedValue(credits(opts.hasCredits ?? true)),
    findByUser: jest.fn(),
  };
  const service = new MessageService(
    db as never,
    { chat } as never,
    { assert: jest.fn().mockResolvedValue(undefined) } as never,
    { findCurrent: jest.fn().mockResolvedValue(null) } as never,
    { findOneOwned: jest.fn().mockResolvedValue({ id: 'c1' }) } as never,
    usage,
  );
  return { service, chat, inserts, usage };
}

/** The history passed to the provider on the first call. */
const sentHistory = (chat: jest.Mock): Row[] =>
  (chat.mock.calls[0] as [string, Row[]])[1];

const turns = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `turn ${i}`,
  }));

describe('MessageService.send allowance', () => {
  it('refuses with 429 before saving the message or calling the provider', async () => {
    const { service, chat, inserts } = build([], { hasCredits: false });

    await expect(service.send('u1', 'c1', 'hello')).rejects.toMatchObject({
      error: { statusCode: 429 },
    });
    expect(chat).not.toHaveBeenCalled();
    expect(inserts).toHaveLength(0);
  });

  it('replies and records usage while the learner has allowance left', async () => {
    const { service, chat, inserts, usage } = build([]);

    const res = await service.send('u1', 'c1', 'hello');

    expect(usage.checkCredits).toHaveBeenCalledWith('u1');
    expect(chat).toHaveBeenCalledTimes(1);
    expect(res.message.content).toBe(reply.text);
    // user message, assistant reply, usage row
    expect(inserts).toHaveLength(3);
  });
});

describe('MessageService.send provider choice', () => {
  it('passes only the prompt and history — no client provider or model', async () => {
    const { service, chat } = build([]);

    await service.send('u1', 'c1', 'hello');

    expect(chat.mock.calls[0]).toHaveLength(2);
  });
});

describe('MessageService.send history', () => {
  it(`sends at most ${MAX_HISTORY_MESSAGES} prior turns plus the new message`, async () => {
    const { service, chat } = build(turns(50));

    await service.send('u1', 'c1', 'latest');

    const history = sentHistory(chat);
    expect(history).toHaveLength(MAX_HISTORY_MESSAGES + 1);
    expect(history[0]).toEqual({ role: 'user', content: 'turn 30' });
    expect(history.at(-1)).toEqual({ role: 'user', content: 'latest' });
  });

  it('never opens the window on an assistant reply', async () => {
    // 21 turns: the last 20 would start on turn 1, an assistant reply.
    const { service, chat } = build(turns(MAX_HISTORY_MESSAGES + 1));

    await service.send('u1', 'c1', 'latest');

    const history = sentHistory(chat);
    expect(history[0].role).toBe('user');
    expect(history).toHaveLength(MAX_HISTORY_MESSAGES);
  });

  it('drops system messages from the history', async () => {
    const { service, chat } = build([
      { role: 'system', content: 'internal' },
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ]);

    await service.send('u1', 'c1', 'next');

    const history = sentHistory(chat);
    expect(history.map((t) => t.role)).toEqual(['user', 'assistant', 'user']);
  });
});

describe('MessageService.send timeout', () => {
  it('reports a provider timeout as a retryable 504', async () => {
    const chat = jest
      .fn()
      .mockRejectedValue(new AiProviderTimeoutError('anthropic'));
    const { service } = build([], { chat });

    await expect(service.send('u1', 'c1', 'hello')).rejects.toMatchObject({
      error: { statusCode: 504 },
    });
  });

  it('lets other provider failures through unchanged', async () => {
    const failure = new Error('anthropic: invalid request');
    const { service } = build([], {
      chat: jest.fn().mockRejectedValue(failure),
    });

    await expect(service.send('u1', 'c1', 'hello')).rejects.toBe(failure);
  });
});
