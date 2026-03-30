const request = require("supertest");
const axios = require("axios");
const app = require("../app");

jest.mock("axios");

beforeEach(() => {
  axios.mockReset();
});

describe("Dispatcher (API Gateway) Testleri", () => {
  test("1. Olmayan bir rotaya gidildiğinde uygun HTTP 404 hata kodu dönmeli (Proje İsteri 3.1)", async () => {
    const response = await request(app).get("/olmayan-rota");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error", true);
  });

  test("2. Login istegi auth servisine token sormadan yonlenmeli", async () => {
    axios.mockResolvedValueOnce({
      status: 200,
      data: { token: "NEW_TOKEN_123", tokenType: "Bearer", username: "admin" },
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "admin123" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token", "NEW_TOKEN_123");
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-internal-gateway-key": expect.any(String),
        }),
      })
    );
  });

  test("3. Hiç token gönderilmediğinde HTTP 401 Unauthorized dönmeli (Proje İsteri 3.1)", async () => {
    const response = await request(app).get("/api/users");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error", true);
    expect(response.body.message).toMatch(/Gecerli bir token bulunamadi/i);
  });

  test("4. Auth servisinin reddettigi token icin HTTP 401 donmeli", async () => {
    axios.mockRejectedValueOnce({
      response: {
        status: 401,
        data: { error: true, message: "Gecersiz veya pasif token." },
      },
    });

    const response = await request(app)
      .get("/api/users")
      .set("authorization", "YANLIS_TOKEN_456");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error", true);
    expect(response.body.message).toMatch(/Gecersiz veya suresi dolmus token/i);
  });

  test("5. Gecerli token ile User Service istegi yonlenmeli", async () => {
    axios
      .mockResolvedValueOnce({ status: 200, data: { valid: true, username: "admin" } })
      .mockResolvedValueOnce({ status: 200, data: [{ name: "Ayse" }] });

    const response = await request(app)
      .get("/api/users")
      .set("authorization", "SECRET_TEST_TOKEN_123");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ name: "Ayse" }]);
    expect(axios).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "SECRET_TEST_TOKEN_123",
          "x-internal-gateway-key": expect.any(String),
        }),
      })
    );
  });

  test("6. User Service icin path, method, body ve header bilgileri dogru tasinmali", async () => {
    axios
      .mockResolvedValueOnce({ status: 200, data: { valid: true, username: "admin" } })
      .mockResolvedValueOnce({
        status: 201,
        data: { id: "u1", name: "Ali", email: "ali@example.com" },
      });

    const payload = { name: "Ali", email: "ali@example.com", age: 22 };

    const response = await request(app)
      .post("/api/users/extra?sort=desc")
      .set("authorization", "SECRET_TEST_TOKEN_123")
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: "u1",
      name: "Ali",
      email: "ali@example.com",
    });
    expect(axios).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        method: "POST",
        url: "http://localhost:3001/api/users/extra?sort=desc",
        data: payload,
        headers: expect.objectContaining({
          authorization: "SECRET_TEST_TOKEN_123",
          "x-internal-gateway-key": expect.any(String),
        }),
      })
    );
  });

  test("7. Upstream hata kodu ve govdesi aynen istemciye tasinmali", async () => {
    axios
      .mockResolvedValueOnce({ status: 200, data: { valid: true, username: "admin" } })
      .mockRejectedValueOnce({
        response: {
          status: 404,
          data: { error: true, message: "Kayit bulunamadi" },
        },
      });

    const response = await request(app)
      .get("/api/products/404-test")
      .set("authorization", "SECRET_TEST_TOKEN_123");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: true, message: "Kayit bulunamadi" });
  });

  test("8. Auth service ulasilamazsa HTTP 502 donmeli", async () => {
    axios.mockRejectedValueOnce(new Error("connect ECONNREFUSED"));

    const response = await request(app)
      .get("/api/products")
      .set("authorization", "SECRET_TEST_TOKEN_123");

    expect(response.status).toBe(502);
    expect(response.body.message).toMatch(/Auth Service/i);
  });
});
