export interface IKoFiDonation {
    verification_token: string;
    message_id: string;
    timestamp: string;
    type: 'Donation' | 'Subscription' | 'Commission' | 'Shop Order';
    is_public: boolean;
    from_name: string;
    message: string;
    amount: string; // keep as string for raw parsing, can convert later
    url: string;
    email: string;
    currency: string;
    is_subscription_payment: boolean;
    is_first_subscription_payment: boolean;
    kofi_transaction_id: string;
    shop_items: null | { direct_link_code: string }[];
    tier_name: string | null;
    shipping: unknown | null; // can be typed more strictly if you use shop
}  