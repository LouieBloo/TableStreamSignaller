import mongoose, { Document, Schema } from 'mongoose';

export interface IMongoRoom extends Document {
  name: string;
  playerIds?: string[];
  gameType: string;
  maxPlayers: number;
  tableStreamId: string; // UUID, not the primary key
  scheduledRoom: boolean;
  initialScheduleTTLInSeconds: number;
  inactivityTimeUntilDestroyedInSeconds: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

const RoomSchema: Schema = new Schema(
  {
    name: { type: String, required: false },
    playerIds: { type: [String], required: false },
    gameType: { type: String, required: false },
    maxPlayers: { type: Number, required: false },
    tableStreamId: { type: String, required: false, unique: true },
    scheduledRoom: { type: Boolean, required: false },
    initialScheduleTTLInSeconds: { type: Number, required: false },
    inactivityTimeUntilDestroyedInSeconds: { type: Number, required: false },
    deletedAt: { type: Date, required: false },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Ensure that 'id' is unique
RoomSchema.index({ tableStreamId: 1 }, { unique: true });

export default mongoose.model<IMongoRoom>('Room', RoomSchema);
