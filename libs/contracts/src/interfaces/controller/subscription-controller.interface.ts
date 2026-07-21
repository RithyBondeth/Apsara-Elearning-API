/**
 * RPC controller contracts for subscription-service — one per controller.
 */

export interface ISubscriptionRpcController {
  createPlan(payload: unknown): Promise<unknown>;
  findPlans(): Promise<unknown>;
  findPlan(payload: unknown): Promise<unknown>;
  updatePlan(payload: unknown): Promise<unknown>;
  removePlan(payload: unknown): Promise<unknown>;
  subscribe(payload: unknown): Promise<unknown>;
  findByUser(payload: unknown): Promise<unknown>;
  findActive(payload: unknown): Promise<unknown>;
  cancel(payload: unknown): Promise<unknown>;
  check(payload: unknown): Promise<unknown>;
  createPayment(payload: unknown): Promise<unknown>;
  findPayments(payload: unknown): Promise<unknown>;
  findPayment(payload: unknown): Promise<unknown>;
  webhook(payload: unknown): Promise<unknown>;
}
