import mongoose, { Schema, model, models } from 'mongoose';

const OrderSchema = new Schema({
  orderNumber: { type: String, required: true },
  customerName: { type: String, required: true },
  items: [
    {
      name: { type: String, required: true },
      qty: { type: Number, default: 1 },
      price: { type: Number, default: 0 }
    }
  ],
  totalValue: { type: Number, required: true },
  deliveryDate: { type: String, required: true }, // Mudamos para String (YYYY-MM-DD) para evitar fuso horário
  status: { type: String, default: 'pendente' }, // pendente, producao, entregue, cancelado
  
  // --- NOVOS CAMPOS ---
  deliveryType: { type: String, default: 'Retirada' }, // Retirada ou Entrega
  paymentStatus: { type: String, default: 'Pendente' }, // Pendente, Pago, Parcial
  observation: { type: String, default: '' }, // Alergias, Endereço, Detalhes
  
  createdAt: { type: Date, default: Date.now },
});

const Order = models.Order || model('Order', OrderSchema);

export default Order;