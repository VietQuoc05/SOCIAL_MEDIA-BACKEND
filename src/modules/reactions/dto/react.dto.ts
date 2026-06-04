import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ReactionType } from '../../../common/enums/reaction.enum';

export class ReactDto {
  @ApiProperty({
    example: 'like',
    enum: ReactionType,
    description: 'Loại reaction',
  })
  @IsEnum(ReactionType)
  type: ReactionType;
}
``