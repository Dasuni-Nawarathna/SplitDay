import mongoose, { Schema, Document, Model, models, Types } from 'mongoose';

export interface IComment extends Document {
  tripId: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  userProfilePicture?: string;
  text: string;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    userName: {
      type: String,
      required: [true, 'User Name is required'],
    },
    userProfilePicture: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
  }
);

const Comment: Model<IComment> = models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
