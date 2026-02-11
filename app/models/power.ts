import mongoose, { Schema, Document } from 'mongoose';

export interface IPower extends Document {
  rpgId: string;
  characterId: string;
  sectionId: string;
  ownerId: string;
  name: string;
  imageUrl: string;
  content: string;
  powerType: 'skill' | 'transformation';
  private: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PowerSchema = new Schema<IPower>(
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
    sectionId: {
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
    content: {
      type: String,
      default: '',
    },
    powerType: {
      type: String,
      enum: ['skill', 'transformation'],
      required: true,
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

export default mongoose.models.Power || mongoose.model<IPower>('Power', PowerSchema);
