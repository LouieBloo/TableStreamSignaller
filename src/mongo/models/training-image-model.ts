import mongoose, { Document, Schema } from 'mongoose';

export interface IMongoTrainingImage extends Document {
  imageName: string;
  imageLocation: string;
  imageType:string;
  status:string;
  possibleOracleIds:string[];
  votesToDelete:number;
  votesNotSure:number;
  createdAt?: Date;
  updatedAt?: Date;
}

const TrainingImageSchema: Schema = new Schema(
  {
    imageName: { type: String, required: true },
    imageLocation: { type: String, required: true },
    imageType: {
      type: String,
      enum: ['BOARD', 'CARD'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING_SLICE', 'SLICED', 'PENDING_CLASSIFICATION', 'PENDING_TRAINING', 'PENDING_DELETE', 'PENDING_VERIFICATION', 'PENDING_IDK', 'CLASSIFIED'],
      required: true,
    },
    possibleOracleIds:{type: [String]},
    votesToDelete: {type: Number},
    votesNotSure: {type: Number}
  },
  {
    timestamps: true,
  }
);


export default mongoose.model<IMongoTrainingImage>('training_image', TrainingImageSchema);
