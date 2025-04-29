import MongoDonation, { IDonation } from '../models/donation-model';
import { FilterQuery } from 'mongoose';

interface GetDonationsParams {
  amount?: number;
  from?: string;
  donation_type?: 'SINGLE' | 'FIRST_MONTHLY' | 'MONTHLY';
  user?: string;
  isPublic?: boolean;
  email?: string;
  kofiTransactionId?: string;
  kofiMessageId?: string;
  sort?: {
    createdAt?: 'asc' | 'desc';
  };
  limit?: number;
}

export const getDonations = async (parameters: GetDonationsParams, sanitizeFields: boolean): Promise<Partial<IDonation>[]> => {
  const query: FilterQuery<IDonation> = {};

  // Build query based on filters
  if (parameters.amount !== undefined) {
    query.amount = parameters.amount;
  }

  if (parameters.from) {
    query.from = { $regex: new RegExp(parameters.from, 'i') };
  }

  if (parameters.donation_type) {
    query.donation_type = parameters.donation_type;
  }

  if (parameters.user) {
    query.user = parameters.user;
  }

  if (parameters.isPublic !== undefined) {
    query.isPublic = parameters.isPublic;
  }

  if (parameters.email) {
    query.email = { $regex: new RegExp(parameters.email, 'i') };
  }

  if (parameters.kofiTransactionId) {
    query.kofiTransactionId = parameters.kofiTransactionId;
  }

  if (parameters.kofiMessageId) {
    query.kofiMessageId = parameters.kofiMessageId;
  }

  // Build Mongoose query
  let mongooseQuery = MongoDonation.find(query);

  // Apply sorting
  if (parameters.sort?.createdAt) {
    mongooseQuery = mongooseQuery.sort({ createdAt: parameters.sort.createdAt === 'asc' ? 1 : -1 });
  }

  // Apply limit
  if (parameters.limit) {
    mongooseQuery = mongooseQuery.limit(parameters.limit);
  }

  const donations = await mongooseQuery.exec();

  // Trim if requested
  if (sanitizeFields) {
    return donations.map(donation => ({
      amount: donation.amount,
      from: donation.from,
      donation_type: donation.donation_type,
      isPublic: donation.isPublic,
      message: donation.message,
      createdAt: donation.createdAt,
    }));
  }

  return donations;
}