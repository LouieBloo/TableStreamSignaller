import { Game } from "../games/game";
import { GameError, GameErrorSeverity, GameErrorType, GameEvent, GameType, IGameEvent, PlayerProperties } from "../interfaces/IGame";
import { IMessage } from "../interfaces/IMessaging";
import { Player } from "../users/player";
import { MTGCommander } from "../games/mtg-commander";
import { Spectator } from "../users/spectator";
import { saveRoomAndUnlock, unlockRoom } from "../../infrastructure/redis/redis";
import { Type } from "class-transformer";
import { MTGStandard } from "../games/mtg-standard";
import { MTGModern } from "../games/mtg-modern";
import { MTGVintage } from "../games/mtg-vintage";
import { MTGLegacy } from "../games/mtg-legacy";
import { PokemonStandard } from "../games/pokemon-standard";
import { MTGPauperCommander } from "../games/mtg-pauper-commander";
import { updateRoom } from "../../infrastructure/mongo/mongo-repository";
import { YugiohStandard } from "../games/yugioh-standard";
import { getIceServerList } from "../../infrastructure/metered/metered-service";
import { YugiohDomain } from "../games/yugioh-domain";
import { IAddPlayerParams } from "../interfaces/IPlayer";
import { getUserIdFromToken } from "../users/services/user-service";
import User, { IMongoUser } from '../../infrastructure/mongo/models/user-model';
import { IRoomEvent, IRoomHistoryEvent, RoomEvent } from "../interfaces/IRoom";

const { v4: uuidv4 } = require('uuid');

export class Room {
  @Type(() => Player)
  players: Player[];

  @Type(() => Spectator)
  spectators: Spectator[];

  @Type(() => Game)
  game: Game;

  maxPlayers:number = 4;
  playerSockets: string[] = [];
  spectatorSockets: string[] = [];
  bannedPlayerIpAddresses: string[] = [];
  bannedUserIds: string[] = [];
  redisLock: any;
  id: string;
  password:string;
  scheduledRoom:boolean = false;
  public:boolean = false;
  allowPlayerKicking:boolean = true;
  allowSpectators:boolean = false;
  initialScheduleTTLInSeconds: number = 3600;// games waiting to be played will be destroyed after this time
  inactivityTimeUntilDestroyedInSeconds:number = 3600 // 1 hour default
  reactionsEnabled:boolean = true;
  name: string;
  messages: IMessage[];

  iceServerList: any[];

  history: IRoomHistoryEvent[] = [];

  constructor(roomName: string,password:string, gameType: GameType, maxPlayers:number) {
    this.id = uuidv4();
    this.name = roomName;
    this.messages = [];
    this.players = [];
    this.spectators = [];
    this.password = password;
    this.maxPlayers = maxPlayers;
    this.game = Room.createGame(gameType);
  }

  saveAndClose = async (gameEvent: IGameEvent = null, setScheduledTTL:boolean = false) => {
    try{
      this.logGameEvent(gameEvent);
      saveRoomAndUnlock(this,setScheduledTTL);
    }catch(error){
      console.log("catching save and close: ", error)
    }
  }

  close = async () => {
    unlockRoom(this.redisLock);
  }

  static createGame(gameType: GameType) {
    if (typeof gameType === 'string') {
      gameType = Number(gameType);
    }
    switch (gameType) {
      case GameType.MTGCommander:
        return new MTGCommander();
      case GameType.MTGStandard:
        return new MTGStandard();
      case GameType.MTGModern:
        return new MTGModern();
      case GameType.MTGVintage:
        return new MTGVintage();
      case GameType.MTGLegacy:
        return new MTGLegacy();
      case GameType.PokemonStandard:
        return new PokemonStandard();
      case GameType.MTGPauperCommander:
        return new MTGPauperCommander();
      case GameType.YugiohStandard:
        return new YugiohStandard();
      case GameType.YugiohDomain:
        return new YugiohDomain();
    }
  }

  static gameTypeMapping(gameType: string) {
    switch (gameType) {
      case "MTGCommander":
        return GameType.MTGCommander
      case "MTGStandard":
        return GameType.MTGStandard
      case "MTGModern":
        return GameType.MTGModern
      case "MTGVintage":
        return GameType.MTGVintage
      case "MTGLegacy":
        return GameType.MTGLegacy
      case "PokemonStandard":
        return GameType.PokemonStandard;
      case "MTGPauperCommander":
        return GameType.MTGPauperCommander;
      case "YugiohStandard":
        return GameType.YugiohStandard;
      case "YugiohDomain":
        return GameType.YugiohDomain;
    }

    return null;
  }

