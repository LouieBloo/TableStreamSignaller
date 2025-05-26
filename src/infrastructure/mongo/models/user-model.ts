import mongoose, { Document, Schema } from 'mongoose';
import { IProfileSettings } from '../../../presentation/router/interfaces/IUser';

export interface IMongoUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  developerToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  verifiedEmail?:boolean;
  verifiyEmailToken?: string;
  lastNameUpdate?:Date;
  profileSettings?:IProfileSettings;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, maxlength: 30, minlength: 3 },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true },
    developerToken: { type: String },
    resetPasswordToken:   { type: String },
    resetPasswordExpires: { type: Date },
    verifiedEmail: { type: Boolean, default: false },
    verifiyEmailToken:{ type: String },
    lastNameUpdate: { type: Date },
    profileSettings: {
      icon: {
        id: { type: String, default: 'bootstrapPersonCircle' },
        color: { type: String, default: '#ffffff' }
      }
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMongoUser>('User', UserSchema);
