/**
 * RPC controller contracts for ai-service — one per controller.
 */

export interface IUsageRpcController {
  findUsage(payload: unknown): Promise<unknown>;
  checkCredits(payload: unknown): Promise<unknown>;
}

export interface IMessageRpcController {
  sendMessage(payload: unknown): Promise<unknown>;
  findMessages(payload: unknown): Promise<unknown>;
}

export interface IConversationRpcController {
  createConversation(payload: unknown): Promise<unknown>;
  findConversations(payload: unknown): Promise<unknown>;
  findConversation(payload: unknown): Promise<unknown>;
  removeConversation(payload: unknown): Promise<unknown>;
}
