import mongoose, { Document, Schema } from 'mongoose';

export interface IMongoLog extends Document {
  message:string;
  data?:any;
  source:string;
  application:string;
  severity:string;
}

const LogSchema: Schema = new Schema(
  {
    message: { type: String, required: true },
    data:{type: Object},
    source: { type: String, required: true },
    application: {
      type: String,
      enum: ['TABLE_STREAM_FRONT_END', 'TABLE_STREAM_API'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['WARNING', 'ERROR'],
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMongoLog>('Log', LogSchema);
