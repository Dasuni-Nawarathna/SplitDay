import mongoose, { Schema, Document, Model, models, Types } from 'mongoose';

export interface ITrip extends Document {
  userId: Types.ObjectId;
  userIds?: Types.ObjectId[];
  name: string;
  inviteCode: string;
  participants: string[];
  createdAt: Date;
}

const TripSchema = new Schema<ITrip>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    userIds: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    name: {
      type: String,
      required: [true, 'Trip name is required'],
      trim: true,
    },
    inviteCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    participants: {
      type: [String],
      required: [true, 'At least one participant is required'],
      validate: {
        validator: (arr: string[]) => arr.length >= 1,
        message: 'A trip must have at least one participant',
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // we manage createdAt manually
    versionKey: false,
  }
);

// Generate a unique invite code before saving if one isn't already set
TripSchema.pre<ITrip>('save', function (next) {
  if (!this.inviteCode) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.inviteCode = `TRIP-${rand}`;
  }
  next();
});

const Trip: Model<ITrip> = models.Trip || mongoose.model<ITrip>('Trip', TripSchema);

export default Trip;
