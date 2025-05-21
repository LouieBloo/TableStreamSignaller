import mongoose, { Document, Schema } from 'mongoose';

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
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, maxlength: 40  },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true },
    developerToken: { type: String },
    resetPasswordToken:   { type: String },
    resetPasswordExpires: { type: Date },
    verifiedEmail: { type: Boolean, default: false },
    verifiyEmailToken:{ type: String },
    lastNameUpdate: { type: Date },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMongoUser>('User', UserSchema);
