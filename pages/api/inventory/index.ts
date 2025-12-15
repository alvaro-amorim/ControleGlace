import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db/mongoose';
import Inventory from '../../../lib/db/models/Inventory';
import { appendToSheet, updateRowInSheet, deleteRowInSheet } from '../../../lib/googleSheets';

// --- FUNÇÃO AUXILIAR: Formata data para DD/MM/AAAA (Padrão BR) ---
const formatDateForSheet = (date: Date | string) => {
  if (!date) return '';
  const d = new Date(date);
  // Garante que o dia/mês tenha 2 dígitos
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  await dbConnect();
  const body: any = req.body;

  switch (method) {
    // --- LISTAR ITENS ---
    case 'GET':
      try {
        // Ordena por categoria e depois por nome
        const items = await Inventory.find({}).sort({ category: 1, name: 1 });
        res.status(200).json({ success: true, data: items });
      } catch (error) { 
        res.status(400).json({ success: false }); 
      }
      break;

    // --- CRIAR NOVO ITEM ---
    case 'POST':
      try {
        const { _id, ...newItem } = body;
        
        // Define Data de Movimento Inicial como AGORA
        newItem.lastMovementDate = new Date();

        // 1. Salva no Banco de Dados (MongoDB)
        const item: any = await Inventory.create(newItem);
        
        // 2. Prepara a Linha da Planilha (Colunas A até K)
        // K = Última Movimentação
        const sheetRow = [
          item._id.toString(), // A: ID
          item.sku,            // B: SKU
          item.name,           // C: Nome
          item.quantity,       // D: Qtd
          item.unit,           // E: Unidade
          item.minQuantity,    // F: Mínimo
          item.category,       // G: Categoria
          item.costPrice,      // H: Custo
          item.supplier,       // I: Fornecedor
          item.observation,    // J: Obs
          formatDateForSheet(item.lastMovementDate) // K: Data
        ];
        
        // 3. Envia para o Google Sheets
        try {
            await appendToSheet('Estoque!A:K', sheetRow);
        } catch (sheetError) {
            console.error("⚠️ Erro ao salvar na Planilha:", sheetError);
        }

        res.status(201).json({ success: true, data: item });
      } catch (error: any) { 
        res.status(400).json({ success: false, error: error.message }); 
      }
      break;

    // --- ATUALIZAR ITEM (Entrada/Saída/Edição) ---
    case 'PUT':
      try {
        const { _id, ...updateData } = body;
        
        // IMPORTANTE: Atualiza a data de movimento para AGORA
        updateData.lastMovementDate = new Date();

        // 1. Atualiza no Banco
        const item: any = await Inventory.findByIdAndUpdate(_id, updateData, { new: true });
        
        if (item) {
          // 2. Prepara dados atualizados para a planilha
          const sheetRow = [
             item._id.toString(),
             item.sku,
             item.name,
             item.quantity,
             item.unit,
             item.minQuantity,
             item.category,
             item.costPrice,
             item.supplier,
             item.observation,
             formatDateForSheet(item.lastMovementDate)
          ];

          // 3. Atualiza a linha correspondente no Google Sheets
          try {
            await updateRowInSheet('Estoque', item._id.toString(), sheetRow);
          } catch (sheetError) {
             console.error("⚠️ Erro ao atualizar Planilha:", sheetError);
          }
        }
        res.status(200).json({ success: true, data: item });
      } catch (error: any) { 
        res.status(400).json({ success: false }); 
      }
      break;

    // --- EXCLUIR ITEM ---
    case 'DELETE':
      try {
        const { id } = req.query;
        
        // 1. Tenta apagar da planilha primeiro (pelo ID)
        try {
            await deleteRowInSheet('Estoque', id as string);
        } catch (e) { 
            console.error("⚠️ Erro ao apagar da planilha:", e); 
        }

        // 2. Apaga do Banco
        await Inventory.deleteOne({ _id: id });
        res.status(200).json({ success: true, data: {} });
      } catch (error: any) { 
        res.status(400).json({ success: false }); 
      }
      break;

    default: 
        res.status(405).end(); 
        break;
  }
}