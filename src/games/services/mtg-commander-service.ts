import { PlayingCard, slimCard } from "../../interfaces/cards";
import { IGameEvent } from "../../interfaces/game";
import { Room } from "../../rooms/room";
import { Player } from "../../users/player";

//reset all commander damages to zero
export const ResetCommanderDamagesToZero = (room: Room): Room =>{
    room.players.forEach((player:Player)=>{
        for (const [opponentId, value] of Object.entries(player.commanderDamages)) {
            for (const [cardId, value2] of Object.entries(player.commanderDamages[opponentId])) {
                player.commanderDamages[opponentId][cardId].damage = 0;
            }
        }
    })

    return room;
}


export const SetPlayerDefaults = (newPlayer: Player, room:Room)=>{
    newPlayer.commanders = []
    newPlayer.commanderDamages = {};

    //initilize this new players commander damages of any other players that are already in the game
    room.players.forEach((oldPlayer:Player)=>{
        if(oldPlayer.id != newPlayer.id){
            newPlayer.commanderDamages[oldPlayer.id] = {};
            oldPlayer.commanders.forEach((commander:PlayingCard)=>{
                newPlayer.commanderDamages[oldPlayer.id][commander.id] = {
                    playerId: oldPlayer.id,
                    damage: 0,
                    card: commander
                }
            })
        }
    })
}

export const SetCommander = (gameEvent: IGameEvent, room:Room)=>{
    //helper variables
    let targetPlayer:Player = gameEvent.callingPlayer;
    let newCommander:PlayingCard = gameEvent.payload.card ? slimCard(gameEvent.payload.card) : null;
    let oldCommander:PlayingCard = gameEvent.payload.index < gameEvent.callingPlayer.commanders.length ?  gameEvent.callingPlayer.commanders[gameEvent.payload.index] : null;
    //set new commander, its possible its null (to clear)
    if(newCommander){
        newCommander.castAmount = 0;
        gameEvent.callingPlayer.commanders[gameEvent.payload.index] = newCommander;
    }else{
        //note we only ever clear out the 2nd commander
        gameEvent.callingPlayer.commanders = [gameEvent.callingPlayer.commanders[0]]
    }

    //modify all the other players commander damages to reflect this new commander
    room.players.forEach((player:Player)=>{
        if(player.id != targetPlayer.id){
            //this player might not have any commander damages from the target player yet. Initilize it
            if(!player.commanderDamages[targetPlayer.id]){
                player.commanderDamages[targetPlayer.id] = {};
            }
            //remove old commander if it exists
            if(oldCommander &&  player.commanderDamages[targetPlayer.id][oldCommander.id]){
                delete(player.commanderDamages[targetPlayer.id][oldCommander.id])
            }

            //set new commander damage (could be null if clearing)
            if(newCommander){
                player.commanderDamages[targetPlayer.id][newCommander.id] = {
                    playerId: targetPlayer.id,
                    damage: 0,
                    card: newCommander
                }
            }
        }
    })

    return room.players;
}

export const ModifyPlayerCommanderDamage = (gameEvent: IGameEvent, maxCommanderDamageUntilDead:number) => {
    return gameEvent.callingPlayer.takeCommanderDamage(gameEvent.payload.damagingPlayer, gameEvent.payload.amount, gameEvent.payload.card, maxCommanderDamageUntilDead);
}

export const ModifyPlayerCommanderCastAmount = (gameEvent: IGameEvent) : Player => {
    gameEvent.callingPlayer.commanders.forEach((commander:PlayingCard)=>{
        if(commander.id == gameEvent.payload.commander.id){
            commander.castAmount += gameEvent.payload.amountToModify;
            if(commander.castAmount < 0){
                commander.castAmount = 0;
            }
        }
    })
    return gameEvent.callingPlayer;
}

export const RemoveCommanderDamagesFromPlayer = (removedPlayerId:string, room: Room) => {
    const playerIdToRemove = removedPlayerId;
    room.players.forEach((player: Player) => {
        if (player.id !== playerIdToRemove) {
            if (player.commanderDamages[playerIdToRemove]) {
                delete player.commanderDamages[playerIdToRemove]
            }
        }
    });
    
    return room.players;
}