/**
 * DI tokens + service contracts for ai-service.
 * Loose signatures — Drizzle rows re-typed at the gateway via rpcCall<T>.
 */

export const I_CONVERSATION_SERVICE = 'IConversationService';
export const I_MESSAGE_SERVICE = 'IMessageService';
export const I_USAGE_SERVICE = 'IUsageService';

export interface IConversationService {
  create(...args: any[]): Promise<unknown>;
  findAllByUser(...args: any[]): Promise<unknown>;
  findOneOwned(...args: any[]): Promise<unknown>;
  remove(...args: any[]): Promise<unknown>;
}

export interface IMessageService {
  findByConversation(...args: any[]): Promise<unknown>;
  send(...args: any[]): Promise<unknown>;
}

export interface IUsageService {
  findByUser(...args: any[]): Promise<unknown>;
  checkCredits(...args: any[]): Promise<unknown>;
}
