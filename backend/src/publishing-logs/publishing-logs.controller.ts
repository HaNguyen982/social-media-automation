
import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { PublishingLogsService } from './publishing-logs.service';
import { CreatePublishingLogDto } from './dto/create-publishing-log.dto';

@Controller('api/publishing-logs')
export class PublishingLogsController {
  constructor(
    private readonly publishingLogsService: PublishingLogsService,
  ) {}

  @Post()
  async create(@Body() dto: CreatePublishingLogDto) {
    return this.publishingLogsService.create(dto);
  }
}
