import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PhoneService } from './phone.service';
import { AdminGuard, JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreatePhoneDto } from './dto/phone.dto';

@Controller('phone')
export class PhoneController {
  constructor(private readonly phoneService: PhoneService) {}

  // Get Phone (user & admin)
  @ApiTags('Phone')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard) // Token trước truy cập sau
  @Get('get-phone')
  getPhone() {
    return this.phoneService.getPhone();
  }

  // Post Phone Product (admin)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('post-phone')
  async postPhone(@Body() body: CreatePhoneDto, @Request() req: any) {
    return this.phoneService.postPhone(body, req.user);
  }

  // Put Phone Product (admin)

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('put-phone/:id')
  async updatePhone(
    @Param('id') id: string,
    @Body() body: CreatePhoneDto,
    @Request() req: any,
  ) {
    return this.phoneService.updatePhone(id, body, req.user);
  }

  // Delete Phone Product (admin)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('delete-phone/:id')
  removePhone(@Param('id') id: string, @Request() req) {
    return this.phoneService.deletePhone(id, req.user);
  }
}
