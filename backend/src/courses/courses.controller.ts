import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CourseQueryDto } from './dto/course-query.dto';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({
    summary: 'List active courses.',
    description:
      'Supports pagination, search, categoryId, and isFeatured filters.',
  })
  @ApiOkResponse({ description: 'Courses returned.' })
  findAll(@Query() query: CourseQueryDto) {
    return this.coursesService.findCourses(query);
  }

  @Get('home')
  @ApiOperation({ summary: 'List active home-display courses.' })
  @ApiOkResponse({ description: 'Home courses returned.' })
  findHome() {
    return this.coursesService.findHomeCourses();
  }

  @Get('featured')
  @ApiOperation({ summary: 'List active featured courses.' })
  @ApiOkResponse({ description: 'Featured courses returned.' })
  findFeatured() {
    return this.coursesService.findFeaturedCourses();
  }

  @Get('categories')
  @ApiOperation({ summary: 'List active course categories that have courses.' })
  @ApiOkResponse({ description: 'Course categories returned.' })
  findCategories() {
    return this.coursesService.findPublicCategories();
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get one active course by id or slug.' })
  @ApiOkResponse({ description: 'Course returned.' })
  @ApiNotFoundResponse({ description: 'Course not found.' })
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.coursesService.findCourseById(idOrSlug);
  }
}
