import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RecentSearch } from '../../database/entities/recent-search.entity';
import { User } from '../../database/entities/user.entity';
import { RecentSearchesService } from './recent-searches.service';
import { RecentSearchesController } from './recent-searches.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecentSearch, User]),
  ],
  providers: [RecentSearchesService],
  controllers: [RecentSearchesController],
  exports: [RecentSearchesService],
})
export class RecentSearchesModule {}
