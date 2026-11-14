
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ContentsController } from './contents.controller';
import { ContentsService } from './contents.service';
import { Content, ContentSchema } from './schemas/content.schema';
import { InternalApiKeyGuard } from '../auth/internal-api-key.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Content.name, schema: ContentSchema },
    ]),
  ],
  controllers: [ContentsController],
  providers: [ContentsService, InternalApiKeyGuard],
})
export class ContentsModule { }
