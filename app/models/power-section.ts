import mongoose, { Schema, Document } from 'mongoose';

export interface IPowerSection extends Document {
  rpgId: string;
  characterId: string;
  ownerId: string;
  name: string;
  imageUrl: string;
  private: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PowerSectionSchema = new Schema<IPowerSection>(
  {
    rpgId: {
      type: String,
      required: true,
      index: true,
    },
    characterId: {
      type: String,
      required: true,
      index: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: '',
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

export default mongoose.models.PowerSection || mongoose.model<IPowerSection>('PowerSection', PowerSectionSchema);
