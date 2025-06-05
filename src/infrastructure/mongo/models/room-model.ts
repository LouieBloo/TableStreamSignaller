import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMongoRoom extends Document {
  name: string;
  playerIds?: string[];
  players?: { id: string; userId?: Types.ObjectId }[];
  gameType: string;
  maxPlayers: number;
  tableStreamId: string; // UUID, not the primary key
  scheduledRoom: boolean;
  initialScheduleTTLInSeconds: number;
  inactivityTimeUntilDestroyedInSeconds: number;
  reactionsEnabled?:boolean;
  public?:boolean;
  allowPlayerKicking?:boolean;
  allowSpectators?:boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

const RoomSchema: Schema = new Schema(
  {
    name: { type: String, required: false },
    playerIds: { type: [String], required: false },
    players: [
      {
        id: { type: String, required: true },
        userId: { type: Types.ObjectId, ref: 'User', required: false },
      },
    ],
    gameType: { type: String, required: false },
    maxPlayers: { type: Number, required: false },
    tableStreamId: { type: String, required: false, unique: true },
    scheduledRoom: { type: Boolean, required: false },
    initialScheduleTTLInSeconds: { type: Number, required: false },
    inactivityTimeUntilDestroyedInSeconds: { type: Number, required: false },
    reactionsEnabled: { type: Boolean, required: false },
    public: { type: Boolean, required: false },
    allowPlayerKicking: { type: Boolean, required: false },
    allowSpectators: { type: Boolean, required: false },
    deletedAt: { type: Date, required: false },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Ensure that 'id' is unique
RoomSchema.index({ tableStreamId: 1 }, { unique: true });

export default mongoose.model<IMongoRoom>('Room', RoomSchema);
