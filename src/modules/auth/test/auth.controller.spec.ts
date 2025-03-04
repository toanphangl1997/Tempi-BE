import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthRequest } from '../interfaces/auth-request.interface';
import { ChangePasswordDto } from '../dto/change-pasword.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    getRole: jest.fn(),
    changePassword: jest.fn(),
    adminChangePassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard) // ✅ Bỏ qua JwtAuthGuard trong test
      .useValue({
        canActivate: jest.fn(() => true), // Luôn cho phép truy cập
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Kiểm tra signUp
  it('Gọi phương thức signUp từ AuthService', async () => {
    const dto = { email: 'test@example.com', password: '123456' };
    mockAuthService.signUp.mockResolvedValue('mockedResult');

    const result = await controller.signUp(dto as never);
    expect(result).toEqual('mockedResult');
    expect(mockAuthService.signUp).toHaveBeenCalledWith(dto);
  });

  // Kiểm tra signIn
  it('Gọi phương thức signIn từ AuthService', async () => {
    const dto = { email: 'test@example.com', password: '123456' };
    mockAuthService.signIn.mockResolvedValue('mockedToken');

    const result = await controller.signIn(dto as never);
    expect(result).toEqual('mockedToken');
    expect(mockAuthService.signIn).toHaveBeenCalledWith(dto);
  });

  // Kiểm tra Role
  it('Gọi phương thức getRole từ AuthService', async () => {
    const roleResult = [{ role: 'admin' }, { role: 'user' }]; // 🔹 Dữ liệu thực tế
    mockAuthService.getRole.mockResolvedValue(roleResult);

    const result = await controller.getRole(roleResult as never);

    expect(result).toEqual(roleResult); // 🔹 Kiểm tra đúng kết quả
    expect(mockAuthService.getRole).toHaveBeenCalledTimes(1);
  });

  // Đổi mật khẩu user
  it('Trả lỗi nếu user thành đổi mật khẩu user khác', async () => {
    const mockUserId = 1;
    const mockReq = { user: { id: 2 } }; // ID của user khác với userId trong param
    const userIdFromParam = mockUserId.toString();
    const mockDto = {
      newPassword: 'newPass123',
    };

    try {
      // Gọi phương thức changePassword
      await controller.changePassword(
        mockReq as any,
        userIdFromParam,
        mockDto as any,
      );
    } catch (error) {
      // Kiểm tra xem ngoại lệ có phải là ForbiddenException không
      expect(error).toBeInstanceOf(ForbiddenException);
      // Kiểm tra thông điệp lỗi
      expect(error.response.message).toBe(
        'Bạn chỉ có thể đổi mật khẩu của chính mình',
      );
    }
  });

  it('Ném lỗi nếu Id không hợp lệ ( change user )', async () => {
    const id = 'invalid-id';
    const req = { user: { id: 1 } } as AuthRequest; // Mock req
    const changePasswordDto = {
      oldPassword: '123456',
      newPassword: '654321',
    } as ChangePasswordDto;

    // Spy on global parseInt
    const parseIntSpy = jest.spyOn(global, 'parseInt').mockReturnValue(NaN);

    await expect(
      controller.changePassword(req, id, changePasswordDto),
    ).rejects.toThrow('ID không hợp lệ');

    expect(parseIntSpy).toHaveBeenCalledWith(id, 10); // Kiểm tra parseInt được gọi đúng
    parseIntSpy.mockRestore(); // Khôi phục lại hành vi ban đầu của parseInt
  });

  it('Ném lỗi nếu ID không hợp lệ ( change Admin) ', async () => {
    const id = 'invalid-id';
    const body = { newPassword: 'newPasswordfalse' };
    // Spyon global parseInt
    const parseIntSpy = jest.spyOn(global, 'parseInt').mockReturnValue(NaN);

    await expect(controller.adminChangePassword(id, body)).rejects.toThrow(
      'ID không hợp lệ',
    );

    expect(parseIntSpy).toHaveBeenCalledWith(id, 10);
    parseIntSpy.mockRestore();
  });

  it('Đổi mật khẩu thành công khi user đổi của user', async () => {
    const mockUserId = 1;
    const mockReq = { user: { id: mockUserId } }; // ID trùng với userId trong param
    const userIdFromParam = mockUserId.toString();
    const mockDto = {
      newPassword: 'newPass123',
    };

    (mockAuthService.changePassword as jest.Mock).mockResolvedValue({
      message: 'Mật khẩu đã được thay đổi thành công',
    });

    // Gọi phương thức changePassword
    const result = await controller.changePassword(
      mockReq as any,
      userIdFromParam,
      mockDto as any,
    );

    // Kiểm tra kết quả trả về
    expect(result).toEqual({ message: 'Mật khẩu đã được thay đổi thành công' });
    expect(mockAuthService.changePassword).toHaveBeenCalledWith(
      mockUserId,
      mockDto,
    );
  });

  // Đổi mật khẩu admin
  it('Đổi mật khẩu admin', async () => {
    const mockUserId = 1;
    const mockDto = { newPassword: 'newAdminPass123' };

    (mockAuthService.adminChangePassword as jest.Mock).mockResolvedValue({
      message: 'Đổi mật khẩu admin thành công',
    });

    const result = await controller.adminChangePassword(
      mockUserId.toString(),
      mockDto,
    );

    // Kiểm tra kết quả trả về
    expect(result).toEqual({ message: 'Đổi mật khẩu admin thành công' });

    // Kiểm tra xem phương thức adminChangePassword có được gọi với đúng tham số
    expect(mockAuthService.adminChangePassword).toHaveBeenCalledWith(
      mockUserId,
      mockDto.newPassword,
    );
  });
});
