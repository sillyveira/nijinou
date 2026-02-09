import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  rpgId: string;
  name: string;
  ownerId: string;
  groupsAllowed: string[];
  characterIds: string[];
  historyIds: string[];
  private: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
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
    characterIds: {
        type: [String],
        default: []
    },
    groupsAllowed: {
      type: [String],
      default: [],
    },
    historyIds: {
      type: [String],
      default: [],
    },
    private: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
