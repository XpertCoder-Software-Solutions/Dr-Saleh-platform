import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CoursesService } from './courses.service';
import { CloudFrontService } from '../common/cloudfront/cloudfront.service';
import { IsIn, IsOptional } from 'class-validator';

class LessonMediaQuery {
  @IsOptional()
  @IsIn(['video', 'pdf'])
  kind?: 'video' | 'pdf';
}
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { RequireAdminPermission } from '../auth/admin-permissions';

@ApiTags('Admin Lessons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@RequireAdminPermission('courses')
@Controller()
export class AdminLessonsController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly cloudFrontService: CloudFrontService,
  ) {}

  @Get('admin/lessons/:id/media-url')
  @ApiOperation({
    summary: 'Admin: short-lived link to watch a lesson video or open its PDF.',
  })
  @ApiOkResponse({ description: 'Signed URL generated.' })
  @ApiNotFoundResponse({ description: 'Lesson or file not found.' })
  mediaUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: LessonMediaQuery,
  ) {
    return this.cloudFrontService.generateSignedLessonMediaUrlForAdmin(
      id,
      query.kind ?? 'video',
    );
  }

  @Post('admin/sections/:sectionId/lessons')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Admin: create a lesson for one section.',
    description: 'VIDEO lessons require videoKey. PDF lessons require pdfKey.',
  })
  @ApiCreatedResponse({ description: 'Lesson created successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid lesson data.' })
  @ApiNotFoundResponse({ description: 'Course section not found.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @ApiForbiddenResponse({ description: 'Admin access is required.' })
  create(
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() createDto: CreateLessonDto,
  ) {
    return this.coursesService.adminCreateLesson(sectionId, createDto);
  }

  @Get('admin/sections/:sectionId/lessons')
  @ApiOperation({ summary: 'Admin: list lessons for one section.' })
  @ApiOkResponse({ description: 'Lessons returned.' })
  @ApiNotFoundResponse({ description: 'Course section not found.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @ApiForbiddenResponse({ description: 'Admin access is required.' })
  findAll(@Param('sectionId', ParseUUIDPipe) sectionId: string) {
    return this.coursesService.adminFindLessons(sectionId);
  }

  @Patch('admin/lessons/:id')
  @ApiOperation({
    summary: 'Admin: update one lesson.',
    description: 'VIDEO lessons require videoKey. PDF lessons require pdfKey.',
  })
  @ApiOkResponse({ description: 'Lesson updated successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid lesson data.' })
  @ApiNotFoundResponse({ description: 'Lesson not found.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @ApiForbiddenResponse({ description: 'Admin access is required.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateLessonDto,
  ) {
    return this.coursesService.adminUpdateLesson(id, updateDto);
  }

  @Delete('admin/lessons/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: hard delete one lesson.' })
  @ApiOkResponse({ description: 'Lesson deleted successfully.' })
  @ApiConflictResponse({ description: 'Lesson has dependent records.' })
  @ApiNotFoundResponse({ description: 'Lesson not found.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @ApiForbiddenResponse({ description: 'Admin access is required.' })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.adminDeleteLesson(id);
  }
}
