import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db/mongoose';
import User from '../../../lib/db/models/User';
import { serialize } from 'cookie'; // Vamos usar o cookie nativo

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;

  try {
    await dbConnect();
    
    // Busca usuário (Lembre-se: estamos usando senhas simples por enquanto)
    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou senha incorretos' });
    }

    const token = 'token-secreto-glace-' + user._id;

    // --- MÁGICA DOS COOKIES 🍪 ---
    // Cria um cookie que dura 7 dias
    const cookie = serialize('glace_token', token, {
      httpOnly: false, // Deixamos false para o JS poder ler se precisar, mas true é mais seguro
      secure: process.env.NODE_ENV === 'production', // Só https em produção
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/', // Vale para o site todo
    });

    res.setHeader('Set-Cookie', cookie);
    // -----------------------------

    res.status(200).json({ 
        success: true, 
        token: token,
        user: { name: user.name, email: user.email }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
}