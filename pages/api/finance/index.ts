import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db/mongoose';
import Transaction from '../../../lib/db/models/Transaction';
import { appendToSheet, deleteRowInSheet, updateRowInSheet } from '../../../lib/googleSheets';

// Formata data YYYY-MM-DD para DD/MM/YYYY (Planilha)
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
        const transactions = await Transaction.find({}).sort({ date: -1 });
        res.status(200).json({ success: true, data: transactions });
      } catch (error) { res.status(400).json({ success: false }); }
      break;

    case 'POST':
      try {
        const { _id, ...newTrans } = body;
        
        // --- CORREÇÃO DA DATA (Fuso Brasil) ---
        // Se não vier data do front, cria data de hoje no fuso BR
        if (!newTrans.date) {
            newTrans.date = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
        }

        const transaction: any = await Transaction.create(newTrans);

        // Se tiver imagem, escreve aviso na planilha
        const docStatus = transaction.attachment ? '[Comprovante Anexado]' : '';

        // Prepara linha para a Planilha (Colunas A até M)
        const sheetRow = [
          transaction._id.toString(),
          formatDateForSheet(transaction.date),
          transaction.type,
          transaction.category,
          transaction.description,
          transaction.amount,
          transaction.paymentMethod,
          transaction.costCenter,
          transaction.payee,
          transaction.status,
          transaction.observation || '',
          formatDateForSheet(transaction.dueDate) || '',
          docStatus // M: Documento
        ];

        await appendToSheet('Financeiro!A:M', sheetRow);
        res.status(201).json({ success: true, data: transaction });
      } catch (error: any) { 
        console.error("Erro Financeiro POST:", error);
        res.status(400).json({ success: false, error: error.message }); 
      }
      break;

    case 'PUT':
      try {
        const { _id, ...updateData } = body;
        const transaction: any = await Transaction.findByIdAndUpdate(_id, updateData, { new: true });

        if (transaction) {
          const docStatus = transaction.attachment ? '[Comprovante Anexado]' : '';

          const sheetRow = [
            transaction._id.toString(),
            formatDateForSheet(transaction.date),
            transaction.type,
            transaction.category,
            transaction.description,
            transaction.amount,
            transaction.paymentMethod,
            transaction.costCenter,
            transaction.payee,
            transaction.status,
            transaction.observation || '',
            formatDateForSheet(transaction.dueDate) || '',
            docStatus
          ];

          await updateRowInSheet('Financeiro', transaction._id.toString(), sheetRow);
        }
        res.status(200).json({ success: true, data: transaction });
      } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
      break;

    case 'DELETE':
      try {
        const { id } = req.query;
        await deleteRowInSheet('Financeiro', id as string);
        await Transaction.deleteOne({ _id: id });
        res.status(200).json({ success: true, data: {} });
      } catch (error: any) { res.status(400).json({ success: false }); }
      break;

    default: res.status(400).json({ success: false }); break;
  }
}

// --- CONFIGURAÇÃO EXTRA (Aumentar limite de Upload) ---
// Isso permite enviar imagens maiores sem dar Erro 400
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', 
    },
  },
};