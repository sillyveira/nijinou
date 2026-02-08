import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  since: string;
  rpgId: string[];
  ownerId: string[];
  private: boolean;
  groupsAllowed: string[];
  historyIds: string[];
  characterIds: string[];
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
    },
    since: {
      type: String,
      required: true,
    },
    rpgId: {
      type: [String],
      default: [],
    },
    ownerId: {
      type: [String],
      default: [],
    },
    private: {
      type: Boolean,
      default: false,
    },
    groupsAllowed: {
      type: [String],
      default: [],
    },
    historyIds: {
      type: [String],
      default: [],
    },
    characterIds: {
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

export default mongoose.models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema);
