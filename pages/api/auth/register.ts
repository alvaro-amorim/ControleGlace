import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db/mongoose';
import User from '../../../lib/db/models/User';

const MASTER_CODE = '104298'; // 🔒 Sua senha geral

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, password, securityCode } = req.body;

  // 1. Verifica o Código Mestre
  if (securityCode !== MASTER_CODE) {
      return res.status(403).json({ success: false, message: '⛔ Código de Segurança (Master) incorreto!' });
  }

  if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Preencha todos os campos.' });
  }

  try {
    await dbConnect();

    // 2. Verifica se email já existe
    const existing = await User.findOne({ email });
    if (existing) {
        return res.status(400).json({ success: false, message: 'Este email já possui cadastro.' });
    }

    // 3. Cria o usuário
    // Nota: Para facilitar seu acesso hoje, estamos salvando a senha simples.
    // Futuramente, podemos ativar a criptografia (bcrypt) aqui.
    await User.create({
        name,
        email,
        password
    });

    res.status(201).json({ success: true, message: '✅ Usuário criado com sucesso!' });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}