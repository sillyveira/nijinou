#!/usr/bin/env node

/**
 * Script para criar um usuário de teste
 * Uso: node scripts/create-user.js username password [role]
 * Exemplo: node scripts/create-user.js testuser password123 user
 */

const mongodb = require('mongodb');
const bcrypt = require('bcryptjs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function createUser() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Uso: node scripts/create-user.js username password [role]');
    console.log('Exemplo: node scripts/create-user.js testuser password123 user');
    process.exit(1);
  }

  const [username, password, role = 'user'] = args;

  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nijinou';
    const client = new mongodb.MongoClient(uri);

    await client.connect();
    const db = client.db('nijinou');
    const usersCollection = db.collection('users');

    // Verificar se usuário já existe
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      console.error('❌ Usuário já existe!');
      await client.close();
      process.exit(1);
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Criar usuário
    const result = await usersCollection.insertOne({
      username,
      password: hashedPassword,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ Usuário criado com sucesso!');
    console.log(`   ID: ${result.insertedId}`);
    console.log(`   Username: ${username}`);
    console.log(`   Role: ${role}`);

    await client.close();
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    process.exit(1);
  }
}

createUser();
