/**
 * RPC message pattern every microservice answers for liveness/readiness checks.
 * The api-gateway fans this out to each service over RabbitMQ and aggregates the
 * results into the public /health endpoint.
 */
export const HEALTH_PATTERN = { cmd: 'health-check' };
