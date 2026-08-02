/**
 * Timeouts (ms) for the health probes. Kept small so a slow dependency degrades
 * the health check quickly instead of hanging the whole readiness response.
 */
export const HEALTH_DATABASE_TIMEOUT_MS = 2500;
export const HEALTH_MICROSERVICE_TIMEOUT_MS = 2500;
export const HEALTH_RPC_TIMEOUT_MS = 4000;
