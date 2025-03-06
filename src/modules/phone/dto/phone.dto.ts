import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePhoneDto {
  // @ApiProperty({ description: 'ID của Phone' })
  // @IsNotEmpty({ message: 'ID không được để trống' })
  // @IsNumber({}, { message: 'ID phải là số' })
  // id: number;
  // id: number;
  // id: number;

  @ApiProperty({ description: 'Tên brand' })
  @IsNotEmpty({ message: 'brand không được để trống' })
  @IsString({ message: 'brand phải là string' })
  brand: string;

  @ApiProperty({ description: 'Tên model' })
  @IsNotEmpty({ message: 'model không được để trống' })
  @IsString({ message: 'model phải là string' })
  model: string;

  @ApiProperty({ description: 'Giá' })
  @IsNotEmpty({ message: 'price không được để trống' })
  @IsString({ message: 'price phải là string' })
  price: string;

  @ApiProperty({ description: 'Storage' })
  @IsNotEmpty({ message: 'storage không được để trống' })
  @IsNumber({}, { message: 'storage phải là number' })
  storage: number;

  @ApiProperty({ description: 'Ram' })
  @IsNotEmpty({ message: 'id_vi_tri không được để trống' })
  @IsNumber({}, { message: 'ram phải là number' })
  ram: number;

  @ApiProperty({ description: 'Battery' })
  @IsNotEmpty({ message: 'battery không được để trống' })
  @IsNumber({}, { message: 'battery phải là number' })
  battery: number;

  @ApiProperty({ description: 'OS' })
  @IsNotEmpty({ message: 'os không được để trống' })
  @IsString({ message: 'os phải là string' })
  os: string;
}
