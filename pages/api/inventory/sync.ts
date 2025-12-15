import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db/mongoose';
import Inventory from '../../../lib/db/models/Inventory';
// CORREÇÃO: Importamos a nova função genérica
import { getSheetData } from '../../../lib/googleSheets';

// Helper para converter "DD/MM/AAAA" da planilha em Data Real
const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    try {
        const [day, month, year] = dateStr.split('/');
        return new Date(`${year}-${month}-${day}T12:00:00.000Z`);
    } catch { return new Date(); }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    await dbConnect();

    // 1. CORREÇÃO: Chamamos a função passando o intervalo da aba "Estoque"
    const sheetRows = await getSheetData('Estoque!A:K');

    // 2. Limpa o banco atual
    await Inventory.deleteMany({});

    // 3. Mapeia as linhas (Pula o cabeçalho)
    const newItems = sheetRows.slice(1).map(row => {
        // Row[0]=ID, Row[1]=SKU, Row[2]=Nome, etc...
        if (!row[0]) return null;

        return {
            _id: row[0].length > 10 ? row[0] : undefined, // Mantém ID se válido
            sku: row[1] || 'SEM-COD',
            name: row[2] || 'Sem Nome',
            quantity: Number(row[3]) || 0,
            unit: row[4] || 'un',
            minQuantity: Number(row[5]) || 5,
            category: row[6] || 'Diversos',
            costPrice: Number(row[7]) || 0,
            supplier: row[8] || '',
            observation: row[9] || '',
            lastMovementDate: parseDate(row[10]) // Converte data BR
        };
    }).filter(Boolean);

    // 4. Insere tudo de volta no Mongo
    if (newItems.length > 0) {
        await Inventory.insertMany(newItems);
    }

    res.status(200).json({ success: true, count: newItems.length });

  } catch (error: any) {
    console.error("Erro no Sync Estoque:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}