
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PublishingLogDocument = HydratedDocument<PublishingLog>;

@Schema({ timestamps: true })
export class PublishingLog {
  @Prop({ required: true, index: true })
  contentId: string;

  @Prop({
    required: true,
    enum: ['SIMULATED', 'SUCCESS', 'FAILED'],
  })
  logStatus: string;

  @Prop({ required: true })
  logMessage: string;

  @Prop({
    required: true,
    enum: ['SIMULATION', 'LIVE'],
  })
  publishingMode: string;


@Prop({ type: String, default: null })
facebookPostId: string | null;


  @Prop({ required: true, type: Date })
  loggedAt: Date;
}

export const PublishingLogSchema =
  SchemaFactory.createForClass(PublishingLog);
