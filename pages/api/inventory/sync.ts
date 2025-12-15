import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db/mongoose';
import Inventory from '../../../lib/db/models/Inventory';
import { getInventoryFromSheet } from '../../../lib/googleSheets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    await dbConnect();

    // 1. Busca dados da Planilha
    const sheetRows = await getInventoryFromSheet();

    // 2. Limpa o banco atual para evitar duplicatas
    await Inventory.deleteMany({});

    // 3. Converte linhas da planilha em Objetos do Banco
    const newItems = sheetRows.map(row => {
        // Mapeia Colunas A, B, C... para os campos do banco
        // Row[0]=ID, Row[1]=SKU, Row[2]=Nome, etc...
        return {
            _id: row[0] && row[0].length > 10 ? row[0] : undefined, // Mantém ID se válido
            sku: row[1] || 'SEM-COD',
            name: row[2] || 'Sem Nome',
            quantity: Number(row[3]) || 0,
            unit: row[4] || 'un',
            minQuantity: Number(row[5]) || 5,
            category: row[6] || 'Diversos',
            costPrice: Number(row[7]) || 0,
            supplier: row[8] || '',
            observation: row[9] || '',
            lastMovementDate: parseDate(row[10]) // Converte data BR para sistema
        };
    });

    // 4. Insere tudo de volta no Mongo
    if (newItems.length > 0) {
        await Inventory.insertMany(newItems);
    }

    res.status(200).json({ success: true, count: newItems.length });

  } catch (error: any) {
    console.error("Erro no Sync:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Helper para converter "25/12/2024" em Data do Javascript
function parseDate(dateStr: string) {
    if (!dateStr) return new Date();
    try {
        const [day, month, year] = dateStr.split('/');
        return new Date(`${year}-${month}-${day}`);
    } catch {
        return new Date();
    }
}