import MongoDonation, { IDonation } from '../mongo/models/donation-model';
import { IKoFiDonation } from './interfaces/IKofiInterface';


export const parseIncomingDonation = async (donation: IKoFiDonation): Promise<any[]> => {

  // Only handle donations or subscription events
  if (donation.type !== 'Donation' && !donation.is_subscription_payment) {
    return null;
  }

  const donationType = donation.is_subscription_payment ? donation.is_first_subscription_payment ? 'FIRST_MONTHLY' : 'MONTHLY' : 'SINGLE';

  // Create donation entry
  await MongoDonation.create({
    amount: parseFloat(donation.amount),
    from: donation.from_name,
    donation_type: donationType,
    isPublic: donation.is_public,
    message: donation.message || '',
    kofiMessageId: donation.message_id,
    kofiTransactionId: donation.kofi_transaction_id,
    email: donation.email,
  });
}