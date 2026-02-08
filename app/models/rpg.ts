import mongoose, { Schema, Document } from 'mongoose';

export interface IRpg extends Document {
  name: string;
  ownerId: string;
  imageUrl: string;
  groupsAllowed: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RpgSchema = new Schema<IRpg>(
  {
    name: {
      type: String,
      required: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    groupsAllowed: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Rpg || mongoose.model<IRpg>('Rpg', RpgSchema);
