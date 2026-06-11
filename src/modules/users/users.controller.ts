import {
  Controller,
  Body,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';

import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

import {
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly service: UsersService,
  ) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('search')
  @ApiQuery({ name: 'q', required: true })
  search(@Query('q') q: string) {
    return this.service.search(q);
  }

  @Get('check-display-name')
  @ApiQuery({ name: 'name', required: true })
  async checkDisplayName(@Query('name') name: string) {
    const normalized = name
      ?.toLowerCase()
      ?.normalize('NFD')
      ?.replace(/[\u0300-\u036f]/g, '')
      ?.replace(/[^a-z0-9.]/g, '');

    const exists = await this.service.findByEmailOrDisplayName(
      '',
      normalized,
    );

    return {
      available: !exists,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.service.findById(user.id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findById(id, user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/followers')
  getFollowers(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.service.getFollowers(id, user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/following')
  getFollowing(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.service.getFollowing(id, user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('me')
  async update(
    @CurrentUser() user: any,
    @Body() dto: { username?: string; displayName?: string; bio?: string; avatar?: string; cover?: string },
  ) {
    return this.service.updateProfile(user.id, dto);
  }
}
