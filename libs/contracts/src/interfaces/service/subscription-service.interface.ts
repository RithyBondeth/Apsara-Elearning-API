/**
 * DI tokens + service contracts for subscription-service.
 * Loose signatures — Drizzle rows re-typed at the gateway via rpcCall<T>.
 */

export const I_PAYMENT_SERVICE = 'IPaymentService';
export const I_PLAN_SERVICE = 'IPlanService';
export const I_SUBSCRIPTION_SERVICE = 'ISubscriptionService';

export interface IPaymentService {
  record(...args: any[]): Promise<unknown>;
  findByUser(...args: any[]): Promise<unknown>;
  findOne(...args: any[]): Promise<unknown>;
  webhook(...args: any[]): Promise<unknown>;
}

export interface IPlanService {
  create(...args: any[]): Promise<unknown>;
  findAll(...args: any[]): Promise<unknown>;
  findOne(...args: any[]): Promise<unknown>;
  update(...args: any[]): Promise<unknown>;
  remove(...args: any[]): Promise<unknown>;
}

export interface ISubscriptionService {
  subscribe(...args: any[]): Promise<unknown>;
  findByUser(...args: any[]): Promise<unknown>;
  findActive(...args: any[]): Promise<unknown>;
  check(...args: any[]): Promise<unknown>;
  cancel(...args: any[]): Promise<unknown>;
}
