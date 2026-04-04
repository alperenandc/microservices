const mongoose = require("mongoose");
const crypto = require("crypto");
const client = require("prom-client");

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const requestCounter = new client.Counter({
  name: "dispatcher_http_requests_total",
  help: "Total number of HTTP requests handled by dispatcher",
  labelNames: ["method", "route_group", "status_code"],
  registers: [register],
});

const requestDuration = new client.Histogram({
  name: "dispatcher_http_request_duration_ms",
  help: "Dispatcher request latency in milliseconds",
  labelNames: ["method", "route_group", "status_code"],
  buckets: [25, 50, 100, 200, 300, 500, 1000, 2000],
  registers: [register],
});

function resolveRouteGroup(path) {
  if (path.startsWith("/api/users")) {
    return "user-service";
  }

  if (path.startsWith("/api/products")) {
    return "product-service";
  }

  if (path.startsWith("/api/orders")) {
    return "order-service";
  }

  if (path.startsWith("/api/auth")) {
    return "auth-service";
  }

  if (path.startsWith("/api/admin")) {
    return "dispatcher-admin";
  }

  return "dispatcher";
}

function createGatewayObservability({ auditLogRepository }) {
  const middleware = (req, res, next) => {
    const startNs = process.hrtime.bigint();
    const requestId = crypto.randomUUID();
    const routeGroup = resolveRouteGroup(req.originalUrl || req.path || "");

    res.setHeader("x-request-id", requestId);

    res.on("finish", async () => {
      const durationNs = process.hrtime.bigint() - startNs;
      const durationMs = Number(durationNs) / 1e6;
      const statusCode = String(res.statusCode);

      requestCounter.inc({
        method: req.method,
        route_group: routeGroup,
        status_code: statusCode,
      });

      requestDuration.observe(
        {
          method: req.method,
          route_group: routeGroup,
          status_code: statusCode,
        },
        durationMs
      );

      if (!auditLogRepository || mongoose.connection.readyState !== 1) {
        return;
      }

      try {
        await auditLogRepository.create({
          method: req.method,
          path: req.originalUrl || req.url,
          statusCode: res.statusCode,
          durationMs,
          targetService: routeGroup,
          requestId,
        });
      } catch (error) {
        // Observability should not affect request flow.
      }
    });

    next();
  };

  const metricsHandler = async (req, res) => {
    try {
      res.set("Content-Type", register.contentType);
      res.status(200).send(await register.metrics());
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Metrics olusturulamadi",
      });
    }
  };

  return { middleware, metricsHandler };
}

module.exports = { createGatewayObservability };
