
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ContentsService } from './contents.service';

import { ContentStatus } from './schemas/content.schema';

import {
  CreateContentDto,
  ReviewContentDto,
  PublishContentDto,
  MarkReconciliationDto,
} from './dto/create-content.dto';

import { InternalApiKeyGuard } from '../auth/internal-api-key.guard';

@Controller('api/contents')
export class ContentsController {
  constructor(
    private readonly contentsService: ContentsService,
  ) { }

  @UseGuards(InternalApiKeyGuard)
  @Post()
  create(@Body() dto: CreateContentDto) {
    return this.contentsService.create(dto);
  }

  @Get()
  findAll(@Query('status') status?: ContentStatus) {
    return this.contentsService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contentsService.findOne(id);
  }

  @UseGuards(InternalApiKeyGuard)
  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() reviewDto: ReviewContentDto,
  ) {
    return this.contentsService.approve(id, reviewDto);
  }

  @UseGuards(InternalApiKeyGuard)
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() reviewDto: ReviewContentDto,
  ) {
    return this.contentsService.reject(id, reviewDto);
  }

  @UseGuards(InternalApiKeyGuard)
  @Patch(':id/claim-publishing')
  claimForPublishing(@Param('id') id: string) {
    return this.contentsService.claimForPublishing(id);
  }

  @UseGuards(InternalApiKeyGuard)
  @Patch(':id/publish')
  publish(
    @Param('id') id: string,
    @Body() publishDto: PublishContentDto,
  ) {
    return this.contentsService.publish(id, publishDto);
  }

  @UseGuards(InternalApiKeyGuard)
  @Patch(':id/mark-manual-review')
  markManualReview(
    @Param('id') id: string,
    @Body() dto: MarkReconciliationDto,
  ) {
    return this.contentsService.markNeedsManualReview(id, dto);
  }
}
