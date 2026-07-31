import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

import { RecentSearchesService } from './recent-searches.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';

@ApiTags('Recent Searches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('recent-searches')
export class RecentSearchesController {
  constructor(private readonly service: RecentSearchesService) {}

  @ApiOperation({ summary: 'Save a recent search' })
  @Post()
  create(@CurrentUser() user: any, @Body() dto: { searchedUserId: string }) {
    if (!user) throw new UnauthorizedException();
    if (!dto.searchedUserId) {
      throw new BadRequestException('searchedUserId is required');
    }
    return this.service.create(user.id, dto.searchedUserId);
  }

  @ApiOperation({ summary: 'Get all recent searches for current user' })
  @Get()
  findAll(@CurrentUser() user: any) {
    if (!user) throw new UnauthorizedException();
    return this.service.findAll(user.id);
  }

  @ApiOperation({ summary: 'Delete a recent search' })
  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    if (!user) throw new UnauthorizedException();
    return this.service.remove(user.id, id);
  }

  @ApiOperation({ summary: 'Clear all recent searches' })
  @Delete()
  clearAll(@CurrentUser() user: any) {
    if (!user) throw new UnauthorizedException();
    return this.service.clearAll(user.id);
  }
}
