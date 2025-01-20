import mongoose, { Document, Schema } from 'mongoose';
import { IMongoUser } from './user-model';
import { IMongoTrainingImage } from './training-image-model';

export interface IUserClassification extends Document {
  user: mongoose.Types.ObjectId | IMongoUser;
  trainingImage: mongoose.Types.ObjectId | IMongoTrainingImage;
  action: string; // Example: "CORRECT", "INCORRECT", "UNSURE", etc.
  createdAt?: Date;
  updatedAt?: Date;
}

const UserClassificationSchema: Schema = new Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
    },
    trainingImage: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'training_image', 
      required: true,
    },
    action: {
      type: String,
      enum: ['CLASSIFIED', 'DELETED'],
      required: true,
    }
  },
  {
    timestamps: true, 
  }
);

export default mongoose.model<IUserClassification>('user_classification', UserClassificationSchema);