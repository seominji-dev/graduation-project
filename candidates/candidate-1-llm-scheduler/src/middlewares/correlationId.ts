/**
 * Correlation ID Middleware for Distributed Tracing
 *
 * Re-exports shared correlation ID middleware for project use.
 */

export {
  correlationIdMiddleware,
  getCorrelationId,
  getRequestContext,
  runWithCorrelationId,
  requestContext,
  CORRELATION_ID_HEADER,
} from '@shared/middlewares';

export type { RequestContext } from '@shared/middlewares';

export default correlationIdMiddleware;

// Import for default export
import { correlationIdMiddleware } from '@shared/middlewares';
