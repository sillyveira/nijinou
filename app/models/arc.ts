import mongoose, { Schema, Document } from 'mongoose';

export interface IArc extends Document {
  rpgId: string;
  name: string;
  ownerId: string;
  groupsAllowed: string[];
  historyIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ArcSchema = new Schema<IArc>(
  {
    rpgId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    groupsAllowed: {
      type: [String],
      default: [],
    },
    historyIds: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Arc || mongoose.model<IArc>('Arc', ArcSchema);
