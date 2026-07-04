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
  Query,
} from '@nestjs/common';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { CreateFeedCommentDto, FeedQueryDto, ReactDto } from './dto';
import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {
  constructor(
    private readonly feedService: FeedService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() auth: AuthenticatedUser,
    @Query() query: FeedQueryDto,
  ) {
    const me = await this.usersService.resolveCurrentUser(auth);
    return this.feedService.listFeed(me.id, query);
  }

  @Post(':id/reactions')
  @HttpCode(HttpStatus.NO_CONTENT)
  async react(
    @CurrentUser() auth: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReactDto,
  ) {
    const me = await this.usersService.resolveCurrentUser(auth);
    await this.feedService.react(id, me.id, dto.type);
  }

  @Delete(':id/reactions')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeReaction(
    @CurrentUser() auth: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const me = await this.usersService.resolveCurrentUser(auth);
    await this.feedService.removeReaction(id, me.id);
  }

  @Get(':id/comments')
  listComments(@Param('id', ParseUUIDPipe) id: string) {
    return this.feedService.listComments(id);
  }

  @Post(':id/comments')
  async addComment(
    @CurrentUser() auth: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateFeedCommentDto,
  ) {
    const me = await this.usersService.resolveCurrentUser(auth);
    return this.feedService.addComment(id, me.id, dto.body);
  }
}
