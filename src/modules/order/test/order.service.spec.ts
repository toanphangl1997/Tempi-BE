import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from '../order.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { responseSuccess } from 'src/common/helpers/response.helper';
import { CreateOrderDto, UpdateOrderDto } from '../dto/order.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('src/common/helpers/response.helper', () => ({
  responseSuccess: jest.fn().mockReturnValue({
    success: true,
    data: {
      newOrder: {
        address: '123 ABC Street',
        id: '1', // Chuyển BigInt thành string
        phone: 'iPhone 14',
        total_price: 1000,
        user_id: 1,
      },
    },
    message: 'Tạo đơn hàng thành công',
    statusCode: 200,
  }),
}));

describe('OrderService', () => {
  let service: OrderService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockPrismaService = {
    orders: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    phones: {
      findFirst: jest.fn(),
    },
  };

  const orderData = [
    {
      id: 1,
      user_id: 1,
      phone: '0353570099',
      total_price: 1234321,
      address: '17 Thống Nhất',
    },
  ];

  const mockJwtService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
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

    service = module.get<OrderService>(OrderService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Get Order', () => {
    it('should return orders successfully for admin', async () => {
      const user = { id: 1, role: 'admin' };

      (prisma.orders.findMany as jest.Mock).mockResolvedValue(orderData);

      const success = responseSuccess();

      const result = await service.getOrders(user);
      expect(result).toEqual(success);
      expect(prisma.orders.findMany).toHaveBeenCalledWith({
        include: { users: true },
      });
    });

    it('should return orders successfully for normal user', async () => {
      const user = { id: 1, role: 'user' };

      (prisma.orders.findMany as jest.Mock).mockResolvedValue(orderData);

      const success = responseSuccess();
      const result = await service.getOrders(user);
      expect(result).toEqual(success);
      expect(prisma.orders.findMany).toHaveBeenCalledWith({
        where: { user_id: user.id },
        include: { users: true },
      });
    });
  });

  describe('Post Order', () => {
    let user;
    let body;
    const phoneData = { model: 'iPhone 14', price: 1000 };
    const orderData = {
      id: BigInt(1),
      user_id: 1,
      phone: phoneData.model,
      total_price: phoneData.price,
      address: '123 ABC Street',
    };

    beforeEach(() => {
      user = { id: 1, role: 'user' }; // Đảm bảo `user` có id hợp lệ
      body = { phone: 'iPhone 14', address: '123 ABC Street' };
    });

    it('should throw an error if user is not logged in', async () => {
      await expect(service.postOrder(body, null)).rejects.toThrow(
        'User chưa đăng nhập hoặc token không hợp lệ',
      );
    });

    it('should throw an error if phone does not exist', async () => {
      const user = { id: 1, role: 'admin' };
      const body = { phone: 'NonExistentPhone', address: '123 ABC Street' };

      (prisma.phones.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.postOrder(body, user)).rejects.toThrow(
        'Điện thoại không tồn tại',
      );

      expect(prisma.phones.findFirst).toHaveBeenCalledWith({
        where: { model: body.phone },
      });
      expect(prisma.orders.create).not.toHaveBeenCalled();
    });

    it('should return post order successfully when phone exists', async () => {
      (prisma.phones.findFirst as jest.Mock).mockResolvedValue(phoneData);
      (prisma.orders.create as jest.Mock).mockResolvedValue(orderData);

      const expectedResponse = {
        success: true,
        data: {
          newOrder: {
            ...orderData,
            id: orderData.id.toString(), // Chuyển BigInt thành string
          },
        },
        message: 'Tạo đơn hàng thành công',
        statusCode: 200,
      };

      const result = await service.postOrder(body, user);

      expect(result).toEqual(expectedResponse);
      expect(prisma.phones.findFirst).toHaveBeenCalledWith({
        where: { model: body.phone },
      });
      expect(prisma.orders.create).toHaveBeenCalledWith({
        data: {
          user_id: user.id,
          phone: phoneData.model,
          total_price: phoneData.price,
          address: body.address,
        },
      });
    });

    it('should throw an error if an exception occurs when creating the order', async () => {
      const errorMessage = 'Database error';
      (prisma.phones.findFirst as jest.Mock).mockResolvedValue(phoneData);
      (prisma.orders.create as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(service.postOrder(body, user)).rejects.toThrow(
        'Không thể tạo đơn hàng',
      );
      expect(prisma.orders.create).toHaveBeenCalledWith({
        data: {
          user_id: user.id,
          phone: phoneData.model,
          total_price: phoneData.price,
          address: body.address,
        },
      });
    });
  });

  describe('Put Order', () => {
    it('should update order successfully when order and phone exist', async () => {
      const orderId = 1;
      const body: UpdateOrderDto = {
        phone: 'iPhone 13',
        address: '456 XYZ Avenue',
      };

      // Mock dữ liệu trả về từ Prisma
      const orderData = {
        id: orderId,
        user_id: 1,
        phone: 'iPhone 14',
        total_price: 1000,
        address: '123 ABC Street',
      };
      const phoneData = { model: 'iPhone 13', price: 800 };

      // Mock phương thức trả về khi gọi Prisma
      (prisma.orders.findUnique as jest.Mock).mockResolvedValue(orderData); // Mock dữ liệu đơn hàng
      (prisma.phones.findFirst as jest.Mock).mockResolvedValue(phoneData); // Mock dữ liệu điện thoại
      const updatedOrderData = {
        ...orderData,
        phone: phoneData.model,
        total_price: phoneData.price,
        address: body.address,
      };
      (prisma.orders.update as jest.Mock).mockResolvedValue(updatedOrderData); // Mock cập nhật đơn hàng

      // Gọi phương thức updateOrder
      const result = await service.updateOrder(orderId, body);

      // Đáp ứng mong đợi
      const success = responseSuccess();

      // Kiểm tra kết quả trả về
      expect(result).toEqual(success);
      expect(prisma.orders.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
      });
      expect(prisma.phones.findFirst).toHaveBeenCalledWith({
        where: { model: body.phone },
      });
      expect(prisma.orders.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: {
          phone: phoneData.model,
          total_price: phoneData.price,
          address: body.address,
        },
      });
    });

    it('should throw NotFoundException if order not exist', async () => {
      const orderId = 1;
      const body: UpdateOrderDto = {
        phone: 'iPhone 13',
        address: '456 XYZ Avenue',
      };

      (prisma.orders.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.updateOrder(orderId, body)).rejects.toThrow(
        new NotFoundException('Đơn hàng không tồn tại'),
      );
    });

    it('should throw NotFoundException if phone not exist', async () => {
      const orderId = 1;
      const body: UpdateOrderDto = {
        phone: 'iPhone 13',
        address: '456 XYZ Avenue',
      };
      // Mock trả về đơn hàng hợp lệ
      (prisma.orders.findUnique as jest.Mock).mockResolvedValue({
        id: orderId,
        user_id: 1,
        phone: 'iPhone 14',
        total_price: 1000,
        address: '123 ABC Street',
      });

      (prisma.phones.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.updateOrder(orderId, body)).rejects.toThrow(
        new BadRequestException('Điện thoại không tồn tại'),
      );
    });
  });

  describe('Delete Order', () => {
    it('should delete order successfully when order exist', async () => {
      const id = '1';
      const user = 1;

      (prisma.orders.findUnique as jest.Mock).mockResolvedValue(id);

      (prisma.orders.delete as jest.Mock).mockResolvedValue(id);

      const success = responseSuccess();
      const result = await service.deleteOrder(id, user);
      expect(result).toEqual(success);
    });

    it('should throw NotFoundException if order not exist', async () => {
      const id = '1';
      const user = 1;

      (prisma.orders.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.deleteOrder(id, user)).rejects.toThrow(
        new BadRequestException('Đơn hàng không tồn tại'),
      );
    });

    it('should throw BadRequestException if ID is not a number', async () => {
      const invalidId = 'abc'; // ID không phải số
      const user = { id: 1, role: 'admin' };

      // Kiểm tra nếu phương thức ném lỗi
      await expect(service.deleteOrder(invalidId, user)).rejects.toThrow(
        new BadRequestException('ID phải là số'),
      );
    });
  });
});
