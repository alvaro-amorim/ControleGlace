import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db/mongoose';
import Order from '../../../lib/db/models/Order';
import { appendToSheet, updateRowInSheet, deleteRowInSheet } from '../../../lib/googleSheets';

const formatDate = (date: any) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const orders = await Order.find({}).sort({ deliveryDate: 1 });
        res.status(200).json({ success: true, data: orders });
      } catch (error) { res.status(400).json({ success: false }); }
      break;

    case 'POST':
      try {
        const order = await Order.create(req.body);

        // Mapeamento Planilha (A até K)
        const sheetRow = [
            order._id.toString(),      // A: ID
            formatDate(order.orderDate), // B: Data Pedido (NOVO)
            formatDate(order.deliveryDate), // C: Data Entrega
            order.customerName,        // D: Cliente
            order.description,         // E: Descrição
            order.totalValue,          // F: Valor
            order.paymentStatus,       // G: Pagamento
            order.status,              // H: Status
            order.deliveryMethod,      // I: Entrega
            `${order.contact || ''} ${order.address ? '- ' + order.address : ''}`, // J: Contato
            order.observation          // K: Obs
        ];

        try { await appendToSheet('Pedidos!A:K', sheetRow); } catch (e) { console.error("Erro Planilha:", e); }
        res.status(201).json({ success: true, data: order });
      } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
      break;

    case 'PUT':
      try {
        const { _id, ...updateData } = req.body;
        const order: any = await Order.findByIdAndUpdate(_id, updateData, { new: true });
        
        if (order) {
            const sheetRow = [
                order._id.toString(),
                formatDate(order.orderDate),
                formatDate(order.deliveryDate),
                order.customerName,
                order.description,
                order.totalValue,
                order.paymentStatus,
                order.status,
                order.deliveryMethod,
                `${order.contact || ''} ${order.address ? '- ' + order.address : ''}`,
                order.observation
            ];
            try { await updateRowInSheet('Pedidos', order._id.toString(), sheetRow); } catch (e) { console.error("Erro Planilha:", e); }
        }
        res.status(200).json({ success: true, data: order });
      } catch (error) { res.status(400).json({ success: false }); }
      break;
      
    case 'DELETE':
      try {
         const { id } = req.query;
         try { await deleteRowInSheet('Pedidos', id as string); } catch (e) { console.error("Erro Planilha:", e); }
         await Order.deleteOne({ _id: id });
         res.status(200).json({ success: true, data: {} });
      } catch (error) { res.status(400).json({ success: false }); }
      break;

    default: res.status(405).end(); break;
  }
}