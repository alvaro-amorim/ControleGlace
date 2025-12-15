import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  sku: string;
  name: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  category: 'Receita' | 'Embalagens' | 'Limpeza' | 'Diversos'; // As 4 categorias
  costPrice: number;
  supplier: string;
  observation: string;
  lastMovementDate: Date; // Nova data para entrada OU saída
}

const ProductSchema: Schema = new Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true, default: 'un' },
  minQuantity: { type: Number, required: true, default: 5 },
  category: { 
    type: String, 
    required: true, 
    enum: ['Receita', 'Embalagens', 'Limpeza', 'Diversos'], // Trava as opções
    default: 'Receita' 
  },
  costPrice: { type: Number, default: 0 },
  supplier: { type: String },
  observation: { type: String },
  lastMovementDate: { type: Date, default: Date.now }
});

// Evita erro de recompilação do modelo
const Inventory = mongoose.models.Inventory || mongoose.model<IProduct>('Inventory', ProductSchema);

export default Inventory;