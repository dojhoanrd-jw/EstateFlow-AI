export class ServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'ServiceError';
  }

  static notFound(resource: string) {
    return new ServiceError(404, `${resource} not found`, 'NOT_FOUND');
  }

  static conflict(message: string) {
    return new ServiceError(409, message, 'CONFLICT');
  }

  static forbidden(message = 'Access denied') {
    return new ServiceError(403, message, 'FORBIDDEN');
  }

  static badRequest(message: string) {
    return new ServiceError(400, message, 'BAD_REQUEST');
  }
}
