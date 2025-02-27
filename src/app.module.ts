import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PhoneModule } from './modules/phone/phone.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrderModule } from './modules/order/order.module';

@Module({
  imports: [AuthModule, PhoneModule, OrderModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
