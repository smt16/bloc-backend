import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { CreateRouteCommentDto, CreateRouteDto, RouteQueryDto } from './dto';
import { RoutesService } from './routes.service';

@Controller('routes')
export class RoutesController {
  constructor(
    private readonly routesService: RoutesService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  list(@Query() query: RouteQueryDto) {
    return this.routesService.list(query);
  }

  @Get(':id')
  async getOne(
    @CurrentUser() auth: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const me = await this.usersService.resolveCurrentUser(auth);
    return this.routesService.getDetail(id, me.id);
  }

  @Post()
  create(@Body() dto: CreateRouteDto) {
    return this.routesService.create(dto);
  }

  @Get(':id/comments')
  listComments(@Param('id', ParseUUIDPipe) id: string) {
    return this.routesService.listComments(id);
  }

  @Post(':id/comments')
  async addComment(
    @CurrentUser() auth: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRouteCommentDto,
  ) {
    const me = await this.usersService.resolveCurrentUser(auth);
    return this.routesService.addComment(id, me.id, dto.body);
  }
}
