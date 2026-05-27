import mongoose, { Schema, Document, Model, models, Types } from 'mongoose';

export interface IExpense extends Document {
  tripId: Types.ObjectId;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  isUnequal: boolean;
  customShares?: Map<string, number>;
  createdAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip ID is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    paidBy: {
      type: String,
      required: [true, 'Paid by is required'],
      trim: true,
    },
    splitBetween: {
      type: [String],
      required: [true, 'Split between must include at least one participant'],
      validate: {
        validator: (arr: string[]) => arr.length >= 1,
        message: 'splitBetween must have at least one participant',
      },
    },
    isUnequal: {
      type: Boolean,
      default: false,
    },
    customShares: {
      type: Map,
      of: Number,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

const Expense: Model<IExpense> =
  models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
