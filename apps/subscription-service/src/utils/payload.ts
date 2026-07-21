/** Gateways send either a bare id string or `{ id }`; normalize both. */
export function idOf(payload: string | { id: string }): string {
  return typeof payload === 'string' ? payload : payload.id;
}

/** Splits an update payload `{ id, ...rest }` into the id and the rest. */
export function splitUpdate<T extends { id: string }>(
  payload: T,
): { id: string; data: Omit<T, 'id'> } {
  const { id, ...data } = payload;
  return { id, data };
}
