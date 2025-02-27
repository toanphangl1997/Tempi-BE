import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEmpty, IsNotEmpty, IsString } from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsString({ message: 'username phải là string' })
  @IsNotEmpty({ message: 'username không được trống' })
  username: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Mật khẩu không được trống' })
  @IsString({ message: 'password phải là string' })
  password: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Role không được trống' })
  @IsString({ message: 'role phải là string' })
  role: string;
}

export class LoginDto {
  @ApiProperty()
  @IsString({ message: 'username phải là string' })
  @IsNotEmpty({ message: 'username không được trống' })
  username: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Mật khẩu không được trống' })
  @IsString({ message: 'password phải là string' })
  password: string;
  accessToken?: string;
}
