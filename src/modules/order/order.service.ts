import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateOrderDto, UpdateOrderDto } from './dto/order.dto';
import { responseSuccess } from 'src/common/helpers/response.helper';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  // Get order (user & admin)

  async getOrders(user: any) {
    if (user.role === 'admin') {
      const orders = await this.prisma.orders.findMany({
        include: { users: true },
      });

      const newOrders = orders.map((order) => ({
        ...order,
        id: order.id.toString(), // Chuyển BigInt thành String
      }));

      return responseSuccess(
        newOrders,
        'Lấy danh sách đơn hàng thành công',
        200,
      );
    }

    // Nếu là user thông thường, chỉ lấy đơn hàng của người đó
    const orders = await this.prisma.orders.findMany({
      where: { user_id: user.id },
      include: { users: true },
    });

    // Chuyển đổi BigInt thành String cho mỗi order
    const newOrders = orders.map((order) => ({
      ...order,
      id: order.id.toString(),
    }));

    return responseSuccess(newOrders, 'Lấy danh sách đơn hàng thành công', 200);
  }

  // Post order (user & admin)
  async postOrder(body: CreateOrderDto, user: any) {
    try {
      if (!user || !user.id) {
        throw new BadRequestException(
          'User chưa đăng nhập hoặc token không hợp lệ',
        );
      }

      const phone = await this.prisma.phones.findFirst({
        where: { model: body.phone },
      });

      if (!phone) {
        throw new BadRequestException('Điện thoại không tồn tại');
      }

      // Lấy giá của điện thoại từ cơ sở dữ liệu, không cho phép người dùng thay đổi
      const totalPrice = phone.price;

      // Tạo đơn hàng với thông tin người dùng
      const newOrder = await this.prisma.orders.create({
        data: {
          user_id: user.id,
          phone: phone.model,
          total_price: totalPrice,
          address: body.address,
        },
      });

      const responseData = {
        newOrder: {
          ...newOrder,
          id: newOrder.id.toString(), // Chuyển BigInt thành string
        },
      };

      return responseSuccess(responseData, 'Tạo đơn hàng thành công', 200);
    } catch (error) {
      console.error('Lỗi khi tạo đơn hàng:', error);
      throw new BadRequestException('Không thể tạo đơn hàng');
    }
  }
  // Put order ( user & admin )
  async updateOrder(orderId: number, body: UpdateOrderDto) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    const phone = await this.prisma.phones.findFirst({
      where: { model: body.phone },
    });

    if (!phone) {
      throw new BadRequestException('Điện thoại không tồn tại');
    }

    const updatedOrder = await this.prisma.orders.update({
      where: { id: orderId },
      data: {
        phone: phone.model,
        total_price: phone.price,
        address: body.address,
      },
    });

    // Chuyển đổi BigInt thành String trong response để tránh lỗi serialize
    const responseData = {
      updatedOrder: {
        ...updatedOrder,
        id: updatedOrder.id.toString(),
      },
    };

    return responseSuccess(
      responseData,
      `Cập nhật đơn hàng với ID = ${orderId} thành công`,
    );
  }

  // Delete Order ( admin )
  async deleteOrder(id: string, user: any) {
    const number = parseInt(id, 10);
    if (isNaN(number)) {
      throw new BadRequestException('ID phải là số');
    }

    const order = await this.prisma.orders.findUnique({
      where: { id: number },
    });
    if (!order) {
      throw new BadRequestException('Đơn hàng không tồn tại');
    }

    await this.prisma.orders.delete({ where: { id: number } });
    return responseSuccess(null, `Xóa đơn hàng thành công với Id = ${id}`, 200);
  }
}
