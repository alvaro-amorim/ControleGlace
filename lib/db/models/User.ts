import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Em produção real, usaríamos hash (bcrypt)
});

// Evita recriar o modelo se já existir
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;