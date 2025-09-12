export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (message: string, statusCode: number): AppError => {
  return new AppError(message, statusCode);
};

export const handleError = (error: Error | AppError): { message: string; statusCode: number } => {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  // Default error
  return {
    message: 'Internal server error',
    statusCode: 500,
  };
};
