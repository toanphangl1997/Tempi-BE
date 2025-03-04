import { JwtService } from '@nestjs/jwt';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { createMock } from '@golevelup/ts-jest';
import { AuthService } from 'src/modules/auth/auth.service';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;
  let service: AuthService;

  beforeEach(() => {
    jwtService = new JwtService(); // Tạo instance
    guard = new JwtAuthGuard(jwtService); // Inject vào guard
  });

  it('should return true when token is valid', () => {
    const mockExecutionContext = createMock<ExecutionContext>();
    mockExecutionContext.switchToHttp().getRequest.mockReturnValue({
      headers: { authorization: 'Bearer valid-token' },
    });

    jest.spyOn(jwtService, 'verify').mockReturnValue({ id: 1 });

    const result = guard.canActivate(mockExecutionContext);
    expect(result).toBeTruthy();
  });

  it('should throw UnauthorizedException when token is invalid', () => {
    const mockExecutionContext = createMock<ExecutionContext>();
    mockExecutionContext.switchToHttp().getRequest.mockReturnValue({
      headers: { authorization: 'Bearer invalid-token' },
    });

    jest.spyOn(jwtService, 'verify').mockImplementation(() => {
      throw new Error('Invalid token');
    });

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(
      UnauthorizedException,
    );
  });
});
