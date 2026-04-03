class RouteProxyService {
  constructor({ proxyClient, baseUrl, resourceBasePath, headerFactory }) {
    this.proxyClient = proxyClient;
    this.baseUrl = baseUrl;
    this.resourceBasePath = resourceBasePath;
    this.headerFactory = headerFactory;
  }

  async forward(req) {
    const suffix = req.url === "/" ? "" : req.url;

    return this.proxyClient.send({
      method: req.method,
      url: `${this.baseUrl}${this.resourceBasePath}${suffix}`,
      data: req.body,
      headers: this.headerFactory.create(req.headers.authorization),
    });
  }
}

module.exports = { RouteProxyService };
