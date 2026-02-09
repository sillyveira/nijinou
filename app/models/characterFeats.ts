import mongoose, { Schema, Document } from 'mongoose';

export interface ICharacterFeats extends Document {
  rpgId: string;
  ownerId: string;
  arcId: string;
  characterId: string;
  private: boolean;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const characterFeats = new Schema<ICharacterFeats>(
  {
    rpgId: {
      type: String,
      required: true,
      index: true,
    },
    characterId: {
        type: String,
        required: true,
        index: true
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    arcId: {
        type: String,
        required: true,
        index: true
    },
    private: {
      type: Boolean,
      default: false,
    },
    content: {
      type: String,
      required: false,
      default: ''
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.characterFeats || mongoose.model<ICharacterFeats>('CharacterFeats', characterFeats);
