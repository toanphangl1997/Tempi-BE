import { Module } from '@nestjs/common';
import { PhoneController } from './phone.controller';
import { PhoneService } from './phone.service';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Module({
  controllers: [PhoneController],
  providers: [PhoneService, PrismaService],
})
export class PhoneModule {}
