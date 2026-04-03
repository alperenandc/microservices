const { ServiceUnavailableError } = require("../errors");

class AuthService {
  constructor({ proxyClient, authServiceUrl, headerFactory }) {
    this.proxyClient = proxyClient;
    this.authServiceUrl = authServiceUrl;
    this.headerFactory = headerFactory;
  }

  async login(credentials) {
    return this.proxyClient.send({
      method: "post",
      url: `${this.authServiceUrl}/api/auth/login`,
      data: credentials,
      headers: this.headerFactory.create(),
    });
  }

  async validate(token) {
    try {
      const response = await this.proxyClient.send({
        method: "post",
        url: `${this.authServiceUrl}/api/auth/validate`,
        headers: this.headerFactory.create(token),
      });

      return response.status === 200;
    } catch (error) {
      if (error instanceof ServiceUnavailableError) {
        throw error;
      }

      throw error;
    }
  }
}

module.exports = { AuthService };
