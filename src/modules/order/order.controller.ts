import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  Put,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { AdminGuard, JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateOrderDto, UpdateOrderDto } from './dto/order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Get order (user & admin)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('get-order')
  getOrders(@Request() req) {
    return this.orderService.getOrders(req.user);
  }

  // Post order (user & admin)

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('post-order')
  async postOrder(@Body() body: CreateOrderDto, @Request() req: any) {
    return this.orderService.postOrder(body, req.user);
  }

  // Put order ( user & admin )
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('put-order/:orderId')
  async updateOrder(
    @Param('orderId') orderId: number,
    @Body() body: UpdateOrderDto,
  ) {
    return this.orderService.updateOrder(orderId, body);
  }

  // Delete Order ( admin )
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('delete-order/:id')
  deleteOrder(@Param('id') id: string, @Request() req) {
    return this.orderService.deleteOrder(id, req.user);
  }
}
