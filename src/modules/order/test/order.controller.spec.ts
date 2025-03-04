import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from '../order.controller';
import { OrderService } from '../order.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CreateOrderDto } from '../dto/order.dto';

describe('OrderController', () => {
  let controller: OrderController;
  let service: OrderService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockOrder = {
    id: 1,
    address: '17 Thống Nhất',
    user_id: 1,
    phone: '0353570099',
    total_price: 1,
    // created_at: Date | null;
  };

  const mockUser = {
    id: 1,
    username: 'aloha',
    password: '1234',
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockOrderService = {
    getOrders: jest.fn().mockResolvedValueOnce(mockOrder),
    postOrder: jest.fn().mockResolvedValueOnce(mockOrder),
    updateOrder: jest.fn().mockResolvedValueOnce(mockOrder),
    deleteOrder: jest.fn().mockResolvedValueOnce({ deleted: true }),
  };

  const mockReq = {
    user: mockUser,
    headers: {},
    body: {},
    params: {},
    query: {},
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Get All Order', () => {
    it('should get all order', async () => {
      const result = await controller.getOrders(mockOrder);
      expect(service.getOrders).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it('Post Order', async () => {
      const newOrder = {
        id: 1,
        address: '17 Thống Nhất',
        user_id: 1,
        phone: '0353570099',
        total_price: 1,
        // created_at: Date | null;
      };
      mockOrderService.postOrder = jest.fn().mockResolvedValueOnce(mockOrder);
      const result = await controller.postOrder(
        Object.assign(new CreateOrderDto(), newOrder),
        mockUser as never,
      );

      expect(service.postOrder).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it('Put Order By Id', async () => {
      const param = '1';
      const updateOrder = {
        phone: '03535700999',
        total_price: 123,
        address: '17 Thống Nhất',
      };

      jest
        .spyOn(service, 'updateOrder')
        .mockResolvedValueOnce(mockOrder as never);

      const result = await controller.updateOrder(
        param as never,
        updateOrder as never,
      );

      expect(service.updateOrder).toHaveBeenCalledWith(param, updateOrder);
      expect(result).toEqual(mockOrder);
    });

    it('Delete Order By ID', async () => {
      const param = '1';
      const req = { user: mockUser } as any;

      jest
        .spyOn(service, 'deleteOrder')
        .mockResolvedValueOnce(mockOrder as never);

      const result = await controller.deleteOrder(param, req);

      expect(service.deleteOrder).toHaveBeenCalledWith(param, req.user);
      expect(result).toEqual({ deleted: true });
    });
  });
});
