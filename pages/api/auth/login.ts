import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/db/mongoose';
import User from '../../../lib/db/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    await dbConnect();
    const { email, password } = req.body;

    // 1. Busca o usuário pelo email
    // O select('+passwordHash') é necessário se em algum momento ocultarmos esse campo por padrão
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    // 2. Compara a senha enviada com o hash no banco
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    // 3. Gera o Token JWT (O "Crachá" digital)
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET não definido no .env.local');

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      secret,
      { expiresIn: '1d' } // Expira em 1 dia
    );

    // 4. Retorna o token e dados básicos do usuário
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao fazer login', error: error.message });
  }
}