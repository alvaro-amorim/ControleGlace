import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto'; // Para gerar a assinatura dos dados
import dbConnect from '../../../lib/db/mongoose';
import Transaction from '../../../lib/db/models/Transaction';
import Inventory from '../../../lib/db/models/Inventory';
import Order from '../../../lib/db/models/Order';
import Insight from '../../../lib/db/models/Insight'; // O banco de memória que criamos

const apiKey = process.env.GOOGLE_GEMINI_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

// --- MODO DE SEGURANÇA (FALLBACK) ---
function generateRuleBasedInsight(balance: number, pendingCount: number, revenueForecast: number, lowStockNames: string[]) {
    const statusCaixa = balance >= 0 ? "O caixa está positivo! 🟢" : "Atenção! Caixa negativo 🔴";
    const statusEstoque = lowStockNames.length > 0 
        ? `Precisamos repor: ${lowStockNames.join(', ')}.` 
        : "Estoque sob controle.";

    return `
### 🛡️ Modo de Segurança (Regras Matemáticas)

1. **💰 Análise Financeira:**
   ${statusCaixa} O saldo atual é de **R$ ${balance.toFixed(2)}**.

2. **🍰 Produção:**
   Temos **${pendingCount} encomendas** na fila. Valor a receber: **R$ ${revenueForecast.toFixed(2)}**.

3. **📦 Estoque:**
   ${statusEstoque}
    `;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  await dbConnect();

  try {
    // --- 1. COLETA DE DADOS ---
    const allTransactions = await Transaction.find({});
    // Calcula saldo (Receita - Despesa)
    const totalBalance = allTransactions.reduce((acc: number, t: any) => {
        return t.type === 'Receita' ? acc + t.amount : acc - t.amount;
    }, 0);

    // Pega as 5 últimas receitas para contexto
    const recentTransactions = await Transaction.find({ type: 'Receita' }).sort({ date: -1 }).limit(5);
    const incomeList = recentTransactions
      .map((t: any) => `R$${t.amount} (${t.description})`)
      .join(', ');

    const lowStock = await Inventory.find({ $expr: { $lte: ["$quantity", "$minQuantity"] } });
    const lowStockNames = lowStock.map((i: any) => i.name);

    const pendingOrders = await Order.find({ status: { $in: ['Pendente', 'Em Produção'] } });
    const revenueForecast = pendingOrders.reduce((acc: number, o: any) => acc + o.totalValue, 0);

    // --- 2. GERAÇÃO DA ASSINATURA (HASH) ---
    // Cria um "DNA" dos dados atuais. Se nada mudar, o DNA é o mesmo.
    const dataSignature = JSON.stringify({
        balance: totalBalance.toFixed(2),
        lastTransId: recentTransactions[0]?._id || 'none', 
        pendingCount: pendingOrders.length,
        lowStockCount: lowStock.length
    });
    
    // Cria hash MD5 simples
    const currentHash = crypto.createHash('md5').update(dataSignature).digest('hex');
    const today = new Date().toISOString().split('T')[0]; // Data de hoje (YYYY-MM-DD)

    // --- 3. VERIFICAÇÃO DE MEMÓRIA (ECONOMIA MÁXIMA) 🧠 ---
    // Tenta achar um insight já gerado HOJE
    let savedInsight = null;
    try {
        savedInsight = await Insight.findOne({ date: today });
    } catch (e) {
        console.log("Aviso: Tabela Insight ainda não criada ou erro de banco. Seguindo...");
    }

    // SE já existe um texto de hoje E os dados são IDÊNTICOS (mesmo Hash)
    if (savedInsight && savedInsight.hash === currentHash) {
        console.log("⚡ Usando Memória (Sem custo API) 🤑");
        // Retorna o texto salvo sem chamar o Google
        return res.status(200).json({ success: true, insight: savedInsight.content, isFallback: false });
    }

    // --- 4. SE DADOS MUDARAM OU É NOVO DIA -> CHAMA GEMINI ---
    try {
        if (!apiKey) throw new Error("Sem chave API");

        const prompt = `
          Você é o gerente da "Glacê Confeitaria". Responda em Português.
          Use emojis. Seja direto e curto (máximo 3 parágrafos).
          
          DADOS ATUAIS DA CONFEITARIA:
          - Saldo em Caixa: R$ ${totalBalance.toFixed(2)}
          - Entradas Recentes: ${incomeList || "Nenhuma"}
          - Fila de Produção: ${pendingOrders.length} pedidos pendentes
          - Receita Futura (Encomendas): R$ ${revenueForecast.toFixed(2)}
          - Estoque Crítico: ${lowStockNames.join(', ') || "Tudo ok"}
          
          Crie um resumo executivo com 3 tópicos:
          1. 💰 Finanças (Analise o saldo)
          2. 🍰 Produção (Dê um alerta sobre a fila)
          3. 📦 Estoque (Avise o que comprar)
        `;
        
        // VOLTAMOS PARA O GEMINI-PRO (Estável e Gratuito)
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // --- 5. SALVA NA MEMÓRIA ---
        // Guarda o texto novo no banco para não precisar gerar de novo hoje (a menos que os dados mudem)
        try {
            await Insight.findOneAndUpdate(
                { date: today },
                { content: text, hash: currentHash, generatedAt: new Date() },
                { upsert: true, new: true }
            );
        } catch (e) {
            console.log("Erro ao salvar memória, mas a IA funcionou.");
        }

        console.log("✨ Novo Insight Gerado pela IA!");
        return res.status(200).json({ success: true, insight: text, isFallback: false });

    } catch (aiError) {
        console.error("⚠️ Falha na IA, ativando Fallback:", aiError);
        // Se a IA falhar, usamos o modo matemático
        const fallbackText = generateRuleBasedInsight(totalBalance, pendingOrders.length, revenueForecast, lowStockNames);
        return res.status(200).json({ success: true, insight: fallbackText, isFallback: true });
    }

  } catch (dbError) {
    console.error("Erro Crítico DB:", dbError);
    // Mesmo com erro de banco, tenta responder algo útil
    res.status(200).json({ success: true, insight: "Erro de conexão. Verifique o banco de dados.", isFallback: true });
  }
}