  public verifyPassword(password:string): boolean{
    return this.password === password;
  }

  public canAddPlayer(playerId:string, socketId:string):boolean{
    //if a player is rejoining we let them in
    if(playerId){
      let savedPlayer = this.players.find(e => e.id === playerId);
      if(savedPlayer){
        return true;
      }
    }
    
    //if not a new player make sure we have room
    return this.players.length < this.maxPlayers;
  }

  public async addPlayer(playerParams:IAddPlayerParams): Promise<Player> {

    if(this.bannedPlayerIpAddresses.includes(playerParams.ipAddress)){
      throw new GameError(GameErrorType.EnteringBannedRoom, "You have been banned from this room.", GameErrorSeverity.Error);
    }

    const userId:string | null = await getUserIdFromToken(playerParams.jwtToken);

    if(userId && this.bannedUserIds.includes(userId)){
      throw new GameError(GameErrorType.EnteringBannedRoom, "You have been banned from this room.", GameErrorSeverity.Error);
    }

    if(this.public && !userId){
      throw new GameError(GameErrorType.InvalidAction, "You must be logged in to join a public room.", GameErrorSeverity.Error);
    }
 
    let player = this.players.find(e => e.id === playerParams.playerId);

    if (!player) {
      //we only check password on new players
      if(this.password && !this.verifyPassword(playerParams.password)){
        throw new GameError(GameErrorType.InvalidPassword, "Invalid Password",GameErrorSeverity.Error);
      }

      //if logged in user, force name to be the one saved in mongo
      let name:string = playerParams.playerName;

      if(this.public && userId){
        const mongoUser:IMongoUser = await User.findById(userId);
        name = mongoUser.name;
      }

      await this.setIceServerList()

      player = new Player(name, playerParams.socketId, this.players.length, this.game.startingLifeTotal);
      player.ipAddress = playerParams.ipAddress;
      player.isSharingImages = playerParams.isSharingImages == false ? false: true;
      player.mongoUserId = userId;
      
      if (this.players.length == 0) {
        player.admin = true;
      }

      this.game.setPlayerDefaults(player, this);

      this.players.push(player)

      this.logRoomEvent({
        event: RoomEvent.PlayerAdded,
        value: {
          id: player.id,
          name: player.name
        }
      })

      //send changes to mongo
      updateRoom(this);
    } else {
      player.socketId = playerParams.socketId;
    }

    return player;
  }

  public async addSpectator(playerId: string, spectatorName: string, socketId: string, password:string): Promise<Spectator> {
    if(!this.allowSpectators){
      throw new GameError(GameErrorType.InvalidAction, "No spectators allowed",GameErrorSeverity.Error);
    }

    let spectator = this.spectators.find(e => e.id === playerId);

    if (!spectator) {
      //we only check password on new spectators
      if(this.password && !this.verifyPassword(password)){
        throw new GameError(GameErrorType.InvalidPassword, "Invalid Password",GameErrorSeverity.Error);
      }

      await this.setIceServerList()

      spectator = new Spectator(spectatorName, socketId);
      this.spectators.push(spectator)
    } else {
      spectator.socketId = socketId;
    }

    return spectator;
  }

  public userDisconnected(socketId: string, playerId: string | null) {
    this.playerSockets = this.playerSockets.filter((id: any) => id !== socketId);
    this.spectatorSockets = this.spectatorSockets.filter((id: any) => id !== socketId);

    if(playerId)
      this.players = this.players.filter(p => p.id != playerId)
    
  }


  public kickPlayer(gameEvent: IGameEvent): Player {
    if(!gameEvent.callingPlayer.admin || !this.allowPlayerKicking){
      throw new GameError(GameErrorType.InvalidAction, "You cant make that action", GameErrorSeverity.Error);
    }

    const playerToKick:Player = this.players.find(p => p.id === gameEvent.payload.playerId);
    
    if (!playerToKick) {
      throw new GameError(GameErrorType.InvalidAction, "Player not found", GameErrorSeverity.Error);
    }

    this.bannedPlayerIpAddresses.push(playerToKick.ipAddress);

    if(playerToKick.mongoUserId){
      this.bannedUserIds.push(playerToKick.mongoUserId);
    }

    this.userDisconnected(playerToKick.socketId, playerToKick.id);

    this.logRoomEvent({
        event: RoomEvent.PlayerRemoved,
        value: {
          id: playerToKick.id,
          name: playerToKick.name
        }
    })

    //send changes to mongo
    updateRoom(this);

    return playerToKick;
  }

