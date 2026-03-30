const axios = require("axios");
const { ServiceUnavailableError } = require("../errors");

class ProxyClient {
  constructor(httpClient = axios) {
    this.httpClient = httpClient;
  }

  async send(requestConfig) {
    try {
      return await this.httpClient(requestConfig);
    } catch (error) {
      if (error.response) {
        return error.response;
      }

      throw new ServiceUnavailableError(error.message);
    }
  }
}

module.exports = { ProxyClient };
