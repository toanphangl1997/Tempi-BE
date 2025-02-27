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

    const userExist = await this.prisma.users.findFirst({
      where: {
        username: username,
      },
    });

    if (userExist)
      throw new BadRequestException('username đã tồn tại,vui lòng đăng nhập');
    // console.log({ userExist });
    //  Mã hóa password
    const hashPassword = bcrypt.hashSync(password, 10);

    // Tạo người dùng mới ( tạo dữ liệu vào trong db)
    const userNew = await this.prisma.users.create({
      data: {
        username: username,
        role: role,
        password: hashPassword,
      },
    });
    // console.log(userNew);

    return responseSuccess(userNew, 'Đăng ký thành công', 200);
  }

  // * Login *

  async signIn(login: LoginDto) {
    const { username, password, accessToken } = login;

    // Nếu có accessToken,xác thực
    if (accessToken) {
      try {
        const decoded = this.jwtService.verify(accessToken);
        const userExist = await this.prisma.users.findFirst({
          where: { id: decoded.id },
          select: { username: true, id: true, password: true },
        });

        if (!userExist) throw new BadRequestException('Token không hợp lệ');
        return { message: 'Token hợp lệ', user: userExist };
      } catch (error) {
        throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
      }
    }

    const userExist = await this.prisma.users.findFirst({
      where: {
        username: username,
      },
      select: {
        username: true,
        id: true,
        password: true,
        role: true,
      },
    });

    if (!userExist)
      throw new BadRequestException('user không hợp lệ, vui lòng đăng ký');

    // Check Password
    const passHash = userExist.password;
    const isPassword = bcrypt.compareSync(password, passHash);
    if (!isPassword) throw new BadRequestException('Mật khẩu không chính xác');
    console.log(passHash), console.log(isPassword);

    // create token and refreshToken
    const newAccessToken = this.jwtService.sign(
      {
        id: userExist.id,
        role: userExist.role,
      },
      {
        expiresIn: '5m',
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        id: userExist.id,
        role: userExist.role,
      },
      {
        expiresIn: '7d',
      },
    );

    return responseSuccess(
      { accessToken: newAccessToken, refreshToken },
      'Đăng nhập thành công',
      200,
    );
  }

  // * Role *

  async getRole(adminUsername: string, userUsername?: string) {
    const admin = await this.prisma.users.findFirst({
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
    const targetUser = await this.prisma.users.findFirst({
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
