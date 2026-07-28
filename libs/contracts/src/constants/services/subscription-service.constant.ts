export const SUBSCRIPTION_SERVICE = {
  NAME: 'SUBSCRIPTION_SERVICE',
  ACTIONS: {
    // Plans (admin-managed)
    PLAN_CREATE: 'subscription.plan.create',
    PLAN_FIND_ALL: 'subscription.plan.find_all',
    PLAN_FIND_ONE: 'subscription.plan.find_one',
    PLAN_UPDATE: 'subscription.plan.update',
    PLAN_DELETE: 'subscription.plan.delete',

    // Subscriptions
    CHECKOUT_CREATE: 'subscription.checkout.create',
    BILLING_PORTAL_CREATE: 'subscription.billing_portal.create',
    SUBSCRIPTION_FIND_BY_USER: 'subscription.find_by_user',
    SUBSCRIPTION_FIND_ACTIVE: 'subscription.find_active', // active sub for a user
    SUBSCRIPTION_CANCEL: 'subscription.cancel',
    SUBSCRIPTION_CHECK: 'subscription.check', // is user subscribed?
    ENTITLEMENT_RESOLVE: 'subscription.entitlement.resolve',
    ENTITLEMENT_GRANTS_FIND: 'subscription.entitlement.grants.find',
    ENTITLEMENT_GRANT_CREATE: 'subscription.entitlement.grant.create',
    ENTITLEMENT_GRANT_REVOKE: 'subscription.entitlement.grant.revoke',

    // Payments
    PAYMENT_CREATE: 'subscription.payment.create',
    PAYMENT_FIND_BY_USER: 'subscription.payment.find_by_user',
    PAYMENT_FIND_ONE: 'subscription.payment.find_one',
    PAYMENT_WEBHOOK: 'subscription.payment.webhook', // gateway callback
  },
};
