import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  sku: string;
  name: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  category: 'Receita' | 'Embalagens' | 'Limpeza' | 'Diversos';
  costPrice: number;
  supplier: string;
  observation: string;
  lastMovementDate: Date;
  validity?: Date; // --- NOVO CAMPO: Validade (Opcional) ---
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
    enum: ['Receita', 'Embalagens', 'Limpeza', 'Diversos'],
    default: 'Receita' 
  },
  costPrice: { type: Number, default: 0 },
  supplier: { type: String },
  observation: { type: String },
  lastMovementDate: { type: Date, default: Date.now },
  validity: { type: Date } // --- CAMPO NO BANCO ---
});

// Evita erro de recompilação do modelo ao recarregar a página
const Inventory = mongoose.models.Inventory || mongoose.model<IProduct>('Inventory', ProductSchema);

export default Inventory;