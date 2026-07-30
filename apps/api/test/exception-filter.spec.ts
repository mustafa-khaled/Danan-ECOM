import { HttpException, HttpStatus, ArgumentsHost } from "@nestjs/common";
import { Prisma } from "@dadan/db";
import { GlobalExceptionFilter } from "../src/common/filters/http-exception.filter";

function createMockHost(url = "/test") {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status } as unknown as import("express").Response;
  const request = {
    url,
    method: "GET",
    headers: { "x-request-id": "req-123" },
    ip: "127.0.0.1",
  } as unknown as import("express").Request;

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json, request };
}

describe("GlobalExceptionFilter", () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
  });

  describe("Prisma error mapping", () => {
    it("maps P2002 (unique constraint) to 409 Conflict", () => {
      const { host, status, json } = createMockHost();
      const error = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        { code: "P2002", clientVersion: "6.0.0" },
      );

      filter.catch(error, host);
      expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 409,
          message: "Resource already exists",
          error: "Conflict",
          requestId: "req-123",
        }),
      );
    });

    it("maps P2025 (record not found) to 404 Not Found", () => {
      const { host, status, json } = createMockHost();
      const error = new Prisma.PrismaClientKnownRequestError(
        "Record not found",
        { code: "P2025", clientVersion: "6.0.0" },
      );

      filter.catch(error, host);
      expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: "Resource not found",
          error: "Not Found",
        }),
      );
    });

    it("maps P2003 (foreign key violation) to 400 Bad Request", () => {
      const { host, status, json } = createMockHost();
      const error = new Prisma.PrismaClientKnownRequestError(
        "Foreign key constraint failed",
        { code: "P2003", clientVersion: "6.0.0" },
      );

      filter.catch(error, host);
      expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "Related resource not found",
          error: "Bad Request",
        }),
      );
    });

    it("falls through to 500 for unmapped Prisma errors", () => {
      const { host, status } = createMockHost();
      const error = new Prisma.PrismaClientKnownRequestError(
        "Some other error",
        { code: "P2000", clientVersion: "6.0.0" },
      );

      filter.catch(error, host);
      expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe("HttpException handling", () => {
    it("returns the correct status for HttpException", () => {
      const { host, status, json } = createMockHost();

      filter.catch(new HttpException("Not found", 404), host);
      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404, message: "Not found" }),
      );
    });

    it("includes requestId in response", () => {
      const { host, json } = createMockHost();

      filter.catch(new HttpException("error", 400), host);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ requestId: "req-123" }),
      );
    });
  });

  describe("unknown exceptions", () => {
    it("returns 500 for non-HTTP exceptions", () => {
      const { host, status } = createMockHost();

      filter.catch(new Error("kaboom"), host);
      expect(status).toHaveBeenCalledWith(500);
    });
  });
});
