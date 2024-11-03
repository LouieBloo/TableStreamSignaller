import axios from 'axios';
import { PlayingCard, PokemonCard } from '../interfaces/cards';


export async function search(query: string): Promise<PlayingCard[]> {
  try {
    const response = await axios.get('https://api.pokemontcg.io/v2/cards', {
      headers: {
        'X-Api-Key': process.env.POKEMON_API_KEY,
      },
      params: {
        q: query,
        select: "id,name,images,set"
      },
    });

    return response && response.data && response.data.data ? response.data.data.map((card:PokemonCard)=>{return mapToPlayingCard(card)}) : [];
  } catch (error) {
    console.error('Error searching for Pokémon cards:', error);
    return [];
  }
}

export const mapToPlayingCard = (pokemonCard:PokemonCard):PlayingCard=> {
  return {
    id: pokemonCard.id,
    name: pokemonCard.set ? pokemonCard.name + " (" + pokemonCard.set.name + ")" : pokemonCard.name,
    image_uris: {
      normal: pokemonCard.images ? pokemonCard.images.large || pokemonCard.images.small : null
    }
  }
}