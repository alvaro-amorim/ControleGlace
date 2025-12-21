import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db/mongoose';
import Inventory from '../../../lib/db/models/Inventory';
import { appendToSheet, updateRowInSheet, deleteRowInSheet } from '../../../lib/googleSheets';

// --- CORREÇÃO 1: Formatação com Fuso Horário de MG ---
const formatDate = (date: any) => {
    if (!date) return '-';
    const d = new Date(date);
    // Garante que mostre a data certa no Brasil (evita cair no dia anterior)
    return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  await dbConnect();
  const body: any = req.body;

  switch (method) {
    // --- LISTAR ITENS ---
    case 'GET':
      try {
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
        
        // --- CORREÇÃO 2: Ajuste de Horário (Juiz de Fora UTC-3) ---
        const now = new Date();
        now.setHours(now.getHours() - 3); // Subtrai 3h para bater com o relógio daí
        newItem.lastMovementDate = now;

        // 1. Salva no Banco de Dados
        const item: any = await Inventory.create(newItem);
        
        // 2. Prepara a Linha da Planilha (Agora vai até L: Validade)
        const sheetRow = [
          item._id.toString(),            // A: ID
          item.sku,                       // B: SKU
          item.name,                      // C: Nome
          item.quantity,                  // D: Qtd
          item.unit,                      // E: Unidade
          item.minQuantity,               // F: Mínimo
          item.category,                  // G: Categoria
          item.costPrice,                 // H: Custo
          item.supplier,                  // I: Fornecedor
          item.observation,               // J: Obs
          formatDate(item.lastMovementDate), // K: Última Movimentação (Corrigida)
          formatDate(item.validity)       // L: Validade (NOVO CAMPO)
        ];
        
        // 3. Envia para o Google Sheets
        try {
            // Aumentamos o range para pegar a coluna L
            await appendToSheet('Estoque!A:L', sheetRow);
        } catch (sheetError) {
            console.error("⚠️ Erro ao salvar na Planilha:", sheetError);
        }

        res.status(201).json({ success: true, data: item });
      } catch (error: any) { 
        res.status(400).json({ success: false, error: error.message }); 
      }
      break;

    // --- ATUALIZAR ITEM ---
    case 'PUT':
      try {
        const { _id, ...updateData } = body;
        
        // Atualiza a data de movimento para AGORA (com fuso de MG)
        const now = new Date();
        now.setHours(now.getHours() - 3);
        updateData.lastMovementDate = now;

        // 1. Atualiza no Banco
        const item: any = await Inventory.findByIdAndUpdate(_id, updateData, { new: true });
        
        if (item) {
          // 2. Prepara dados atualizados
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
             formatDate(item.lastMovementDate),
             formatDate(item.validity) // Atualiza Validade na Planilha
          ];

          // 3. Atualiza a linha no Sheets
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
        try { await deleteRowInSheet('Estoque', id as string); } catch (e) { console.error(e); }
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