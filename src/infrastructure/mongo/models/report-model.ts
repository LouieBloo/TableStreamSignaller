import mongoose, { Document, Schema, Types } from 'mongoose';
import { IMessage } from '../../../domain/interfaces/IMessaging';

export interface IMongoReport extends Document {
  reporterUserId: Types.ObjectId;
  offenderUserId: Types.ObjectId;
  reason: 'GRIEFING' | 'CAMERA_ABUSE' | 'AUDIO_ABUSE' | 'HARASSMENT' | 'CHAT_ABUSE' | 'OTHER';
  notes?: string;
  roomId: Types.ObjectId;
  messages: IMessage[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ReportSchema: Schema = new Schema(
  {
    reporterUserId: { type: Types.ObjectId, ref: 'User', required: true },
    offenderUserId: { type: Types.ObjectId, ref: 'User', required: true },
    reason: {
      type: String,
      enum: ['GRIEFING', 'CAMERA_ABUSE', 'AUDIO_ABUSE', 'HARASSMENT', 'CHAT_ABUSE', 'OTHER'],
      required: true,
    },
    notes: { type: String, required: false },
    roomId: { type: Types.ObjectId, ref: 'Room', required: true },
    messages: [
      {
        text: { type: String, required: true },
        date: { type: Date, required: true },
        player: { type: Schema.Types.Mixed, required: false },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IMongoReport>('Report', ReportSchema);
