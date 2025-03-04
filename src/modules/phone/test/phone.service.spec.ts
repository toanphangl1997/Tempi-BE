import { Test, TestingModule } from '@nestjs/testing';
import { PhoneService } from '../phone.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { responseSuccess } from 'src/common/helpers/response.helper';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { CreatePhoneDto } from '../dto/phone.dto';
import { Mock } from 'node:test';

jest.mock('src/common/helpers/response.helper', () => ({
  responseSuccess: jest.fn(),
}));

describe('PhoneService', () => {
  let service: PhoneService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockPrismaService = {
    phones: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const phoneData = {
    id: 1,
    brand: 'string',
    model: 'stiring',
    price: '1234321',
    storage: 1008,
    ram: 32,
    battery: 1880,
    os: 'IOS',
  };

  const mockJwtService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhoneService,
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

    service = module.get<PhoneService>(PhoneService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Get Phone', () => {
    it('should return a list of phones successfully', async () => {
      // Mock findMany để trả về danh sách điện thoại
      (prisma.phones.findMany as jest.Mock).mockResolvedValueOnce(phoneData);

      const result = await service.getPhone();

      const success = responseSuccess();
      expect(result).toEqual(success);
      expect(prisma.phones.findMany).toHaveBeenCalled();
    });

    it('should throw BadRequestException if there is an error', async () => {
      // Mock để gặp lỗi
      (prisma.phones.findMany as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.getPhone).rejects.toThrow(
        new BadRequestException('Lỗi khi tìm dữ liệu'),
      );
    });
  });

  describe('Post Phone', () => {
    it('should return post phones successfully', async () => {
      const body = CreatePhoneDto;
      const user = { id: 1 };
      // Mock create để trả về dữ liệu điện thoại mới
      (prisma.phones.create as jest.Mock).mockResolvedValueOnce(phoneData);

      const result = await service.postPhone(body as never, user);

      const success = responseSuccess();
      expect(result).toEqual(success);
      expect(prisma.phones.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const body = CreatePhoneDto;
      const user = null; // Mô phỏng trường hợp không có người dùng

      await expect(service.postPhone(body as any, user as any)).rejects.toThrow(
        new UnauthorizedException(
          'User chưa đăng nhập hoặc token không hợp lệ',
        ),
      );
    });

    it('should throw BadRequestException if there is an error creating phone', async () => {
      const body = CreatePhoneDto;
      const user = { id: 1 }; // Mô phỏng trường hợp không có người dùng

      // Mock để tạo ra lỗi khi thêm điện thoại
      (prisma.phones.create as jest.Mock).mockRejectedValueOnce(
        new Error('Lỗi khi tạo điện thoại'),
      );
      // Kiểm tra xem BadRequestException có được ném ra không
      await expect(service.postPhone(body as any, user)).rejects.toThrow(
        new BadRequestException('Không thể thêm điện thoại'),
      );
    });
  });

  describe('Put Phone', () => {
    it('should return update phones successfully', async () => {
      const body = CreatePhoneDto;

      // Mock prisma để tìm id
      (prisma.phones.findUnique as jest.Mock).mockResolvedValueOnce(phoneData);

      // Mock prisma để update phone
      (prisma.phones.update as jest.Mock).mockResolvedValueOnce({
        id: 1,
        ...body,
      });

      const result = await service.updatePhone('1', body as any, 1); // Truyền '1' là chuỗi
      const success = responseSuccess(
        result,
        'Cập nhật thông tin điện thoại thành công',
        200,
      );

      expect(result).toEqual(success);
      expect(prisma.phones.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if Id not number', async () => {
      const body = CreatePhoneDto;
      const user = { id: 1 };

      // Kiểm tra trường hợp id không phải là số
      await expect(
        service.updatePhone('invalid_id', body as any, user),
      ).rejects.toThrow(new BadRequestException('ID phải là số'));
    });

    it('should throw BadRequestException if Id does not exist', async () => {
      const body = CreatePhoneDto;
      const user = 1;
      const id = '12';

      // Mock prisma để giả lập không tìm thấy điện thoại
      (prisma.phones.findUnique as jest.Mock).mockResolvedValueOnce(null);

      // Kiểm tra trường hợp id không tồn tại
      await expect(
        service.updatePhone(id, body as any, user),
      ).rejects.toThrowError(`Phone với ID = ${id} không tồn tại.`);
    });

    it('should throw BadRequestException if there is an error updating phone', async () => {
      const body = CreatePhoneDto;
      const user = 1;
      const id = 321;

      // Mock điện thoại tồn tại
      const phoneData = { id: 1, brand: 'Brand', model: 'Model' };
      (prisma.phones.findUnique as jest.Mock).mockResolvedValueOnce(phoneData);

      // Mock lỗi khi cập nhật điện thoại
      (prisma.phones.update as jest.Mock).mockRejectedValueOnce(
        new Error('Update failed'),
      );

      // Kiểm tra khi cập nhật gặp lỗi
      await expect(
        service.updatePhone(id as any, body as any, user),
      ).rejects.toThrowError('Không thể cập nhật thông tin điện thoại');
    });
  });

  describe('Delete Phone', () => {
    it('should return delete phones successfully', async () => {
      const id = '2';
      const number = parseInt(id, 10);
      const user = 2;

      // Mock prisma để tìm id
      (prisma.phones.findUnique as jest.Mock).mockResolvedValueOnce(phoneData);

      // Mock prisma để delete phone
      (prisma.phones.delete as jest.Mock).mockResolvedValueOnce(phoneData);

      const result = await service.deletePhone(id, user);
      const success = responseSuccess();
      expect(result).toEqual(success);
    });

    it('should throw BadRequestException if Id not number', async () => {
      const id = '2';
      const number = parseInt(id, 10);
      const user = 2;

      // Kiểm tra trường hợp id không phải là số
      await expect(service.deletePhone('invalid_id', 2)).rejects.toThrow(
        new BadRequestException('ID phải là số'),
      );
    });

    it('should throw BadRequestException if Id does not exist', async () => {
      const user = 1;
      const id = '32';
      const number = parseInt(id, 10);

      // Mock prisma để giả lập không tìm thấy điện thoại
      (prisma.phones.findUnique as jest.Mock).mockResolvedValueOnce(null);

      // Kiểm tra nếu điện thoại không tồn tại, phải ném lỗi đúng
      await expect(service.deletePhone(id, user)).rejects.toThrow(
        new BadRequestException(`Phone với ID = ${number} không tồn tại.`),
      );
    });

    it('should throw BadRequestException if not find phone', async () => {
      const user = 1;
      const id = '32';
      const number = parseInt(id, 10);

      // Mock prisma để tìm thấy điện thoại
      (prisma.phones.findUnique as jest.Mock).mockResolvedValueOnce({
        id: number,
      });

      // Mock prisma để ném lỗi khi xóa điện thoại
      (prisma.phones.delete as jest.Mock).mockRejectedValueOnce(
        new Error('DB Error'),
      );

      // Kiểm tra lỗi trong quá trình xóa điện thoại
      await expect(service.deletePhone(id, user)).rejects.toThrow(
        new BadRequestException(`Không tìm thấy phone với id = ${number}`),
      );
    });
  });
});
