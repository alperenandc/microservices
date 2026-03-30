class GatewayHeaderFactory {
  constructor(internalGatewayKey) {
    this.internalGatewayKey = internalGatewayKey;
  }

  create(token) {
    return {
      "x-internal-gateway-key": this.internalGatewayKey,
      ...(token ? { authorization: token } : {}),
    };
  }
}

module.exports = { GatewayHeaderFactory };
