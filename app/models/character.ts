import mongoose, { Schema, Document } from 'mongoose';

export interface ICharacter extends Document {
  rpgId: string;
  ownerId: string;
  groupsAllowed: string[];
  name: string;
  age: number;
  sheetId: string;
  inventoryId: string;
  historyIds: string[];
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const CharacterSchema = new Schema<ICharacter>(
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
    groupsAllowed: {
      type: [String],
      default: [],
    },
    name: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    sheetId: {
      type: String,
      required: true,
    },
    inventoryId: {
      type: String,
      required: true,
    },
    historyIds: {
      type: [String],
      default: [],
    },
    imageUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Character || mongoose.model<ICharacter>('Character', CharacterSchema);
