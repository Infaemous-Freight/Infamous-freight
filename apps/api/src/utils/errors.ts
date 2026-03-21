export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class HttpError extends ApiError {
  constructor(statusCode: number, message: string, details?: unknown) {
    super(statusCode, "HTTP_ERROR", message, details);
  }
}
