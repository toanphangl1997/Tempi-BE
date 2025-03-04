import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { responseSuccess } from 'src/common/helpers/response.helper';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/change-pasword.dto';

@Injectable()
export class AuthService {
  constructor(
    public prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Hàm dùng để hash mật khẩu
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  // * Register *

  async signUp(register: RegisterDto) {
    const { username, password, role } = register;

    // Kiểm tra username đã tồn tại chưa
    const userExist = await this.prisma.users.findUnique({
      where: { username },
    });

    if (userExist) {
      throw new BadRequestException('Username đã tồn tại, vui lòng đăng nhập');
    }

    // Mã hóa mật khẩu bất đồng bộ
    const hashPassword = await bcrypt.hash(password, 10);

    // Tạo người dùng mới
    const userNew = await this.prisma.users.create({
      data: {
        username,
        role,
        password: hashPassword,
      },
    });

    return responseSuccess(userNew, 'Đăng ký thành công', 200);
  }

  // * Login *

  async signIn(login: LoginDto) {
    const { username, password, accessToken } = login;

    // Nếu có accessToken, xác thực ngay
    if (accessToken) {
      try {
        const decoded = this.jwtService.verify(accessToken);
        const userExist = await this.prisma.users.findUnique({
          where: { id: decoded.id },
          select: { username: true, id: true, password: true, role: true },
        });

        if (!userExist) throw new BadRequestException('Token không hợp lệ');
        return { message: 'Token hợp lệ', user: userExist };
      } catch (error) {
        throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
      }
    }

    // Kiểm tra xem user có tồn tại không
    const userExist = await this.prisma.users.findUnique({
      where: { username },
      select: { username: true, id: true, password: true, role: true },
    });

    if (!userExist) {
      throw new BadRequestException('User không hợp lệ, vui lòng đăng ký');
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, userExist.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu không chính xác');
    }

    // Tạo accessToken & refreshToken
    const payload = { id: userExist.id, role: userExist.role };

    const newAccessToken = this.jwtService.sign(payload, { expiresIn: '5m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const result = responseSuccess(
      { accessToken: newAccessToken, refreshToken: refreshToken },
      'Đăng nhập thành công',
      200,
    );
    console.log('Response Success:', result);
    return result;
  }

  // * Role *

  async getRole(adminUsername: string, userUsername?: string) {
    const admin = await this.prisma.users.findUnique({
      where: { username: adminUsername },
    });
    if (!admin) {
      throw new NotFoundException('Không tìm thấy admin');
    }

    // Nếu admin không cung cấp user, trả về danh sách user
    if (admin.role === 'admin' && !userUsername) {
      const users = await this.prisma.users.findMany({
        where: { role: 'user' },
        select: {
          username: true,
          role: true,
        },
      });
      return users;
    }
    // Nếu admin cung cấp user hoặc user tự kiểm tra mình
    const targetUser = await this.prisma.users.findUnique({
      where: {
        username: userUsername || adminUsername,
      },
    });
    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy user');
    }

    // Nếu là admin hoặc user tự kiểm tra mình
    if (admin.role === 'admin' || adminUsername === userUsername) {
      return { username: targetUser.username, role: targetUser.role };
    }

    throw new ForbiddenException('Không có quyền truy cập');
  }

  // Change pass user
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User không tồn tại');

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) throw new BadRequestException('Mật khẩu cũ không đúng');

    // Hash mật khẩu mới
    const hashedPassword = await this.hashPassword(dto.newPassword);

    // Cập nhật mật khẩu
    await this.prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Đổi mật khẩu thành công' };
  }

  // Change pass admin
  async adminChangePassword(userId: number, newPassword: string) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User không tồn tại');

    // Hash mật khẩu mới
    const hashedPassword = await this.hashPassword(newPassword);

    // Cập nhật mật khẩu
    await this.prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Admin đã đổi mật khẩu thành công' };
  }
}
