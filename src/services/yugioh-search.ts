import axios from 'axios';
import { IPlayingCard } from '../domain/interfaces/ICards';
import { IYugiohCard } from '../domain/interfaces/IYugiohCard';

export async function search(query: string): Promise<IPlayingCard[]> {
  try {
    const response = await axios.get(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${query}`);
    return response && response.data && response.data.data ? response.data.data.map((card:IYugiohCard)=>{return mapToPlayingCard(card)}) : [];
  } catch (error) {
    console.error('Error searching for Yugioh cards:', error);
    return [];
  }
}

const mapToPlayingCard = (yugiohCard:IYugiohCard):IPlayingCard=> {
  return {
    id: yugiohCard.id.toString(),
    name: yugiohCard.name,
    image_uris: {
      small: yugiohCard.card_images[0]?.image_url_small,
      normal: yugiohCard.card_images[0]?.image_url,
    }
  }
}