import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/db/mongoose';
import User from '../../lib/db/models/User';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();

    // 1. Verifica se já existe algum usuário para não duplicar
    const userExists = await User.findOne({ email: 'admin@glace.com' });
    if (userExists) {
      return res.status(200).json({ message: 'O usuário Admin já existe!' });
    }

    // 2. Cria a senha criptografada
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt); // Senha inicial simples

    // 3. Cria o usuário Admin
    const newUser = await User.create({
      name: 'Dona da Glacê',
      email: 'admin@glace.com',
      passwordHash,
      role: 'admin',
    });

    return res.status(201).json({ 
      message: 'Admin criado com sucesso!', 
      user: newUser 
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}