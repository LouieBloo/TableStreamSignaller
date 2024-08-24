export interface ScryfallCard {
    id: string;                         // The unique UUID of the card
    name: string;                       // The name of the card
    mana_cost: string;                  // The mana cost of the card
    cmc: number;                        // Converted mana cost
    type_line: string;                  // The type line of the card (e.g., "Creature — Elf Druid")
    oracle_text: string;                // The oracle text of the card
    colors: string[];                   // Array of colors (e.g., ["G", "U"])
    color_identity: string[];           // Array of color identity (e.g., ["G", "U"])
    set: string;                        // The set code of the card (e.g., "znr" for Zendikar Rising)
    set_name: string;                   // The full name of the set (e.g., "Zendikar Rising")
    rarity: string;                     // The rarity of the card (e.g., "rare")
    image_uris?: {                      // An object containing URIs to images of the card
      small: string;
      normal: string;
      large: string;
      png: string;
      art_crop: string;
      border_crop: string;
    };
    prices: {                           // An object containing the prices of the card in various currencies
      usd?: string;
      usd_foil?: string;
      eur?: string;
      eur_foil?: string;
      tix?: string;                     // MTGO tickets price
    };
    legalities: {                       // An object containing the legality of the card in various formats
      standard: string;
      modern: string;
      legacy: string;
      vintage: string;
      commander: string;
      [key: string]: string;            // Allows for additional formats
    };
    reserved: boolean;                  // Whether the card is on the reserved list
    foil: boolean;                      // Whether the card has a foil version
    nonfoil: boolean;                   // Whether the card has a non-foil version
    reprint: boolean;                   // Whether the card is a reprint
    set_uri: string;                    // A link to the set on Scryfall
    rulings_uri: string;                // A link to the card's rulings on Scryfall
    scryfall_uri: string;               // A link to the card's page on Scryfall
    collector_number: string;           // The collector number of the card within its set
    digital: boolean;                   // Whether the card is available digitally (MTGO)

    card_faces?:ScryfallCard[]
}
  
  