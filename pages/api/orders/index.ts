import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db/mongoose';
import Order from '../../../lib/db/models/Order';
import { appendToSheet, updateRowInSheet, deleteRowInSheet } from '../../../lib/googleSheets';

// Formata YYYY-MM-DD para DD/MM/YYYY
const formatDateForSheet = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  await dbConnect();
  const body: any = req.body;

  switch (method) {
    case 'GET':
      try {
        const orders = await Order.find({}).sort({ deliveryDate: 1 }); // Ordena por data de entrega (mais urgente primeiro)
        res.status(200).json({ success: true, data: orders });
      } catch (error) { res.status(400).json({ success: false }); }
      break;

    case 'POST':
      try {
        const { _id, ...newOrderData } = body;
        
        // Garante formato de data
        if (!newOrderData.deliveryDate) newOrderData.deliveryDate = new Date().toISOString().split('T')[0];

        const order: any = await Order.create(newOrderData);

        const itemsSummary = order.items?.map((i: any) => `${i.qty}x ${i.name}`).join(', ') || '';
        
        // Mapeamento Planilha (A até J)
        const sheetRow = [
          order._id.toString(),             // A: ID
          order.orderNumber,                // B: Pedido
          order.customerName,               // C: Cliente
          itemsSummary,                     // D: Resumo
          order.totalValue,                 // E: Valor
          formatDateForSheet(order.deliveryDate), // F: Data (DD/MM/AAAA)
          order.status,                     // G: Status Pedido
          order.deliveryType,               // H: Tipo Entrega
          order.paymentStatus,              // I: Pagamento
          order.observation || ''           // J: Observações
        ];
        
        await appendToSheet('Pedidos!A:J', sheetRow);

        res.status(201).json({ success: true, data: order });
      } catch (error: any) {
        console.error("Erro Criar Pedido:", error);
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'PUT':
      try {
        const { _id, ...updateData } = body;
        const order: any = await Order.findByIdAndUpdate(_id, updateData, { new: true });
        
        if (order) {
           const itemsSummary = order.items?.map((i: any) => `${i.qty}x ${i.name}`).join(', ') || '';
           
           const sheetRow = [
              order._id.toString(),
              order.orderNumber,
              order.customerName,
              itemsSummary,
              order.totalValue,
              formatDateForSheet(order.deliveryDate),
              order.status,
              order.deliveryType,
              order.paymentStatus,
              order.observation || ''
           ];
           
           await updateRowInSheet('Pedidos', order._id.toString(), sheetRow);
        }
        res.status(200).json({ success: true, data: order });
      } catch (error: any) { res.status(400).json({ success: false }); }
      break;

    case 'DELETE':
      try {
        const { id } = req.query;
        await deleteRowInSheet('Pedidos', id as string); 
        await Order.deleteOne({ _id: id }); 
        res.status(200).json({ success: true, data: {} });
      } catch (error: any) { res.status(400).json({ success: false }); }
      break;

    default: res.status(400).json({ success: false }); break;
  }
}