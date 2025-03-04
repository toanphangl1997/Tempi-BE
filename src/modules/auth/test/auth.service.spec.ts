import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

import { responseSuccess } from 'src/common/helpers/response.helper';
import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

jest.mock('src/common/helpers/response.helper', () => ({
  responseSuccess: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const userData = {
    username: 'admin1',
    password: '1234',
    role: 'admin',
  };

  const mockPrismaService = {
    users: {
      findUnique: jest.fn(),
      create: jest.fn().mockResolvedValue(userData),
      findMany: jest
        .fn()
        .mockResolvedValue([{ username: 'user1', role: 'user' }]),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.mock('bcrypt', () => ({
      hash: jest.fn().mockResolvedValue('hashedPassword'), // Mock hash trả về chuỗi giả lập
      compare: jest.fn().mockResolvedValue(true), // Mock compare mặc định trả về true
    }));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Register API', () => {
    it('đăng ký và trả về dữ liệu user', async () => {
      (mockPrismaService.users.findUnique as jest.Mock).mockResolvedValueOnce(
        null, // Người dùng chưa tồn tại
      );

      const hashSpy = jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('hashedPassword' as never);

      const createdUser = {
        username: 'admin1',
        password: 'hashedPassword', // Đã mã hóa
        role: 'admin',
      };
      (prismaService.users.create as jest.Mock).mockResolvedValueOnce(
        createdUser,
      );

      const expectedResponse = {
        status: 'success',
        code: 200,
        message: 'User registered successfully',
        metaData: createdUser,
        documentApi: 'some-api-endpoint',
      };
      (responseSuccess as jest.Mock).mockReturnValueOnce(expectedResponse);

      const response = await service.signUp(userData);

      expect(response).toEqual(expectedResponse);
      expect(hashSpy).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.users.findUnique).toHaveBeenCalledWith({
        where: { username: 'admin1' },
      });

      expect(mockPrismaService.users.create).toHaveBeenCalledWith({
        data: {
          ...userData,
          password: 'hashedPassword',
          role: 'admin',
        },
      });
    });

    it('đăng ký thất bại và trả về lỗi', async () => {
      (mockPrismaService.users.findUnique as jest.Mock).mockResolvedValueOnce(
        userData,
      );
      const userExist = service.signUp(userData);

      await expect(userExist).rejects.toThrow(
        new BadRequestException('Username đã tồn tại, vui lòng đăng nhập'),
      );

      expect(mockPrismaService.users.findUnique).toHaveBeenCalledWith({
        where: { username: 'admin1' },
      });
    });
  });

  describe('Login API', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should throw BadRequestException if user does not exist', async () => {
      (mockPrismaService.users.findUnique as jest.Mock).mockResolvedValueOnce(
        null,
      );

      await expect(
        service.signIn({ username: 'invaliduser', password: 'password' }),
      ).rejects.toThrowError(
        new BadRequestException('User không hợp lệ, vui lòng đăng ký'),
      );
    });

    it('should throw BadRequestException if password is incorrect', async () => {
      const mockUser = {
        id: 1,
        username: 'admin1',
        password: await bcrypt.hash('1234', 10), // Mật khẩu đã được hash
        role: 'admin',
      };

      (mockPrismaService.users.findUnique as jest.Mock).mockResolvedValueOnce(
        mockUser,
      );
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false as never);

      await expect(
        service.signIn({ username: 'admin1', password: 'wrongpassword' }),
      ).rejects.toThrowError(
        new BadRequestException('Mật khẩu không chính xác'),
      );
    });

    it('should return valid token and user if token is correct', async () => {
      const accessToken = 'validToken';
      const decoded = { id: 1 };
      const userExist = {
        username: 'testuser',
        id: 1,
        password: 'password',
        role: 'user',
      };

      (mockJwtService.verify as jest.Mock).mockReturnValue(decoded);
      (mockPrismaService.users.findUnique as jest.Mock).mockResolvedValue(
        userExist,
      );

      const result = await service.signIn({ accessToken } as any);

      if ('user' in result) {
        // Kiểm tra khi có 'user'
        expect(result.message).toBe('Token hợp lệ');
        expect(result.user).toEqual(userExist);
      } else {
        // Kiểm tra khi không có 'user' (trường hợp đăng nhập thành công mà không có token)
        expect(result.message).toBe('Đăng nhập thành công');
        expect(result.metaData.accessToken).toBeDefined();
        expect(result.metaData.refreshToken).toBeDefined();
      }
    });

    it('should throw UnauthorizedException if token is invalid or expired', async () => {
      const accessToken = 'invalidToken';

      // Giả lập lỗi khi verify token
      (mockJwtService.verify as jest.Mock).mockImplementationOnce(() => {
        throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
      });

      // Kiểm tra xem lỗi UnauthorizedException có được ném ra không
      await expect(service.signIn({ accessToken } as any)).rejects.toThrow(
        new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn'),
      );
    });

    it('should generate accessToken and refreshToken on successful signIn', async () => {
      const mockUser = {
        id: 1,
        username: 'admin1',
        password: await bcrypt.hash('1234', 10),
        role: 'admin',
      };

      // Mock Prisma trả về user đã tồn tại
      (mockPrismaService.users.findUnique as jest.Mock).mockResolvedValueOnce(
        mockUser,
      );

      // Mock bcrypt.compare để trả về true (mật khẩu đúng)
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);

      // Mock jwtService.sign để trả về token
      jest
        .spyOn(mockJwtService, 'sign')
        .mockReturnValueOnce('mockedAccessToken') // Access token
        .mockReturnValueOnce('mockedRefreshToken'); // Refresh token

      const success = responseSuccess();

      // Gọi API signIn
      const result = await service.signIn(mockUser);

      console.log('Result:', result); // Thêm để kiểm tra kết quả trả về

      // Kiểm tra xem token đã được tạo đúng chưa
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { id: mockUser.id, role: mockUser.role },
        { expiresIn: '5m' },
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { id: mockUser.id, role: mockUser.role },
        { expiresIn: '7d' },
      );

      // Kiểm tra kết quả trả về
      expect(result).toEqual(success);
    });
  });

  describe('Get Role', () => {
    it('check role admin & user', async () => {
      const admin = { username: 'admin', role: 'admin' };
      const user = { username: 'user', role: 'user' };

      mockPrismaService.users.findUnique = jest
        .fn()
        .mockResolvedValueOnce(admin)
        .mockResolvedValueOnce(user);

      const result = await service.getRole(admin.username, user.username);

      // Kiểm tra nếu result là một mảng (khi admin không cung cấp userUsername)
      if (Array.isArray(result)) {
        // Kiểm tra từng người dùng trong mảng
        const targetUser = result.find((u) => u.username === 'user');
        expect(targetUser).toBeDefined();
        expect(targetUser?.username).toBe('user');
        expect(targetUser?.role).toBe('user');
      } else {
        // Nếu result là một đối tượng (trường hợp user cung cấp hoặc tự kiểm tra)
        expect(result.username).toBe('user');
        expect(result.role).toBe('user');
      }
    });

    it('should throw NotFoundException if admin does not exist', async () => {
      (mockPrismaService.users.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getRole('admin1')).rejects.toThrow(
        new NotFoundException('Không tìm thấy admin'),
      );
    });

    it('should return a list of users if admin does not provide userUsername', async () => {
      const mockAdmin = { username: 'admin1', role: 'admin' };
      const mockUsers = [
        { username: 'user1', role: 'user' },
        { username: 'user2', role: 'user' },
      ];

      (mockPrismaService.users.findUnique as jest.Mock).mockResolvedValue(
        mockAdmin,
      );
      (mockPrismaService.users.findMany as jest.Mock).mockResolvedValue(
        mockUsers,
      );

      const result = await service.getRole('admin1');

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.users.findMany).toHaveBeenCalledWith({
        where: { role: 'user' },
        select: { username: true, role: true },
      });
    });

    it('should return user role if admin provides userUsername', async () => {
      const mockAdmin = { username: 'admin1', role: 'admin' };
      const mockUser = { username: 'user1', role: 'user' };

      (mockPrismaService.users.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockAdmin) // Trả về admin
        .mockResolvedValueOnce(mockUser); // Trả về user cần tìm

      const result = await service.getRole('admin1', 'user1');

      expect(result).toEqual({ username: 'user1', role: 'user' });
    });

    it('should throw NotFoundException if the target user does not exist', async () => {
      const mockAdmin = { username: 'admin1', role: 'admin' };

      (mockPrismaService.users.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockAdmin) // Trả về admin hợp lệ
        .mockResolvedValueOnce(null); // Không tìm thấy user cần kiểm tra

      await expect(service.getRole('admin1', 'userNotExist')).rejects.toThrow(
        new NotFoundException('Không tìm thấy user'),
      );
    });

    it('should throw ForbiddenException if user tries to check another user role', async () => {
      const mockUser = { username: 'user1', role: 'user' };
      const anotherUser = { username: 'user2', role: 'user' };

      (mockPrismaService.users.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser) // Trả về user đang check
        .mockResolvedValueOnce(anotherUser); // Trả về user khác

      await expect(service.getRole('user1', 'user2')).rejects.toThrow(
        new ForbiddenException('Không có quyền truy cập'),
      );
    });
  });

  describe('Change Password User with User', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(prismaService.users, 'findUnique').mockResolvedValue(null);

      await expect(
        service.changePassword(1, { oldPassword: '1234', newPassword: '5678' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if old password is incorrect ( user )', async () => {
      const mockUser = { id: 1, password: await bcrypt.hash('1234', 10) };

      jest
        .spyOn(prismaService.users, 'findUnique')
        .mockResolvedValue(mockUser as never);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.changePassword(1, {
          oldPassword: 'wrong-pass',
          newPassword: '5678',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update password successfully ( user )', async () => {
      const mockUser = { id: 1, password: await bcrypt.hash('1234', 10) };
      jest
        .spyOn(prismaService.users, 'findUnique')
        .mockResolvedValue(mockUser as never);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest
        .spyOn(service, 'hashPassword' as never)
        .mockResolvedValue('hashed-new-password' as never);
      jest.spyOn(prismaService.users, 'update').mockResolvedValue({
        ...mockUser,
        password: 'hashed-new-password',
      } as never);

      const result = await service.changePassword(1, {
        oldPassword: '1234',
        newPassword: '5678',
      });

      expect(prismaService.users.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password: 'hashed-new-password' },
      });

      expect(result).toEqual({ message: 'Đổi mật khẩu thành công' });
    });
  });

  describe('Change Password Admin', () => {
    it('should throw NotFoundException if user does not exits', async () => {
      jest.spyOn(prismaService.users, 'findUnique').mockResolvedValueOnce(null);

      await expect(
        service.changePassword(1, { oldPassword: '1234', newPassword: '5678' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if old password is incorrect ( admin )', async () => {
      const mockUser = { id: 1, password: await bcrypt.hash('1234', 10) };

      jest
        .spyOn(prismaService.users, 'findUnique')
        .mockResolvedValue(mockUser as never);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.changePassword(1, {
          oldPassword: 'wrong-pass',
          newPassword: '5678',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update password successfully ( admin )', async () => {
      const mockUser = { id: 1, password: await bcrypt.hash('1234', 10) };
      jest
        .spyOn(prismaService.users, 'findUnique')
        .mockResolvedValue(mockUser as never);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest
        .spyOn(service, 'hashPassword' as never)
        .mockResolvedValue('hashed-new-password' as never);
      jest.spyOn(prismaService.users, 'update').mockResolvedValue({
        ...mockUser,
        password: 'hashed-new-password',
      } as never);

      const result = await service.adminChangePassword(1, mockUser as never);

      expect(prismaService.users.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password: 'hashed-new-password' },
      });

      expect(result).toEqual({ message: 'Admin đã đổi mật khẩu thành công' });
    });
  });
});
