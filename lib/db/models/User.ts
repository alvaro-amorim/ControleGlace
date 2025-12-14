import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date },
});

// Se o modelo já existir (hot reload), usa o existente. Se não, cria um novo.
const User = models.User || model('User', UserSchema);

export default User;