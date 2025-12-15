import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db/mongoose';
import Order from '../../../lib/db/models/Order';
import { getSheetData } from '../../../lib/googleSheets';

// Helper para converter string de data PT-BR em objeto Date
const parseDateStr = (str: string) => {
    if (!str) return new Date();
    try {
        const [datePart, timePart] = str.split(' ');
        const [day, month, year] = datePart.split('/');
        const [hour, minute] = timePart ? timePart.split(':') : ['00', '00'];
        return new Date(Number(year), Number(month)-1, Number(day), Number(hour), Number(minute));
    } catch { return new Date(); }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    await dbConnect();
    const sheetRows = await getSheetData('Pedidos!A:K'); 
    await Order.deleteMany({}); 

    const newOrders = sheetRows.slice(1).map(row => { 
        if (!row[0]) return null;
        
        return {
            _id: row[0].length > 10 ? row[0] : undefined,
            orderDate: parseDateStr(row[1]),     // B: Data Pedido
            deliveryDate: parseDateStr(row[2]),  // C: Data Entrega
            customerName: row[3] || 'Sem Nome',
            description: row[4] || '',
            totalValue: Number(row[5]) || 0,
            paymentStatus: row[6] || 'Pendente',
            status: row[7] || 'Pendente',
            deliveryMethod: row[8] || 'Retirada',
            contact: row[9] || '', 
            observation: row[10] || ''
        };
    }).filter(Boolean);

    if (newOrders.length > 0) await Order.insertMany(newOrders);
    res.status(200).json({ success: true, count: newOrders.length });

  } catch (error: any) {
    console.error("Erro Sync Pedidos:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}