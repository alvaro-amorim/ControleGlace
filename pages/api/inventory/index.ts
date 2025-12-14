import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db/mongoose';
import Inventory from '../../../lib/db/models/Inventory';
import { appendToSheet, updateRowInSheet, deleteRowInSheet } from '../../../lib/googleSheets';

// Formata para a planilha (DD/MM/AAAA)
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
        const items = await Inventory.find({}).sort({ name: 1 });
        res.status(200).json({ success: true, data: items });
      } catch (error) { res.status(400).json({ success: false }); }
      break;

    case 'POST':
      try {
        const { _id, ...newItem } = body;
        
        // Se não vier data, usa hoje
        if (!newItem.lastEntryDate) newItem.lastEntryDate = new Date().toISOString().split('T')[0];

        const item: any = await Inventory.create(newItem);
        
        // Mapeamento Planilha (A até K)
        const sheetRow = [
          item._id.toString(), item.sku, item.name, item.quantity, item.unit, item.minQuantity,
          item.category, item.costPrice, item.supplier, item.observation,
          formatDateForSheet(item.lastEntryDate) // K: Data Entrada
        ];
        
        await appendToSheet('Estoque!A:K', sheetRow);
        res.status(201).json({ success: true, data: item });
      } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
      break;

    case 'PUT':
      try {
        const { _id, ...updateData } = body;
        const item: any = await Inventory.findByIdAndUpdate(_id, updateData, { new: true });
        
        if (item) {
          const sheetRow = [
             item._id.toString(), item.sku, item.name, item.quantity, item.unit, item.minQuantity,
             item.category, item.costPrice, item.supplier, item.observation,
             formatDateForSheet(item.lastEntryDate) // K: Data Entrada
          ];
          await updateRowInSheet('Estoque', item._id.toString(), sheetRow);
        }
        res.status(200).json({ success: true, data: item });
      } catch (error: any) { res.status(400).json({ success: false }); }
      break;

    case 'DELETE':
      try {
        const { id } = req.query;
        await deleteRowInSheet('Estoque', id as string);
        await Inventory.deleteOne({ _id: id });
        res.status(200).json({ success: true, data: {} });
      } catch (error: any) { res.status(400).json({ success: false }); }
      break;

    default: res.status(400).json({ success: false }); break;
  }
}