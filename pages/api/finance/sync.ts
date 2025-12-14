import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db/mongoose';
import Transaction from '../../../lib/db/models/Transaction';
import { readSheetData } from '../../../lib/googleSheets';

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
    // Lê até a coluna L
    const rows = await readSheetData('Financeiro!A2:L');
    const idsNaPlanilha: string[] = [];
    let updatedCount = 0;

    if (rows && rows.length > 0) {
      for (const row of rows) {
        // Agora temos 'due' (vencimento) no final
        const [id, date, type, cat, desc, val, method, center, payee, status, obs, due] = row;

        if (!id) continue;
        idsNaPlanilha.push(id);

        await Transaction.findByIdAndUpdate(
          id,
          {
            date: parseDateFromSheet(date) || new Date().toISOString().split('T')[0],
            type: type?.toLowerCase() || 'saida',
            category: cat || 'Geral',
            description: desc || 'Sem descrição',
            amount: Number(val) || 0,
            paymentMethod: method || 'Dinheiro',
            costCenter: center || 'Variável',
            payee: payee || '',
            status: status || 'Pendente',
            observation: obs || '',
            dueDate: parseDateFromSheet(due) || '' // <--- Sincroniza Vencimento
          },
          { upsert: true, new: true }
        );
        updatedCount++;
      }
    }

    if (idsNaPlanilha.length > 0) {
      await Transaction.deleteMany({ _id: { $nin: idsNaPlanilha } });
    }

    res.status(200).json({ success: true, message: `Sync OK: ${updatedCount} atualizados.` });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}