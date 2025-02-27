import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Vui lòng nhập token tiếp tục');
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = this.jwtService.verify(token); // Giải mã token
      request.user = decoded; // Lưu thông tin user vào request
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Lấy thông tin người dùng từ request

    if (!user || user.role !== 'admin') {
      throw new UnauthorizedException('Chỉ admin mới có quyền');
    }

    return true;
  }
}
