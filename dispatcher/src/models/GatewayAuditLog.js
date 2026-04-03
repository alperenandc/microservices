const mongoose = require("mongoose");

const gatewayAuditLogSchema = new mongoose.Schema(
  {
    method: { type: String, required: true },
    path: { type: String, required: true },
    statusCode: { type: Number, required: true },
    durationMs: { type: Number, required: true },
    targetService: { type: String, required: true },
    requestId: { type: String, required: true },
  },
  { timestamps: true }
);

gatewayAuditLogSchema.index({ createdAt: -1 });
gatewayAuditLogSchema.index({ targetService: 1, createdAt: -1 });

const GatewayAuditLog = mongoose.model("GatewayAuditLog", gatewayAuditLogSchema);

module.exports = { GatewayAuditLog };
