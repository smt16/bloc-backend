import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { CreateSessionDto } from './dto';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly usersService: UsersService,
  ) {}

  /** Current climber's logbook: weekly summary + session cards. */
  @Get()
  async list(@CurrentUser() auth: AuthenticatedUser) {
    const me = await this.usersService.resolveCurrentUser(auth);
    return this.sessionsService.listForUser(me.id);
  }

  @Get(':id')
  async getOne(
    @CurrentUser() auth: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const me = await this.usersService.resolveCurrentUser(auth);
    return this.sessionsService.getOne(id, me.id);
  }

  @Post()
  async create(
    @CurrentUser() auth: AuthenticatedUser,
    @Body() dto: CreateSessionDto,
  ) {
    const me = await this.usersService.resolveCurrentUser(auth);
    return this.sessionsService.create(me.id, dto);
  }
}
