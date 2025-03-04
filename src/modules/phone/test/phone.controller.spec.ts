import { Test, TestingModule } from '@nestjs/testing';
import { PhoneController } from '../phone.controller';
import { PhoneService } from '../phone.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CreatePhoneDto } from '../dto/phone.dto';
import { PhoneModule } from '../phone.module';
import { Param } from '@nestjs/common';

describe('PhoneController', () => {
  let controller: PhoneController;
  let service: PhoneService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockPhone = {
    id: 1,
    brand: 'Apple',
    model: 'Iphone',
    price: 100,
    storage: 1080,
    ram: 256,
    battery: 1000,
    os: 'IOS',
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

  const mockPhoneService = {
    getPhone: jest.fn().mockResolvedValueOnce(mockPhone),
    postPhone: jest.fn(),
    updatePhone: jest.fn(),
    deletePhone: jest.fn().mockResolvedValueOnce({ deleted: true }),
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
      controllers: [PhoneController],
      providers: [
        {
          provide: PhoneService,
          useValue: mockPhoneService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<PhoneController>(PhoneController);
    service = module.get<PhoneService>(PhoneService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Get All Phone', () => {
    it('should get all phones', async () => {
      const result = await controller.getPhone();

      expect(service.getPhone).toHaveBeenCalled();
      expect(result).toEqual(mockPhone);
    });

    it('Post Phone By ID', async () => {
      const newPhone = {
        brand: 'Apple',
        model: 'Iphone',
        price: 100,
        storage: 1080,
        ram: 256,
        battery: 1000,
        os: 'IOS',
      };

      mockPhoneService.postPhone = jest.fn().mockResolvedValueOnce(mockPhone);
      const result = await controller.postPhone(
        Object.assign(new CreatePhoneDto(), newPhone),
        mockUser as never,
      );

      expect(service.postPhone).toHaveBeenCalled();
      expect(result).toEqual(mockPhone);
    });

    // it('getPhoneByID',async() => {
    //   const result = await controller.getPhoneByID(mockPhone._id);

    //   expect(service.findById).toHaveBeenCalled();
    //   expect(result).toEqual(mockPhone)
    // })

    it('Put Phone By ID', async () => {
      const param = '1'; // ID dưới dạng string
      const req = { user: mockUser } as any; // Mock request có user

      const updatePhone = {
        brand: 'Apple',
        model: 'Iphone',
        price: 100,
        storage: 1080,
        ram: 256,
        battery: 1000,
        os: 'IOS',
      };

      jest
        .spyOn(service, 'updatePhone')
        .mockResolvedValueOnce(mockPhone as never);

      const result = await controller.updatePhone(
        param,
        updatePhone as never,
        req,
      );

      expect(service.updatePhone).toHaveBeenCalledWith(
        param,
        updatePhone,
        req.user,
      );
      expect(result).toEqual(mockPhone);
    });

    it('Delete Phone By ID', async () => {
      const param = '1'; // ID của điện thoại cần xóa
      const req = { user: mockUser } as any; // Mock request với user

      jest
        .spyOn(service, 'deletePhone')
        .mockResolvedValueOnce(mockPhone as never);

      const result = await controller.removePhone(param, req);

      expect(service.deletePhone).toHaveBeenCalledWith(param, req.user);
      expect(result).toEqual({ deleted: true });
    });
  });
});
