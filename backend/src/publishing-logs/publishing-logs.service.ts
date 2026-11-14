
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  PublishingLog,
  PublishingLogDocument,
} from './schemas/publishing-log.schema';

@Injectable()
export class PublishingLogsService {
  constructor(
    @InjectModel(PublishingLog.name)
    private readonly publishingLogModel: Model<PublishingLogDocument>,
  ) {}

  async create(data: {
    contentId: string;
    logStatus: 'SIMULATED' | 'SUCCESS' | 'FAILED';
    logMessage: string;
    publishingMode: 'SIMULATION' | 'LIVE';
    facebookPostId?: string | null;
    loggedAt: string;
  }): Promise<PublishingLog> {

    // 1. Kiểm tra an toàn trước khi lưu
    if (data.publishingMode === 'SIMULATION') {
      if (
        data.logStatus !== 'SIMULATED' &&
        data.logStatus !== 'FAILED'
      ) {
        throw new BadRequestException(
          'SIMULATION mode only allows SIMULATED or FAILED log status.',
        );
      }

      if (data.facebookPostId) {
        throw new BadRequestException(
          'SIMULATION mode must not contain a real Facebook Post ID.',
        );
      }
    }

    if (
      data.publishingMode === 'LIVE' &&
      data.logStatus === 'SIMULATED'
    ) {
      throw new BadRequestException(
        'LIVE mode cannot use SIMULATED log status.',
      );
    }

    // 2. Tạo bản ghi MongoDB
    const log = new this.publishingLogModel({
      contentId: data.contentId,
      logStatus: data.logStatus,
      logMessage: data.logMessage,
      publishingMode: data.publishingMode,
      facebookPostId: data.facebookPostId ?? null,
      loggedAt: new Date(data.loggedAt),
    });

    // 3. Lưu bản ghi
    return log.save();
  }
}
