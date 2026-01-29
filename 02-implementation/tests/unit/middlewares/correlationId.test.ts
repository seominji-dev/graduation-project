/**
 * Unit tests for Correlation ID Middleware
 */

import { Request, Response, NextFunction } from "express";
import {
  correlationIdMiddleware,
  getCorrelationId,
  getRequestContext,
  runWithCorrelationId,
  CORRELATION_ID_HEADER,
  requestContext,
} from "../../../src/middlewares/correlationId";

describe("correlationIdMiddleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      get: jest.fn(),
      path: "/test/path",
      method: "GET",
    };
    mockRes = {
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Correlation ID extraction and generation", () => {
    it("should use existing correlation ID from request header", () => {
      const existingId = "existing-correlation-id";
      (mockReq.get as jest.Mock).mockReturnValue(existingId);

      correlationIdMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockReq.get).toHaveBeenCalledWith(CORRELATION_ID_HEADER);
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        CORRELATION_ID_HEADER,
        existingId,
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it("should generate new UUID when no correlation ID is provided", () => {
      (mockReq.get as jest.Mock).mockReturnValue(undefined);

      correlationIdMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockReq.get).toHaveBeenCalledWith(CORRELATION_ID_HEADER);
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        CORRELATION_ID_HEADER,
        expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        ),
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it("should set response header with correlation ID", () => {
      (mockReq.get as jest.Mock).mockReturnValue(undefined);

      correlationIdMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        CORRELATION_ID_HEADER,
        expect.any(String),
      );
    });
  });

  describe("Request context storage", () => {
    it("should store request context in AsyncLocalStorage", (done) => {
      const testId = "test-correlation-id";
      (mockReq.get as jest.Mock).mockReturnValue(testId);

      const originalNext = mockNext;
      mockNext = jest.fn(() => {
        const context = requestContext.getStore();
        expect(context).toBeDefined();
        expect(context?.correlationId).toBe(testId);
        expect(context?.path).toBe("/test/path");
        expect(context?.method).toBe("GET");
        expect(context?.startTime).toBeGreaterThan(0);
        originalNext();
        done();
      });

      correlationIdMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );
    });

    it("should include startTime in request context", (done) => {
      (mockReq.get as jest.Mock).mockReturnValue("test-id");
      const beforeTime = Date.now();

      mockNext = jest.fn(() => {
        const context = requestContext.getStore();
        const afterTime = Date.now();
        expect(context?.startTime).toBeGreaterThanOrEqual(beforeTime);
        expect(context?.startTime).toBeLessThanOrEqual(afterTime);
        done();
      });

      correlationIdMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );
    });
  });

  describe("getCorrelationId()", () => {
    it("should return correlation ID when context is available", (done) => {
      const testId = "test-correlation-id";
      (mockReq.get as jest.Mock).mockReturnValue(testId);

      mockNext = jest.fn(() => {
        const id = getCorrelationId();
        expect(id).toBe(testId);
        done();
      });

      correlationIdMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );
    });

    it('should return "unknown" when no context is available', () => {
      const id = getCorrelationId();
      expect(id).toBe("unknown");
    });
  });

  describe("getRequestContext()", () => {
    it("should return full request context when available", (done) => {
      const testId = "test-correlation-id";
      (mockReq.get as jest.Mock).mockReturnValue(testId);

      mockNext = jest.fn(() => {
        const context = getRequestContext();
        expect(context).toBeDefined();
        expect(context?.correlationId).toBe(testId);
        expect(context?.path).toBe("/test/path");
        expect(context?.method).toBe("GET");
        expect(context?.startTime).toBeGreaterThan(0);
        done();
      });

      correlationIdMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );
    });

    it("should return undefined when no context is available", () => {
      const context = getRequestContext();
      expect(context).toBeUndefined();
    });
  });

  describe("runWithCorrelationId()", () => {
    it("should execute async function with correlation ID context", async () => {
      const testId = "async-test-id";
      let capturedId: string | undefined;

      await runWithCorrelationId(testId, async () => {
        capturedId = getCorrelationId();
      });

      expect(capturedId).toBe(testId);
    });

    it("should return the result of the async function", async () => {
      const testId = "async-test-id";
      const expectedResult = { data: "test-data" };

      const result = await runWithCorrelationId(testId, async () => {
        return expectedResult;
      });

      expect(result).toEqual(expectedResult);
    });

    it("should create context with startTime", async () => {
      const testId = "async-test-id";
      const beforeTime = Date.now();
      let contextStartTime: number | undefined;

      await runWithCorrelationId(testId, async () => {
        const context = getRequestContext();
        contextStartTime = context?.startTime;
      });

      const afterTime = Date.now();
      expect(contextStartTime).toBeGreaterThanOrEqual(beforeTime);
      expect(contextStartTime).toBeLessThanOrEqual(afterTime);
    });

    it("should propagate errors from async function", async () => {
      const testId = "async-test-id";
      const testError = new Error("Test error");

      await expect(
        runWithCorrelationId(testId, async () => {
          throw testError;
        }),
      ).rejects.toThrow("Test error");
    });

    it("should handle nested async calls", async () => {
      const outerIds: string[] = [];
      const innerIds: string[] = [];

      await runWithCorrelationId("outer-id", async () => {
        outerIds.push(getCorrelationId());

        await runWithCorrelationId("inner-id", async () => {
          innerIds.push(getCorrelationId());
        });

        outerIds.push(getCorrelationId());
      });

      expect(outerIds).toEqual(["outer-id", "outer-id"]);
      expect(innerIds).toEqual(["inner-id"]);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty correlation ID header", () => {
      (mockReq.get as jest.Mock).mockReturnValue("");

      correlationIdMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      // Empty string is falsy, so a new UUID should be generated
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        CORRELATION_ID_HEADER,
        expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        ),
      );
    });

    it("should handle missing request path and method", (done) => {
      const reqWithoutPathMethod: Partial<Request> = {
        get: jest.fn().mockReturnValue("test-id"),
      };

      mockNext = jest.fn(() => {
        const context = getRequestContext();
        expect(context?.path).toBeUndefined();
        expect(context?.method).toBeUndefined();
        done();
      });

      correlationIdMiddleware(
        reqWithoutPathMethod as Request,
        mockRes as Response,
        mockNext,
      );
    });
  });

  describe("CORRELATION_ID_HEADER constant", () => {
    it("should have correct header name", () => {
      expect(CORRELATION_ID_HEADER).toBe("X-Correlation-ID");
    });
  });
});
