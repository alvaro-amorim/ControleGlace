import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import dbConnect from '../../../lib/db/mongoose';
import User from '../../../lib/db/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Apenas aceita método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // 2. Conecta ao banco
    await dbConnect();

    const { name, email, password } = req.body;

    // 3. Validação básica
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Preencha todos os campos.' });
    }

    // 4. Verifica se usuário já existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Este e-mail já está cadastrado.' });
    }

    // 5. Criptografa a senha (Hash)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 6. Cria o usuário (se for o primeiro do sistema, poderia ser admin, mas vamos fixar staff por enquanto)
    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role: 'staff', // Padrão
    });

    res.status(201).json({ message: 'Usuário criado com sucesso!', userId: newUser._id });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao registrar usuário', error: error.message });
  }
}