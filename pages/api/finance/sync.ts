import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db/mongoose';
import Transaction from '../../../lib/db/models/Transaction';
// AQUI ESTAVA O ERRO: mudamos de readSheetData para getSheetData
import { getSheetData } from '../../../lib/googleSheets'; 

// Helper para converter "DD/MM/AAAA" da planilha em Data Real
const parseDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  try {
      const [day, month, year] = dateStr.split('/');
      // Cria a data ignorando hora para evitar problemas de fuso no dashboard
      return new Date(`${year}-${month}-${day}T12:00:00.000Z`);
  } catch { return new Date(); }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    await dbConnect();

    // 1. Puxa dados da aba "Financeiro", colunas A até M
    const sheetRows = await getSheetData('Financeiro!A:M');

    // 2. Limpa o banco atual (A Planilha manda na Sincronia)
    await Transaction.deleteMany({});

    // 3. Mapeia as linhas (Ignorando a linha 0 que é o cabeçalho)
    const newTransactions = sheetRows.slice(1).map(row => {
        if (!row[0]) return null; // Se não tem ID, ignora

        return {
            _id: row[0].length > 10 ? row[0] : undefined,
            date: parseDate(row[1]),            // B: Data
            type: row[2] || 'Despesa',          // C: Tipo
            category: row[3] || 'Geral',        // D: Categoria
            description: row[4] || 'Sem Descrição', // E: Descrição
            amount: Number(row[5]) || 0,        // F: Valor
            paymentMethod: row[6] || 'Pix',     // G: Meio Pagamento
            costCenter: row[7] || 'Geral',      // H: Centro Custo
            beneficiary: row[8] || '',          // I: Beneficiário
            status: row[9] || 'Pago',           // J: Status
            observation: row[10] || '',         // K: Obs
            paymentDate: parseDate(row[11]),    // L: Data Pagamento
            receiptImage: '' // A imagem não volta da planilha (pesada demais), fica vazia no sync reverso
        };
    }).filter(Boolean);

    if (newTransactions.length > 0) {
        await Transaction.insertMany(newTransactions);
    }

    res.status(200).json({ success: true, count: newTransactions.length });

  } catch (error: any) {
    console.error("Erro Sync Financeiro:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}