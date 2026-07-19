import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateGymDto } from './dto';
import { GymsService } from './gyms.service';

@Controller('gyms')
export class GymsController {
  constructor(private readonly gymsService: GymsService) {}

  @Get()
  findAll() {
    return this.gymsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.gymsService.findOne(id);
  }

  /** Requires Auth0 roles claim: admin or setter. */
  @Roles('admin', 'setter')
  @Post()
  create(@Body() dto: CreateGymDto) {
    return this.gymsService.create(dto);
  }
}
