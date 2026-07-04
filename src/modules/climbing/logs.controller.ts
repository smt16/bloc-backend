import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { CreateLogDto } from './dto';
import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
  constructor(
    private readonly logsService: LogsService,
    private readonly usersService: UsersService,
  ) {}

  /** The "Log a climb" action. Creates a climb log + a feed activity. */
  @Post()
  async create(
    @CurrentUser() auth: AuthenticatedUser,
    @Body() dto: CreateLogDto,
  ) {
    const me = await this.usersService.resolveCurrentUser(auth);
    return this.logsService.create(me.id, dto);
  }

  @Get()
  async list(@CurrentUser() auth: AuthenticatedUser) {
    const me = await this.usersService.resolveCurrentUser(auth);
    return this.logsService.listForUser(me.id);
  }
}
