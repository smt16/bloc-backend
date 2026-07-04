import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { CreateCrewDto } from './dto';
import { CrewsService } from './crews.service';

@Controller('crews')
export class CrewsController {
  constructor(
    private readonly crewsService: CrewsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async list(@CurrentUser() auth: AuthenticatedUser) {
    const me = await this.usersService.resolveCurrentUser(auth);
    return this.crewsService.listForUser(me.id);
  }

  @Post()
  async create(
    @CurrentUser() auth: AuthenticatedUser,
    @Body() dto: CreateCrewDto,
  ) {
    const me = await this.usersService.resolveCurrentUser(auth);
    return this.crewsService.create(me.id, dto);
  }

  @Post(':id/join')
  async join(
    @CurrentUser() auth: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const me = await this.usersService.resolveCurrentUser(auth);
    return this.crewsService.join(id, me.id);
  }

  @Delete(':id/join')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leave(
    @CurrentUser() auth: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const me = await this.usersService.resolveCurrentUser(auth);
    await this.crewsService.leave(id, me.id);
  }
}
