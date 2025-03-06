import mongoose, { Document, Schema } from 'mongoose';

export interface IMongoUser extends Document {
  name: string;
  email: string;
  developerToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    developerToken: { type: String, required: false }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMongoUser>('User', UserSchema);
