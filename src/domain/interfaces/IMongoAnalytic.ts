export interface IMongoAnalytic {
    startDate: Date,
    endDate: Date,
    roomCount: number;
    totalPlayers: number;
    averagePlayers: number;
    averageRoomDurationInMinutes: number;
}