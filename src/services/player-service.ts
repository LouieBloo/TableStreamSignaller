import RoomManager from "../services/room-manager";

const updateQrCodeTokenOnPlayer = async (
  playerId: string,
  roomId: string
): Promise<any> => {
  const room = await RoomManager.getRoom(roomId);
  if(!room)
    return ""
  
  const player = room.players.find((player) => player.id === playerId);

  if (!player) throw new Error(`Could not find player by id: ${playerId}`);

  const token = player.setQrCodeToken();
  await room.saveAndClose();

  return token;

};

export const PlayerService = {
  updateQrCodeTokenOnPlayer
};