import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  date: Date;                // Coluna B: Data
  type: 'Receita' | 'Despesa'; // Coluna C: Tipo
  category: string;          // Coluna D: Categoria
  description: string;       // Coluna E: Descrição
  amount: number;            // Coluna F: Valor
  paymentMethod: string;     // Coluna G: Meio Pagamento
  costCenter: string;        // Coluna H: Centro Custo
  beneficiary: string;       // Coluna I: Beneficiário
  status: 'Pago' | 'Pendente' | 'Agendado'; // Coluna J: Status
  observation: string;       // Coluna K: Observações
  paymentDate?: Date;        // Coluna L: Data Pagamento
  receiptImage?: string;     // Coluna M: Foto Comprovante (Base64)
}

const TransactionSchema: Schema = new Schema({
  date: { type: Date, required: true, default: Date.now },
  type: { type: String, required: true, enum: ['Receita', 'Despesa'] },
  category: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, default: 'Pix' },
  costCenter: { type: String, default: 'Geral' },
  beneficiary: { type: String },
  status: { type: String, default: 'Pago', enum: ['Pago', 'Pendente', 'Agendado'] },
  observation: { type: String },
  paymentDate: { type: Date },
  receiptImage: { type: String } // Armazena a imagem codificada
});

// Evita erro de recompilação ao trocar de página
const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;