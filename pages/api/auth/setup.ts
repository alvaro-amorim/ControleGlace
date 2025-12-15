import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db/mongoose';
import User from '../../../lib/db/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Permitimos GET para você poder rodar direto pelo navegador
  try {
    await dbConnect();

    // Verifica se já existe o admin
    const existing = await User.findOne({ email: 'admin@glace.com' });
    if (existing) {
        return res.status(200).json({ message: '⚠️ O usuário Admin JÁ EXISTE! Tente logar com a senha 123.' });
    }

    // CRIA O ADMINISTRADOR NA FORÇA BRUTA
    const newUser = await User.create({
        name: 'Álvaro Amorim',
        email: 'admin@glace.com',
        password: '123'  // Senha simples para entrar hoje
    });

    res.status(201).json({ 
        success: true, 
        message: '✅ SUCESSO! Usuário criado. Agora vá para a tela de login.', 
        user: newUser 
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}