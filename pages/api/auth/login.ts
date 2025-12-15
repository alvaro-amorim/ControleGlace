import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db/mongoose';
import User from '../../../lib/db/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;

  try {
    await dbConnect();
    
    // Busca usuário pelo email e senha
    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou senha incorretos' });
    }

    // Sucesso! Retorna um "token" falso (para simplificar) e os dados do usuário
    res.status(200).json({ 
        success: true, 
        token: 'token-de-acesso-simples-' + user._id,
        user: { name: user.name, email: user.email }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
}