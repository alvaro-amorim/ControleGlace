import mongoose, { Schema, model, models } from 'mongoose';

const TransactionSchema = new Schema({
  type: { type: String, required: true, enum: ['entrada', 'saida'] },
  category: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  
  paymentMethod: { type: String, default: 'Dinheiro' },
  costCenter: { type: String, default: 'Variável' },
  payee: { type: String, default: '' },
  status: { type: String, default: 'Pendente' },
  observation: { type: String, default: '' },
  dueDate: { type: String, default: '' },
  
  // --- MUDANÇA: Campo para a Imagem (String gigante) ---
  attachment: { type: String, default: '' }, 
  
  createdAt: { type: Date, default: Date.now },
});

const Transaction = models.Transaction || model('Transaction', TransactionSchema);

export default Transaction;