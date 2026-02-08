import mongoose, { Schema, model, models } from 'mongoose';

export interface IGroup {
  _id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: [true, 'Nome do grupo é obrigatório'],
      trim: true,
      maxlength: [100, 'Nome do grupo não pode exceder 100 caracteres'],
    },
    ownerId: {
      type: String,
      required: [true, 'Owner ID é obrigatório'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice composto para facilitar queries
groupSchema.index({ ownerId: 1, name: 1 });

const Group = models.Group || model<IGroup>('Group', groupSchema);

export default Group;
