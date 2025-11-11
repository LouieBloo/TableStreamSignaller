import axios from 'axios';
import { IPlayingCard } from '../domain/interfaces/ICards';
import { IOnePieceCard, IOnePieceCardSearchParams } from '../domain/interfaces/IOnePieceCard';

export async function search(params: IOnePieceCardSearchParams): Promise<IPlayingCard[]> {
  try {
    // 1. Serialize the parameters object into a URL query string.
    //    - Object.entries iterates over key/value pairs.
    //    - Filter ensures we skip undefined, null, or empty string values.
    //    - map creates the "key=value" format, using encodeURIComponent for safety.
    //    - join combines all parts with an '&'.
    const queryString = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
      .join('&');

    const apiUrl = `https://www.optcgapi.com/api/sets/filtered/?${queryString}`;

    console.log(apiUrl)

    // 2. Execute the GET request with the correctly formatted URL.
    const response = await axios.get(apiUrl);

    return response && response.data && response.data
      ? response.data.map((card: IOnePieceCard) => mapToPlayingCard(card))
      : [];
  } catch (error) {
    console.error('Error searching for One Piece cards:', error);
    return [];
  }
}

const mapToPlayingCard = (onePieceCard: IOnePieceCard): IPlayingCard => {
  return {
    id: onePieceCard.card_image_id,
    name: onePieceCard.card_name,
    life_total: Number.parseInt(onePieceCard.life),
    image_uris: {
      small: onePieceCard.card_image,
      normal: onePieceCard.card_image,
    }
  }
}