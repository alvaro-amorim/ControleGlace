import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db/mongoose';
import Order from '../../../lib/db/models/Order';
import { readSheetData } from '../../../lib/googleSheets';

// Converte DD/MM/AAAA para YYYY-MM-DD
const parseDateFromSheet = (dateString: string) => {
  if (!dateString) return '';
  if (dateString.includes('-')) return dateString;
  const parts = dateString.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dateString;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  await dbConnect();

  try {
    // Lê A até J
    const rows = await readSheetData('Pedidos!A2:J');
    
    const idsNaPlanilha: string[] = [];
    let count = 0;

    if (rows && rows.length > 0) {
      for (const row of rows) {
        // Mapeamento A-J
        const [id, orderNum, client, items, val, date, status, delType, payStatus, obs] = row;

        if (!id) continue;
        idsNaPlanilha.push(id);

        await Order.findByIdAndUpdate(
          id,
          {
            orderNumber: orderNum || 'PED-???',
            customerName: client || 'Cliente',
            // Reconstrói item simples baseado no resumo
            items: [{ name: items || 'Item Importado', qty: 1, price: Number(val) || 0 }], 
            totalValue: Number(val) || 0,
            deliveryDate: parseDateFromSheet(date) || new Date().toISOString().split('T')[0],
            status: status?.toLowerCase() || 'pendente',
            deliveryType: delType || 'Retirada',
            paymentStatus: payStatus || 'Pendente',
            observation: obs || ''
          },
          { upsert: true, new: true }
        );
        count++;
      }
    }

    // Exclusão Reversa (Se apagou na planilha, apaga do site)
    if (idsNaPlanilha.length > 0) {
      await Order.deleteMany({ _id: { $nin: idsNaPlanilha } });
    }

    res.status(200).json({ success: true, message: `${count} pedidos sincronizados!` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}