export interface IUser {
    name: string;
    id: string;
    email?: string;
    createdAt?: Date;
}

export interface IAddPlayerParams{
    playerId: string;
    playerName: string;
    socketId: string;
    password?:string;
    ipAddress?:string;
    isSharingImages?:boolean;
    jwtToken?:string;
}