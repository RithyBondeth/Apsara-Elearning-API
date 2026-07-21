/**
 * Gateways are inconsistent: some send a bare id string, others send `{ id }`.
 * These helpers normalize either shape so RPC handlers can rely on a value.
 */
export function idOf(payload: string | { id: string }): string {
  return typeof payload === 'string' ? payload : payload.id;
}

export function slugOf(payload: string | { slug: string }): string {
  return typeof payload === 'string' ? payload : payload.slug;
}

/** Splits an update payload `{ id, ...rest }` into the id and the rest. */
export function splitUpdate<T extends { id: string }>(
  payload: T,
): { id: string; data: Omit<T, 'id'> } {
  const { id, ...data } = payload;
  return { id, data };
}
