import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ✅ Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FollowModule } from './modules/follow/follow.module';
import { PostsModule } from './modules/posts/posts.module';
import { CommentsModule } from './modules/comments/comments.module';
import { ReactionsModule } from './modules/reactions/reactions.module';
import { UploadModule } from './modules/uploads/upload.module';

// ✅ Realtime Gateway
import { EventsGateway } from './events/events.gateway';

@Module({
  imports: [
    // ============================
    // ✅ DATABASE
    // ============================
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
    }),

    // ============================
    // ✅ MODULES
    // ============================
    AuthModule,
    UsersModule,
    FollowModule,
    PostsModule,
    CommentsModule,
    ReactionsModule,
    UploadModule,
  ],

  // ✅ QUAN TRỌNG: add gateway
  providers: [EventsGateway],
})
export class AppModule {}
``