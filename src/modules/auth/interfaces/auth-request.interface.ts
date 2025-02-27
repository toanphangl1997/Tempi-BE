import { Request } from 'express';

export interface AuthRequest extends Request {
  user: { id: number }; // Xác định user có id
}
