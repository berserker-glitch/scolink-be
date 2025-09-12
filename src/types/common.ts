import { Request } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors: string[];
  code?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  centerId?: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}
