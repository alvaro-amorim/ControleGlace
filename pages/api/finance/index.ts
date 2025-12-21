import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db/mongoose';
import Transaction from '../../../lib/db/models/Transaction';
import { appendToSheet, deleteRowInSheet } from '../../../lib/googleSheets';

// --- CORREÇÃO 1: Formatação com Fuso Horário de MG ---
// Isso garante que na planilha a data apareça certa (ex: 21/12/2025) e não a do dia seguinte
const formatDate = (date: any) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const transactions = await Transaction.find({}).sort({ date: -1 });
        res.status(200).json({ success: true, data: transactions });
      } catch (error) { res.status(400).json({ success: false }); }
      break;

    case 'POST':
      try {
        // --- CORREÇÃO 2: Ajuste de Horário para Juiz de Fora ---
        // Clona os dados recebidos para podermos modificar
        const transactionData = { ...req.body };

        // Se não veio uma data (lançamento automático) OU para garantir o horário:
        // Se a data vier do front, usamos ela. Se não, pegamos "agora".
        // O truque: Subtraímos 3 horas do horário do servidor (UTC) para bater com MG.
        if (!transactionData.date) {
            const now = new Date();
            now.setHours(now.getHours() - 3); // Força UTC-3 (Horário de Brasília)
            transactionData.date = now;
        }

        // 1. Salva no MongoDB com a data ajustada
        const transaction = await Transaction.create(transactionData);

        // 2. Prepara dados para a Planilha "Financeiro"
        const sheetRow = [
            transaction._id.toString(),      // A: ID
            formatDate(transaction.date),    // B: Data (Com fuso corrigido)
            transaction.type,                // C: Tipo
            transaction.category,            // D: Categoria
            transaction.description,         // E: Descrição
            transaction.amount,              // F: Valor
            transaction.paymentMethod || '-',// G: Meio Pagamento
            transaction.costCenter || '-',   // H: Centro Custo
            transaction.beneficiary || '-',  // I: Beneficiário
            transaction.status,              // J: Status
            transaction.observation || '-',  // K: Observações
            formatDate(transaction.paymentDate), // L: Data Pagamento
            transaction.receiptImage ? 'Com Imagem (Ver App)' : 'Sem Foto' // M: Foto
        ];

        // 3. Envia para o Google Sheets
        try {
            await appendToSheet('Financeiro!A:M', sheetRow);
        } catch (sheetError) {
            console.error("⚠️ Erro ao salvar na planilha Financeiro:", sheetError);
        }

        res.status(201).json({ success: true, data: transaction });

      } catch (error: any) { 
        console.error("❌ ERRO NO POST FINANCEIRO:", error.message);
        res.status(400).json({ success: false, error: error.message }); 
      }
      break;
      
    case 'DELETE':
      try {
         const { id } = req.query;
         try {
            await deleteRowInSheet('Financeiro', id as string);
         } catch (e) { console.error("Erro planilha delete:", e); }

         await Transaction.deleteOne({ _id: id });
         res.status(200).json({ success: true, data: {} });
      } catch (error) { res.status(400).json({ success: false }); }
      break;

    default:
      res.status(400).json({ success: false });
      break;
  }
}