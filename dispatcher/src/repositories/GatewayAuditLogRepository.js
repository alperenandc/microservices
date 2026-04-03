class GatewayAuditLogRepository {
  constructor(gatewayAuditLogModel) {
    this.gatewayAuditLogModel = gatewayAuditLogModel;
  }

  async create(log) {
    return this.gatewayAuditLogModel.create(log);
  }

  async listRecent(limit = 100) {
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 100;

    return this.gatewayAuditLogModel
      .find({})
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .lean();
  }
}

module.exports = { GatewayAuditLogRepository };
