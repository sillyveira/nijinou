import mongoose, { Schema, Document } from 'mongoose';

export interface IHistory extends Document {
  rpgId: string;
  chapterName: string;
  content: string;
  ownerId: string;
  private: boolean;
  characterIds: string[];
  year: number;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
  updatedById: String;
}

const HistorySchema = new Schema<IHistory>(
  {
    rpgId: {
      type: String,
      required: true,
      index: true,
    },
    chapterName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true
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
    characterIds: {
      type: [String],
      default: [],
    },
    updatedById:{
        type: String,
        required: true
    },
    year: {
      type: Number,
      required: false,
    },
    imageUrl: {
      type: String,
      required: false,
      default: 'https://i.pinimg.com/originals/e5/1f/2f/e51f2f9a59dfd8e4e3012e144e2f19eb.gif'
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.History || mongoose.model<IHistory>('History', HistorySchema);
