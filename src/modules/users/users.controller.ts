import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { ListUsersQueryDto, UpdateMeDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Current climber's full profile (stats, pyramid, timeline, achievements). */
  @Get('me')
  async getMe(@CurrentUser() auth: AuthenticatedUser) {
    const me = await this.usersService.resolveCurrentUser(auth);
    return this.usersService.getProfile(me.id, me.id);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() auth: AuthenticatedUser,
    @Body() dto: UpdateMeDto,
  ) {
    const me = await this.usersService.resolveCurrentUser(auth);
    await this.usersService.updateMe(me.id, dto);
    return this.usersService.getProfile(me.id, me.id);
  }

  /** Discover climbers (explore "climbers to follow" + search). */
  @Get()
  async list(
    @CurrentUser() auth: AuthenticatedUser,
    @Query() query: ListUsersQueryDto,
  ) {
    const me = await this.usersService.resolveCurrentUser(auth);
    return this.usersService.listClimbers(query, me.id);
  }

  @Get(':id')
  async getOne(
    @CurrentUser() auth: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const me = await this.usersService.resolveCurrentUser(auth);
    return this.usersService.getProfile(id, me.id);
  }

  @Post(':id/follow')
  @HttpCode(HttpStatus.NO_CONTENT)
  async follow(
    @CurrentUser() auth: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const me = await this.usersService.resolveCurrentUser(auth);
    await this.usersService.follow(me.id, id);
  }

  @Delete(':id/follow')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollow(
    @CurrentUser() auth: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const me = await this.usersService.resolveCurrentUser(auth);
    await this.usersService.unfollow(me.id, id);
  }
}
