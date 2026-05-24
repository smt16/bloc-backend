import { Controller, Get } from '@nestjs/common';
import { ClimbingService } from './climbing.service';

@Controller('climbing')
export class ClimbingController {
  constructor(private readonly climbingService: ClimbingService) {}

  @Get()
  findAll() {
    return this.climbingService.findAll();
  }
}
