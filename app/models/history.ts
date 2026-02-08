import mongoose, { Schema, Document } from 'mongoose';

export interface IHistory extends Document {
  rpgId: string;
  chapterName: string;
  ownerId: string;
  private: boolean;
  characterIds: string[];
  year: number;
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
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.History || mongoose.model<IHistory>('History', HistorySchema);
