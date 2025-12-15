import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db/mongoose';
import Transaction from '../../../lib/db/models/Transaction';
import { appendToSheet, deleteRowInSheet } from '../../../lib/googleSheets';

// Formata data para DD/MM/AAAA
const formatDate = (date: any) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
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
        // 1. Salva no MongoDB
        const transaction = await Transaction.create(req.body);

        // 2. Prepara dados para a Planilha "Financeiro"
        // Mapeando conforme sua imagem: 
        // A=ID, B=Data, C=Tipo, D=Categoria, E=Descrição, F=Valor, 
        // G=Meio Pagamento, H=Centro Custo, I=Beneficiario, J=Status, 
        // K=Observações, L=Pagamento, M=Foto
        const sheetRow = [
            transaction._id.toString(),      // A: ID
            formatDate(transaction.date),    // B: Data
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
            transaction.receiptImage ? 'Com Imagem (Ver App)' : 'Sem Foto' // M: Foto (Base64 é muito grande pra planilha)
        ];

        // 3. Envia para o Google Sheets (Aba "Financeiro")
        try {
            await appendToSheet('Financeiro!A:M', sheetRow);
        } catch (sheetError) {
            console.error("⚠️ Erro ao salvar na planilha Financeiro:", sheetError);
            // Não paramos o fluxo, pois já salvou no banco
        }

        res.status(201).json({ success: true, data: transaction });

      } catch (error: any) { 
        // LOG DO ERRO PARA VOCÊ VER NO TERMINAL
        console.error("❌ ERRO NO POST FINANCEIRO:", error.message);
        res.status(400).json({ success: false, error: error.message }); 
      }
      break;
      
    case 'DELETE':
      try {
         const { id } = req.query;
         
         // Tenta apagar da planilha primeiro
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