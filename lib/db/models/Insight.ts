import mongoose, { Document, Schema } from 'mongoose';

export interface IInsight extends Document {
  date: string;       // Formato YYYY-MM-DD para controlar o dia
  content: string;    // O texto gerado pela IA
  generatedAt: Date;  // Hora exata que foi gerado
  hash: string;       // Um código para saber se os dados mudaram
}

const InsightSchema: Schema = new Schema({
  date: { type: String, required: true, unique: true }, // Um por dia
  content: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },
  hash: { type: String }
});

// Evita erro de recompilação ao navegar
const Insight = mongoose.models.Insight || mongoose.model<IInsight>('Insight', InsightSchema);

export default Insight;