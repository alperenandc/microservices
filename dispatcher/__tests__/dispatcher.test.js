const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app");

let mongoServer;

// Tüm testlerden ÖNCE çalışır: Sanal MongoDB kur, bağlan ve içine geçerli bir token ekle
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Sanal veritabanına test için geçerli bir API anahtarı (Token) ekliyoruz
  const db = mongoose.connection.db;
  await db.collection("apikeys").insertOne({
    token: "SECRET_TEST_TOKEN_123",
    active: true,
  });
});

// Tüm testler BİTTİKTEN SONRA çalışır: Veritabanı bağlantısını kopar ve sanal sunucuyu kapat
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Dispatcher (API Gateway) Testleri", () => {
  test("1. Olmayan bir rotaya gidildiğinde uygun HTTP 404 hata kodu dönmeli (Proje İsteri 3.1)", async () => {
    const response = await request(app).get("/olmayan-rota");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error", true);
  });

  test("2. /health rotasına gelen istekler yetki sormadan geçmeli", async () => {
    const response = await request(app).get("/api/users/health");

    // Token sormadığı için 401 (Unauthorized) dönmemelidir.
    expect(response.status).not.toBe(401);
  });

  test("3. Hiç token gönderilmediğinde HTTP 401 Unauthorized dönmeli (Proje İsteri 3.1)", async () => {
    const response = await request(app).get("/api/users");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error", true);
    expect(response.body.message).toMatch(/Geçerli bir token bulunamadı/i);
  });

  test("4. Veritabanında OLMAYAN (Yanlış) bir token gönderildiğinde HTTP 401 dönmeli", async () => {
    const response = await request(app)
      .get("/api/users")
      .set("authorization", "YANLIS_TOKEN_456");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error", true);
    expect(response.body.message).toMatch(/Geçersiz veya süresi dolmuş token/i);
  });

  // GÜNCELLENEN TEST: User Service Yönlendirmesi
  test("5. Veritabanında KAYITLI (Doğru) bir token ile User Servisine erişime izin verilmeli", async () => {
    const response = await request(app)
      .get("/api/users")
      .set("authorization", "SECRET_TEST_TOKEN_123");

    // Token doğru olduğu için içeri girmeli. Ancak test anında arkada user_service kapalı olduğu için 
    // Axios bağlanamayacak ve Dispatcher bize 401 (Unauthorized) DEĞİL, 502 (Bad Gateway) dönecektir.
    expect(response.status).toBe(502);
    expect(response.body.message).toMatch(/Bad Gateway/i);
  });

  // YENİ EKLENEN TEST: Product Service Yönlendirmesi
  test("6. Veritabanında KAYITLI (Doğru) bir token ile Product Servisine erişime izin verilmeli", async () => {
    const response = await request(app)
      .get("/api/products")
      .set("authorization", "SECRET_TEST_TOKEN_123");

    // Aynı şekilde Product servisi için de yetki onaylanıp 502 Proxy hatası dönmeli
    expect(response.status).toBe(502);
    expect(response.body.message).toMatch(/Bad Gateway/i);
  });
});