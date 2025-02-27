import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  UseGuards,
  Patch,
  Request,
  Param,
  Req,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard, JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-pasword.dto';
import { AuthRequest } from './interfaces/auth-request.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Register

  @Post('register')
  signUp(@Body() register: RegisterDto) {
    return this.authService.signUp(register);
  }

  // Sign In
  @Post('login')
  @ApiBearerAuth() //  Yêu cầu Bearer token cho API này
  signIn(@Body() login: LoginDto) {
    return this.authService.signIn(login);
  }

  // Authorization ( role )

  @Get('role')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard) // Token trước truy cập sau
  async getRole(
    @Query('admin') adminUsername: string,
    @Query('user') userUsername?: string,
  ) {
    return this.authService.getRole(adminUsername, userUsername);
  }

  // Change pass user
  @UseGuards(JwtAuthGuard)
  @Patch('change-password/:id')
  async changePassword(
    @Req() req: AuthRequest, // Dùng AuthRequest thay vì Request
    @Param('id') id: string,
    @Body() changePassword: ChangePasswordDto,
  ) {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) throw new BadRequestException('ID không hợp lệ');

    if (req.user.id !== userId) {
      throw new ForbiddenException(
        'Bạn chỉ có thể đổi mật khẩu của chính mình',
      );
    }

    return this.authService.changePassword(userId, changePassword);
  }

  // Change pass admin
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('admin/change-password/:id')
  async adminChangePassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
  ) {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) throw new BadRequestException('ID không hợp lệ');

    return this.authService.adminChangePassword(userId, body.newPassword);
  }
}
