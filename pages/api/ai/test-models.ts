import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const key = process.env.GOOGLE_GEMINI_KEY;
  
  if (!key) return res.status(500).json({ error: "Sem chave API configurada no .env.local" });

  try {
    // Pergunta direto pra API do Google quais modelos você tem acesso
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || "Erro de conexão com Google");
    }

    // Filtra só os que geram texto
    const modelosDisponiveis = data.models
        ?.filter((m: any) => m.supportedGenerationMethods.includes("generateContent"))
        .map((m: any) => m.name) || [];

    res.status(200).json({ 
        success: true, 
        mensagem: "Lista de modelos recuperada!",
        modelos: modelosDisponiveis 
    });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}