import mongoose, { Schema, Document } from 'mongoose';

export interface ISheet extends Document {
  rpgId: string;
  ownerId: string;
  private: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SheetSchema = new Schema<ISheet>(
  {
    rpgId: {
      type: String,
      required: true,
      index: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    private: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Sheet || mongoose.model<ISheet>('Sheet', SheetSchema);
