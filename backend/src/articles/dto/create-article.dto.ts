import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  toOptionalBoolean,
  toOptionalStringArray,
  trimOptionalString,
  trimString,
} from './dto-transformers';

export class CreateArticleDto {
  @ApiProperty({
    example: '7cb9f85b-420f-4f4e-9330-85ab0675df90',
    description: 'Article category UUID.',
  })
  @Transform(trimString)
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'كيفية التعامل مع القلق اليومي' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  titleAr: string;

  @ApiProperty({ example: 'How to Deal With Daily Anxiety' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  titleEn: string;

  @ApiPropertyOptional({
    example: 'daily-anxiety',
    description: 'Optional. Generated from titleEn when omitted.',
  })
  @Transform(trimOptionalString)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  slug?: string;

  @ApiProperty({ example: 'ملخص قصير للمقال.' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  shortContentAr: string;

  @ApiProperty({ example: 'A short summary of the article.' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  shortContentEn: string;

  @ApiProperty({ example: 'المحتوى العربي الكامل للمقال.' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  contentAr: string;

  @ApiProperty({ example: 'The full English article content.' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  contentEn: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['e75d1f63-784e-4834-9125-d73b4cbff5cf'],
    description: 'Optional repeated array field or JSON string array.',
  })
  @Transform(toOptionalStringArray)
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['7cb9f85b-420f-4f4e-9330-85ab0675df90'],
    description:
      'Courses shown under the article, in order (up to 6). Send "[]" to clear; empty = picked automatically.',
  })
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (Array.isArray(value)) return value as unknown[];
    if (typeof value === 'string') {
      const text = value.trim();
      if (text.startsWith('[')) {
        try {
          return JSON.parse(text) as unknown;
        } catch {
          return value;
        }
      }
      return text
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return value;
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsUUID('4', { each: true })
  relatedCourseIds?: string[];

  @ApiPropertyOptional({ example: false, default: false })
  @Transform(toOptionalBoolean)
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @Transform(toOptionalBoolean)
  @IsOptional()
  @IsBoolean()
  isHomeDisplay?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @Transform(toOptionalBoolean)
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
