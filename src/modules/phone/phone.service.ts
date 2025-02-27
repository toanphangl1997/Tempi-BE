import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreatePhoneDto } from './dto/phone.dto';
import { responseSuccess } from 'src/common/helpers/response.helper';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PhoneService {
  constructor(
    public prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Get Phone
  async getPhone() {
    try {
      const getPhone = await this.prisma.phones.findMany();
      return responseSuccess(
        getPhone,
        'Lấy danh sách điện thoại thành công',
        200,
      );
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Lỗi khi tìm dữ liệu');
    }
  }

  // post phone
  async postPhone(body: CreatePhoneDto, user: any) {
    console.log('User', user);
    try {
      if (!user || !user.id) {
        throw new UnauthorizedException(
          'User chưa đăng nhập hoặc token không hợp lệ',
        );
      }

      // Tạo điện thoại mới
      const newPhone = await this.prisma.phones.create({
        data: {
          brand: body.brand,
          model: body.model,
          price: body.price,
          storage: body.storage,
          battery: body.battery,
          ram: body.ram,
          os: body.os,
        },
      });

      // Chuyển đổi BigInt thành String để tránh lỗi khi serialize JSON
      const responseData = {
        newPhone: {
          ...newPhone,
          id: newPhone.id.toString(),
        },
      };

      return responseSuccess(responseData, 'Thêm điện thoại thành công', 200);
    } catch (error) {
      console.error('Lỗi khi tạo điện thoại:', error);
      throw new BadRequestException('Không thể thêm điện thoại');
    }
  }

  // Put Phone ( admin )
  async updatePhone(id: string, body: CreatePhoneDto, user: any) {
    const number = parseInt(id, 10);

    if (isNaN(number)) {
      throw new BadRequestException('ID phải là số');
    }

    try {
      const phone = await this.prisma.phones.findUnique({
        where: { id: number },
      });

      if (!phone) {
        throw new BadRequestException(
          `Phone với ID = ${number} không tồn tại.`,
        );
      }

      const updatedPhone = await this.prisma.phones.update({
        where: { id: number },
        data: {
          brand: body.brand,
          model: body.model,
          price: body.price,
          storage: body.storage,
          battery: body.battery,
          ram: body.ram,
          os: body.os,
        },
      });

      return responseSuccess(
        updatedPhone,
        'Cập nhật thông tin điện thoại thành công',
        200,
      );
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Không thể cập nhật thông tin điện thoại');
    }
  }

  // Delete Phone ( admin )
  async deletePhone(id: string, user: any) {
    const number = parseInt(id, 10);

    if (isNaN(number)) {
      throw new BadRequestException('ID phải là số');
    }

    try {
      const phone = await this.prisma.phones.findUnique({
        where: { id: number },
      });

      if (!phone) {
        throw new BadRequestException(
          `Phone với ID = ${number} không tồn tại.`,
        );
      }

      const removePhone = await this.prisma.phones.delete({
        where: { id: number },
      });
      console.log({ removePhone });

      return responseSuccess(
        removePhone,
        `Xóa phone thành công với id = ${number}`,
        200,
      );
    } catch (error) {
      console.error(error);
      throw new BadRequestException(` Không tìm thấy phone với id = ${number}`);
    }
  }
}
