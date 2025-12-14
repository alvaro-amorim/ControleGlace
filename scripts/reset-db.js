// scripts/reset-db.js
require('dotenv').config({ path: '.env.local' }); // Lê as variáveis do arquivo .env.local
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ ERRO: MONGODB_URI não encontrada. Verifique seu .env.local');
  process.exit(1);
}

async function nukeDatabase() {
  console.log('☢️  INICIANDO LIMPEZA TOTAL DO BANCO DE DADOS...');
  
  try {
    // 1. Conecta ao Banco
    await mongoose.connect(MONGODB_URI);
    console.log('🔌 Conectado ao MongoDB.');

    // 2. Lista todas as coleções (tabelas) que existem lá
    const collections = await mongoose.connection.db.collections();

    // 3. Varre cada coleção e apaga tudo
    for (let collection of collections) {
      const name = collection.collectionName;
      // Pula coleções de sistema do Mongo se houver
      if (name.startsWith('system.')) continue;

      await collection.deleteMany({}); // O comando mágico que apaga tudo
      console.log(`🗑️  Coleção [${name}] limpa.`);
    }

    console.log('✨ BANCO DE DADOS ESTÁ VAZIO E BRILHANDO!');

  } catch (error) {
    console.error('❌ Erro ao limpar:', error);
  } finally {
    // 4. Desconecta
    await mongoose.disconnect();
    console.log('👋 Desconectado.');
    process.exit(0);
  }
}

nukeDatabase();