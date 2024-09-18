import { GameType, UserType } from "./IGame";

export interface JoinRoomPayload {
  playerId: string;
  roomId: string;
  roomName: string;
  password: string;
  gameType: GameType;
  playerName: string;
  userType: UserType;
  maxPlayers: number;
  reactionEnabled: boolean;
  isSharingImages: boolean;
  isPublic: boolean;
  joinerJwtToken: string;
  allowSpectators: boolean;
  isPhoneCamera?: boolean;
}
