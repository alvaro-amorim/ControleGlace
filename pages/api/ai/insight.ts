import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dbConnect from '../../../lib/db/mongoose';
import Transaction from '../../../lib/db/models/Transaction';
import Inventory from '../../../lib/db/models/Inventory';
import Order from '../../../lib/db/models/Order';

const apiKey = process.env.GOOGLE_GEMINI_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  if (!apiKey) {
    return res.status(200).json({ success: true, insight: "⚠️ Configure a API Key no arquivo .env.local" });
  }

  try {
    await dbConnect();

    // --- 1. COLETA DE DADOS DO SEU SISTEMA ---
    
    // Financeiro (Últimos 15 lançamentos para entender o fluxo)
    const transactions = await Transaction.find().sort({ date: -1 }).limit(15);
    const balance = transactions.reduce((acc, t) => t.type === 'entrada' ? acc + t.amount : acc - t.amount, 0);
    
    // Lista descritiva de entradas (para a IA auditar)
    const incomeList = transactions
      .filter(t => t.type === 'entrada')
      .map(t => `R$${t.amount} (${t.description})`)
      .join(', ');

    // Estoque Crítico (Itens acabando)
    const lowStock = await Inventory.find({ $expr: { $lte: ["$quantity", "$minQuantity"] } });
    
    // Pedidos Pagos Recentemente (Para cruzar com financeiro)
    const paidOrders = await Order.find({ 
      paymentStatus: { $in: ['Pago Integral', 'Sinal 50% Pago'] } 
    }).sort({ deliveryDate: -1 }).limit(10);

    // Pedidos na Fila de Produção
    const pendingOrders = await Order.find({ status: { $in: ['pendente', 'producao'] } });
    const revenueForecast = pendingOrders.reduce((acc, o) => acc + o.totalValue, 0);

    const paidOrdersList = paidOrders
      .map(o => `Cliente ${o.customerName}: R$${o.totalValue} (${o.paymentStatus})`)
      .join('; ');

    // --- 2. O COMANDO PARA A IA (PROMPT) ---
    const prompt = `
      Você é o gerente inteligente da "Glacê Confeitaria". Analise os dados do sistema agora:

      📊 DADOS FINANCEIROS:
      - Saldo Atual Calculado: R$ ${balance.toFixed(2)}
      - Últimas Entradas no Caixa: ${incomeList || "Nenhuma entrada recente."}

      🍰 DADOS DE PEDIDOS:
      - Pedidos marcados como PAGOS: ${paidOrdersList || "Nenhum."}
      - Fila de Produção: ${pendingOrders.length} encomendas (Previsão de receita: R$ ${revenueForecast.toFixed(2)})

      📦 DADOS DE ESTOQUE:
      - Itens Críticos/Acabando: ${lowStock.map(i => i.name).join(', ') || "Estoque está saudável."}

      Sua Missão (Responda em 3 parágrafos curtos com emojis):
      1. 💰 Análise Financeira: Comente sobre o saldo e a saúde do caixa.
      2. 🕵️ Auditoria de Segurança: Verifique se os nomes em "PEDIDOS PAGOS" têm um valor correspondente nas "ENTRADAS NO CAIXA". Se alguém marcou como pago mas o dinheiro não entrou, dê um ALERTA VERMELHO.
      3. 👩‍🍳 Dica Operacional: Dê uma sugestão baseada nos itens que estão acabando ou na fila de produção.
    `;

    // --- 3. CONFIGURAÇÃO DO MODELO (AQUI ESTAVA O SEGREDO) ---
    // Usando o modelo que sua chave confirmou que tem acesso
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ success: true, insight: text });

  } catch (error: any) {
    console.error("Erro AI:", error);
    res.status(200).json({ 
        success: true, 
        insight: "A IA está dormindo um pouco. Tente atualizar a página em alguns instantes." 
    });
  }
}
