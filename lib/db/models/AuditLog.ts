import mongoose, { Schema, model, models } from 'mongoose';

const AuditLogSchema = new Schema({
  entityType: { 
    type: String, 
    required: true, 
    enum: ['orders', 'inventory', 'user', 'sheets'] 
  },
  entityId: { type: Schema.Types.Mixed, required: true }, // Aceita ID do Mongo ou ID externo
  action: { 
    type: String, 
    required: true, 
    enum: ['create', 'update', 'delete', 'sync', 'login'] 
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User' }, // Pode ser null se for sistema
  userEmail: { type: String }, // Backup caso o user seja deletado
  timestamp: { type: Date, default: Date.now },
  diff: { type: Schema.Types.Mixed }, // Detalhes do que mudou { old: ..., new: ... }
  meta: { type: Schema.Types.Mixed }, // IP, notas extras
});

const AuditLog = models.AuditLog || model('AuditLog', AuditLogSchema);

export default AuditLog;