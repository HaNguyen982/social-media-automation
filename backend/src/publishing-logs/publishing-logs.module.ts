
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  PublishingLog,
  PublishingLogSchema,
} from './schemas/publishing-log.schema';

import { PublishingLogsService } from './publishing-logs.service';
import { PublishingLogsController } from './publishing-logs.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PublishingLog.name,
        schema: PublishingLogSchema,
      },
    ]),
  ],
  controllers: [PublishingLogsController],
  providers: [PublishingLogsService],
})
export class PublishingLogsModule {}
