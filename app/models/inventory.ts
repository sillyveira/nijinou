import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryItem {
  itemId: string;
  quantity: number;
}

export interface IInventory extends Document {
  items: IInventoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    items: [
      {
        itemId: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
          min: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);
