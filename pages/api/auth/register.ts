import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db/mongoose';
import User from '../../../lib/db/models/User';

const MASTER_CODE = '104298'; // 🔒 Código de Segurança

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Libera o método POST. Se não for POST, devolve erro 405.
  if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ success: false, message: `Método ${req.method} não permitido` });
  }

  const { name, email, password, securityCode } = req.body;

  try {
    // 2. Verifica o Código Mestre
    if (securityCode !== MASTER_CODE) {
        return res.status(403).json({ success: false, message: '⛔ Código Mestre incorreto!' });
    }

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Preencha todos os campos.' });
    }

    await dbConnect();

    // 3. Verifica se email já existe
    const existing = await User.findOne({ email });
    if (existing) {
        return res.status(400).json({ success: false, message: 'Este email já possui cadastro.' });
    }

    // 4. Cria o usuário
    await User.create({
        name,
        email,
        password // Senha simples (texto) para garantir o acesso hoje
    });

    return res.status(201).json({ success: true, message: '✅ Usuário criado com sucesso!' });

  } catch (error: any) {
    console.error("Erro no Registro:", error);
    return res.status(500).json({ success: false, message: 'Erro interno no servidor', error: error.message });
  }
}