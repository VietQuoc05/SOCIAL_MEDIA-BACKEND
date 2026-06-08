import {
  Controller,
  Body,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { UploadService } from '../uploads/upload.service'; // ✅ ADD

import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

import {
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../../config/upload.config';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly service: UsersService,
    private readonly uploadService: UploadService, // ✅ inject
  ) {}

  // ============================
  // ✅ GET ALL USERS
  // ============================
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // ============================
  // ✅ SEARCH
  // ============================
  @Get('search')
  @ApiQuery({ name: 'q', required: true })
  search(@Query('q') q: string) {
    return this.service.search(q);
  }

  // ============================
  // ✅ CHECK DISPLAY NAME
  // ============================
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

  // ============================
  // ✅ GET ME
  // ============================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.service.findById(user.id, user.id);
  }

  // ============================
  // ✅ PROFILE
  // ============================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findById(id, user?.id);
  }

  // ============================
  // ✅ FOLLOWERS
  // ============================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/followers')
  getFollowers(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.service.getFollowers(id, user?.id);
  }

  // ============================
  // ✅ FOLLOWING
  // ============================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/following')
  getFollowing(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.service.getFollowing(id, user?.id);
  }

  // ============================
  // ✅ UPDATE PROFILE + UPLOAD (🔥 FIX MINIO)
  // ============================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: { type: 'string', format: 'binary' },
        cover: { type: 'string', format: 'binary' },
        username: { type: 'string' },
        displayName: { type: 'string' },
        bio: { type: 'string' },
      },
    },
  })
  @Patch('me')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatar', maxCount: 1 },
        { name: 'cover', maxCount: 1 },
      ],
      multerConfig,
    ),
  )
  async update(
    @CurrentUser() user: any,
    @UploadedFiles() files,
    @Body() dto: any,
  ) {
    const avatarFile = files?.avatar?.[0];
    const coverFile = files?.cover?.[0];

    let avatar: string | undefined;
    let cover: string | undefined;

    // ✅ upload avatar lên MinIO
    if (avatarFile) {
      avatar = await this.uploadService.uploadFile(
        avatarFile,
      );
    }

    // ✅ upload cover lên MinIO
    if (coverFile) {
      cover = await this.uploadService.uploadFile(
        coverFile,
      );
    }

    return this.service.updateProfile(user.id, {
      ...dto,
      ...(avatar && { avatar }),
      ...(cover && { cover }),
    });
  }
}