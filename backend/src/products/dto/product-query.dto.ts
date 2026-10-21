import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  toOptionalBoolean,
  toOptionalNumber,
  trimString,
} from './dto-transformers';
import { LangQueryDto } from './lang-query.dto';

export class ProductQueryDto extends LangQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @Transform(toOptionalNumber)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20, maximum: 100 })
  @Transform(toOptionalNumber)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: '7cb9f85b-420f-4f4e-9330-85ab0675df90' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    example: 'care',
    description:
      'Search in Arabic/English names and Arabic/English descriptions.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: true })
  @Transform(toOptionalBoolean)
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: true })
  @Transform(toOptionalBoolean)
  @IsOptional()
  @IsBoolean()
  isHomeDisplay?: boolean;

  @ApiPropertyOptional({
    example: 100,
    description:
      'Lowest price (inclusive) the buyer pays — the discount price when there is one.',
  })
  @Transform(toOptionalNumber)
  @IsOptional()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    example: 500,
    description: 'Highest price (inclusive).',
  })
  @Transform(toOptionalNumber)
  @IsOptional()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    enum: ['EGP', 'USD'],
    default: 'EGP',
    description: 'Currency of minPrice/maxPrice.',
  })
  @IsOptional()
  @IsIn(['EGP', 'USD'])
  priceCurrency?: 'EGP' | 'USD';
}

export class AdminProductQueryDto extends ProductQueryDto {
  @ApiPropertyOptional({ example: true })
  @Transform(toOptionalBoolean)
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
