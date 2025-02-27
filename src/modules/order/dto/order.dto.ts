import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDateString, IsDecimal } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'Tên model của điện thoại' })
  @IsNotEmpty({ message: 'Điện thoại không được để trống' })
  @IsString({ message: 'Điện thoại phải là string' })
  phone: string;

  @ApiProperty({ description: 'Địa chỉ' })
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  @IsString({ message: 'Địa chỉ phải là string' })
  address: string;

  // @ApiProperty({ description: 'Thời gian' })
  // @IsNotEmpty({ message: 'Thời gian không được để trống' })
  // @IsDateString({}, { message: 'Thời gian phải là định dạng ngày hợp lệ' })
  // created_at: string;
}

export class UpdateOrderDto {
  @ApiProperty({ description: 'Tên model của điện thoại' })
  @IsNotEmpty({ message: 'Điện thoại không được để trống' })
  @IsString({ message: 'Điện thoại phải là string' })
  phone: string;

  @ApiProperty({ description: 'Địa chỉ giao hàng' })
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  @IsString({ message: 'Địa chỉ phải là string' })
  address: string;
}
