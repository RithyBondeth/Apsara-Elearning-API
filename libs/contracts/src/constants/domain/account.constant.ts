/**
 * Days between a learner asking to delete their account and the purge job
 * deleting it. Signing in during this window cancels the deletion.
 */
export const ACCOUNT_DELETION_GRACE_DAYS = 7;

/** When an account whose deletion was requested at `requestedAt` is purged. */
export const accountDeletionDueAt = (requestedAt: Date): Date =>
  new Date(requestedAt.getTime() + ACCOUNT_DELETION_GRACE_DAYS * 86_400_000);
