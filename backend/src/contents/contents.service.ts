
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import {
  Content,
  ContentDocument,
  ContentStatus,
  ReconciliationStatus,
} from './schemas/content.schema';

import {
  CreateContentDto,
  ReviewContentDto,
  PublishContentDto,
  MarkReconciliationDto,
} from './dto/create-content.dto';

@Injectable()
export class ContentsService {
  constructor(
    @InjectModel(Content.name)
    private readonly contentModel: Model<ContentDocument>,
  ) { }

  // 1. Tạo nội dung mới
  async create(dto: CreateContentDto) {
    const content = await this.contentModel.create({
      title: dto.title,
      topic: dto.topic,
      body: dto.body,
      sourceUrls: dto.sourceUrls ?? [],
      status: dto.status ?? ContentStatus.PENDING_REVIEW,
      medicalReview: dto.medicalReview,
      reviewStatus: dto.reviewStatus ?? 'NOT_REVIEWED',
      requiresHumanReview: dto.requiresHumanReview ?? false,
      reviewMessage: dto.reviewMessage ?? '',
    });

    return content;
  }

  // 2. Lấy danh sách nội dung
  async findAll(status?: ContentStatus) {
    const filter = status ? { status } : {};

    return this.contentModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
  }

  // 3. Lấy chi tiết một nội dung
  async findOne(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID bài viết không hợp lệ');
    }

    const content = await this.contentModel.findById(id).exec();

    if (!content) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    return content;
  }

  // 4. Duyệt nội dung
  async approve(id: string, reviewDto: ReviewContentDto) {
    const content = await this.findOne(id);

    if (content.status !== ContentStatus.PENDING_REVIEW) {
      throw new ConflictException(
        'Chỉ có thể duyệt bài đang chờ kiểm duyệt',
      );
    }

    content.status = ContentStatus.APPROVED;
    content.reviewStatus = 'HUMAN_APPROVED';
    content.requiresHumanReview = false;
    content.reviewMessage =
      reviewDto.reviewMessage ||
      'Đã được người kiểm duyệt phê duyệt.';
    content.reviewer = reviewDto.reviewer || 'HUMAN_REVIEWER';
    content.reviewedAt = new Date();

    return content.save();
  }

  // 5. Từ chối nội dung
  async reject(id: string, reviewDto: ReviewContentDto) {
    const content = await this.findOne(id);

    if (content.status !== ContentStatus.PENDING_REVIEW) {
      throw new ConflictException(
        'Chỉ có thể từ chối bài viết đang chờ kiểm duyệt',
      );
    }

    content.status = ContentStatus.REJECTED;
    content.reviewStatus = 'HUMAN_REJECTED';
    content.requiresHumanReview = false;
    content.reviewMessage =
      reviewDto.reviewMessage ||
      'Bài viết đã bị người kiểm duyệt từ chối.';
    content.reviewer = reviewDto.reviewer || 'HUMAN_REVIEWER';
    content.reviewedAt = new Date();

    return content.save();
  }

  // 6. Khóa bài viết trước khi gửi sang Buffer
  async claimForPublishing(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID bài viết không hợp lệ');
    }

    const filter: Record<string, unknown> = {
      _id: new Types.ObjectId(id),
      status: ContentStatus.APPROVED,
      reviewStatus: 'HUMAN_APPROVED',
      requiresHumanReview: false,
      facebookPostId: '',
      publishedAt: null,
      'medicalReview.decision': 'APPROVED',
    };

    const content = await this.contentModel
      .findOneAndUpdate(
        filter,
        {
          $set: {
            status: ContentStatus.PUBLISHING,
            reconciliationStatus: ReconciliationStatus.PENDING,
            reconciliationNote: 'Dang cho xac minh ket qua dang bai tu Buffer.',
          },
        },
        {
          new: true,
        },
      )
      .exec();

    if (!content) {
      throw new ConflictException(
        'Bài viết không đủ điều kiện đăng hoặc đã được xử lý',
      );
    }

    return content;
  }

  // 7. Xác nhận bài viết đã đăng thành công
  async publish(id: string, publishDto: PublishContentDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID bài viết không hợp lệ');
    }

    const content = await this.contentModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          status: ContentStatus.PUBLISHING,
          reconciliationStatus: ReconciliationStatus.PENDING,
          facebookPostId: '',
          publishedAt: null,
        },
        {

          $set: {
            status: ContentStatus.PUBLISHED,
            bufferPostId: publishDto.bufferPostId ?? '',
            facebookPostId: publishDto.facebookPostId,
            facebookPostUrl: publishDto.facebookPostUrl ?? '',
            publishedAt: new Date(),
          },

        },
        {
          new: true,
        },
      )
      .exec();

    if (!content) {
      throw new ConflictException(
        'Bài viết không ở trạng thái PUBLISHING hoặc đã được cập nhật',
      );
    }

    return content;
  }

  async markNeedsManualReview(
    id: string,
    dto: MarkReconciliationDto,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID bài viết không hợp lệ');
    }

    const content = await this.contentModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        status: ContentStatus.PUBLISHING,
        reconciliationStatus: ReconciliationStatus.PENDING,
        facebookPostId: '',
        publishedAt: null,
      },
      {
        $set: {
          reconciliationStatus:
            ReconciliationStatus.NEEDS_MANUAL_REVIEW,
          reconciliationNote: dto.reconciliationNote,
        },
      },
      { new: true },
    ).exec();

    if (!content) {
      throw new ConflictException(
        'Bài viết không ở trạng thái chờ đối soát',
      );
    }

    return content;
  }
}
