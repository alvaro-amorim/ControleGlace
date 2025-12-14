import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db/mongoose';
import Inventory from '../../../lib/db/models/Inventory';
import { readSheetData } from '../../../lib/googleSheets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  console.log("🔄 INICIANDO SINCRONIZAÇÃO (PLANILHA -> APP)...");

  await dbConnect();

  try {
    // 1. Lê tudo da planilha (pulando a linha 1 do cabeçalho)
    const rows = await readSheetData('Estoque!A2:E');

    console.log(`📊 Linhas encontradas na planilha: ${rows ? rows.length : 0}`);

    if (!rows || rows.length === 0) {
      console.log("⚠️ A planilha parece vazia ou não consegui ler.");
      return res.status(200).json({ success: true, message: 'Nada para sincronizar (Planilha vazia ou ilegível).' });
    }

    let updatedCount = 0;

    // 2. Para cada linha, atualiza o banco
    for (const row of rows) {
      // row[0]=SKU, row[1]=Nome, row[2]=Qtd, row[3]=Unidade, row[4]=Minimo
      const [sku, name, quantity, unit, minQuantity] = row;

      // Se não tiver SKU, ignora
      if (!sku) continue; 

      console.log(`   > Processando: ${sku} - ${name} (Qtd: ${quantity})`);

      // Tenta converter quantidade para número, se falhar vira 0
      const qtdNumber = Number(quantity); 
      const minNumber = Number(minQuantity);

      await Inventory.findOneAndUpdate(
        { sku: sku }, // Busca pelo SKU
        {
          sku: sku, // Garante que o SKU está lá
          name: name,
          quantity: isNaN(qtdNumber) ? 0 : qtdNumber,
          unit: unit || 'un',
          minQuantity: isNaN(minNumber) ? 5 : minNumber,
        },
        { upsert: true, new: true } // Upsert: Cria se não existir
      );
      updatedCount++;
    }

    console.log(`✅ Sincronização Finalizada! ${updatedCount} itens atualizados.`);
    
    res.status(200).json({ 
      success: true, 
      message: `Sucesso! ${updatedCount} itens atualizados da planilha para o App.` 
    });

  } catch (error: any) {
    console.error("❌ ERRO GRAVE NA SINCRONIZAÇÃO:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}