import mongoose, { Document, Schema } from 'mongoose';
import sanitizeHtml from 'sanitize-html';
import {
	RegExpMatcher,
	TextCensor,
	englishDataset,
	englishRecommendedTransformers,
} from 'obscenity';

const censor = new TextCensor();

const matcher = new RegExpMatcher({
	...englishDataset.build(),
	...englishRecommendedTransformers,
});

export interface IDonation extends Document {
  amount: number;
  from:string;
  donation_type: 'SINGLE' | 'FIRST_MONTHLY' | 'MONTHLY';
  user?: mongoose.Types.ObjectId;
  isPublic: boolean;
  message?: string;
  kofiMessageId?: string;
  kofiTransactionId?: string;
  email: string;
  createdAt:Date;
}

const DonationSchema: Schema = new Schema(
  {
    amount: { type: Number, required: true },
    from: {type: String},
    donation_type: {
      type: String,
      enum: ['SINGLE', 'FIRST_MONTHLY', 'MONTHLY'],
      required: true,
    },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    isPublic: { type: Boolean, required: true },
    message: { type: String },
    kofiMessageId: { type: String },
    kofiTransactionId: { type: String },
    email: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Sanitize and clean message+from
DonationSchema.pre<IDonation>('save', function (next) {
  if (this.message) {
    // Strip all HTML
    let cleanMessage = sanitizeHtml(this.message, {
      allowedTags: [],
      allowedAttributes: {},
    });

    // Censor message
    const matches = matcher.getAllMatches(cleanMessage);
    cleanMessage = censor.applyTo(cleanMessage, matches)

    // Trim and limit length
    this.message = cleanMessage.trim().slice(0, 300);
  }

  if(this.from){
    // censor name
    const nameMatches = matcher.getAllMatches(this.from);
    this.from = censor.applyTo(this.from, nameMatches)

    this.from = this.from.trim().slice(0, 300);
  }
  

  next();
});

export default mongoose.model<IDonation>('Donation', DonationSchema);
