import mongoose, { Schema, model, models } from 'mongoose';

const InventorySchema = new Schema({
  sku: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true },
  minQuantity: { type: Number, default: 5 },
  category: { type: String, default: 'Geral' },
  costPrice: { type: Number, default: 0 },
  supplier: { type: String, default: '' },
  observation: { type: String, default: '' },
  
  // --- NOVO CAMPO ---
  lastEntryDate: { type: String, default: '' }, // Data da última entrada (YYYY-MM-DD)
  
  updatedAt: { type: Date, default: Date.now },
});

const Inventory = models.Inventory || model('Inventory', InventorySchema);
export default Inventory;