import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  orderDate: Date;           // Data de Entrada (NOVO)
  customerName: string;
  deliveryDate: Date;
  description: string;
  totalValue: number;
  paymentStatus: 'Pendente' | 'Sinal 50% Pago' | 'Pago Integral';
  status: 'Pendente' | 'Em Produção' | 'Pronto' | 'Entregue' | 'Cancelado';
  deliveryMethod: 'Retirada' | 'Entrega';
  address: string;
  contact: string;
  observation: string;
}

const OrderSchema: Schema = new Schema({
  orderDate: { type: Date, default: Date.now }, // Preenche automático
  customerName: { type: String, required: true },
  deliveryDate: { type: Date, required: true },
  description: { type: String, required: true },
  totalValue: { type: Number, required: true, default: 0 },
  paymentStatus: { 
    type: String, 
    enum: ['Pendente', 'Sinal 50% Pago', 'Pago Integral'], 
    default: 'Pendente' 
  },
  status: { 
    type: String, 
    enum: ['Pendente', 'Em Produção', 'Pronto', 'Entregue', 'Cancelado'], 
    default: 'Pendente' 
  },
  deliveryMethod: { type: String, enum: ['Retirada', 'Entrega'], default: 'Retirada' },
  address: { type: String },
  contact: { type: String },
  observation: { type: String }
});

const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;