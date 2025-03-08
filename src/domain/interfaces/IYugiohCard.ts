export interface IYugiohCard {
    id: number,
    name: string,
    card_images: CardImage[]
}

export interface CardImage {
    id: number,
    image_url: string,
    image_url_small: string,
    image_url_cropped: string,
}