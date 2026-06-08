export const SUBSCRIPTION_SERVICE = {
  NAME: 'SUBSCRIPTION_SERVICE',
  ACTIONS: {
    PING: 'subscription.ping',

    // Plans (admin-managed)
    PLAN_CREATE: 'subscription.plan.create',
    PLAN_FIND_ALL: 'subscription.plan.find_all',
    PLAN_FIND_ONE: 'subscription.plan.find_one',
    PLAN_UPDATE: 'subscription.plan.update',
    PLAN_DELETE: 'subscription.plan.delete',

    // Subscriptions
    SUBSCRIBE: 'subscription.subscribe',
    SUBSCRIPTION_FIND_BY_USER: 'subscription.find_by_user',
    SUBSCRIPTION_FIND_ACTIVE: 'subscription.find_active',  // active sub for a user
    SUBSCRIPTION_CANCEL: 'subscription.cancel',
    SUBSCRIPTION_CHECK: 'subscription.check',              // is user subscribed?

    // Payments
    PAYMENT_CREATE: 'subscription.payment.create',
    PAYMENT_FIND_BY_USER: 'subscription.payment.find_by_user',
    PAYMENT_FIND_ONE: 'subscription.payment.find_one',
    PAYMENT_WEBHOOK: 'subscription.payment.webhook',       // gateway callback
  },
};