  public getAllSocketIds(): string[] {
    return this.playerSockets.concat(this.spectatorSockets);
  }

  public addMessage(socketId: string, message: string): IMessage | null {
    const targetPlayer: Player = this.getPlayer(socketId);

    if (targetPlayer) {
      let newMessage = {
        text: message,
        player: { name: targetPlayer.name, id: targetPlayer.id },
        date: new Date()
      }
      this.messages.push(newMessage)
      return newMessage;
    } else {
      return null;
    }
  }

  setNewAdmin(id: string, callingPlayer: Player): Player{

    if(!callingPlayer.admin){
      throw new GameError(GameErrorType.InvalidAction, "Calling player is not admin", GameErrorSeverity.Error);
    }
    
    const newAdmin = this.players.find(p => p.id === id)

    if(!newAdmin)
      throw new GameError(GameErrorType.GenericWarning, "Could not find player", GameErrorSeverity.Error)

    newAdmin.setAdmin(true);
    callingPlayer.setAdmin(false);
    return newAdmin;
  }

  getPlayer(socketId: string) {
    return this.players.find(p => p.socketId === socketId);
  }

  gameEvent(socketId: string, gameEvent: IGameEvent): any {
    gameEvent.callingPlayer = this.getPlayer(socketId);
    gameEvent.messages = [];
    if (gameEvent.callingPlayer) {
      return this.game.event(gameEvent, this);
    } else {
      throw new GameError(GameErrorType.InvalidAction, "You cant make that action",GameErrorSeverity.Error);
    }
  }

  generateRandomPassword(length: number = 10): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~';
    let password = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      password += characters[randomIndex];
    }
  
    return password;
  }

  setIceServerList = async() => {
    if(this.iceServerList){return;}
    this.iceServerList = await getIceServerList();
  }

  logHistory = async(event: IRoomHistoryEvent)=>{
    if(!event){return;}

    event.createdAt = new Date();
    this.history.push(event);
  }

  logRoomEvent = (event: IRoomEvent) =>{
    console.log(event)
    if(!event){return;}

    let historyEvent:IRoomHistoryEvent = {
      type: RoomEvent[event.event],
      player: event.callingPlayer
    }

    switch(event.event){
      case RoomEvent.PlayerAdded:
        historyEvent.value = event.value;
        break;
      case RoomEvent.PlayerRemoved:
        historyEvent.value = event.value;
        break;
    }

    this.logHistory(historyEvent);
  }

  logGameEvent = (event: IGameEvent)=>{
    console.log(event)
    if(!event){return;}
    let historyEvent:IRoomHistoryEvent = {
      player: {
        id: event.callingPlayer.id,
        name: event.callingPlayer.name
      },
      type: GameEvent[event.event]
    }

    switch (event.event) {
      case GameEvent.RandomizePlayerOrder:
      case GameEvent.SetPlayerTurnOrders:
        historyEvent.value = this.players.sort((a, b) => a.turnOrder - b.turnOrder).map(player => player.name).join(', ');
        break;
      case GameEvent.ModifyPlayerProperty:
        historyEvent.property = PlayerProperties[event.payload.property];
        historyEvent.value = event.payload.amountToModify;
        // @ts-ignore
        historyEvent.currentValue = event.callingPlayer[PlayerProperties[event.payload.property]] ;
        break;
      case GameEvent.ModifyGameProperty:
        break;
      case GameEvent.ResetGame:
        break;
      case GameEvent.FlipCoins:
        historyEvent.property = event.payload.coinsToFlip + " coin flip"
        historyEvent.value = event.response.results;
        break;
      case GameEvent.RollDice:
        historyEvent.property = event.payload.sidedDice;
        historyEvent.value = event.response.results;
        break;
    }

    event.history = historyEvent;
    this.logHistory(historyEvent);
  }
}