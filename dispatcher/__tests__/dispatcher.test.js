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

  test("2. /health rotasına gelen istekler yetki sormadan geçmeli (Proxy Mock Test)", async () => {
    const response = await request(app).get("/api/users/health");

    // app.js'de mock yönlendirme yaptığımız veya health check'e izin verdiğimiz için 200 veya 404 bekleyebiliriz
    // Şu anki app.js'de authMiddleware'den geçip route not found'a düşüyor olabilir, 
    // ama önemli olan 401 (Yetkisiz) DÖNMEMESİDİR.
    expect(response.status).not.toBe(401);
  });

  test("3. Hiç token gönderilmediğinde HTTP 401 Unauthorized dönmeli (Proje İsteri 3.1)", async () => {
    // Headers kısmında "Authorization" token'ı OLMADAN istek atıyoruz
    const response = await request(app).get("/api/users");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error", true);
    expect(response.body.message).toMatch(/Geçerli bir token bulunamadı/i);
  });

  test("4. Veritabanında OLMAYAN (Yanlış) bir token gönderildiğinde HTTP 401 dönmeli", async () => {
    // Yanlış bir token ile istek atıyoruz
    const response = await request(app)
      .get("/api/users")
      .set("authorization", "YANLIS_TOKEN_456");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error", true);
    expect(response.body.message).toMatch(/Geçersiz veya süresi dolmuş token/i);
  });

  test("5. Veritabanında KAYITLI (Doğru) bir token ile gelindiğinde erişime izin verilmeli (HTTP 200)", async () => {
    // beforeAll bloğunda veritabanına eklediğimiz DOĞRU token ile istek atıyoruz
    const response = await request(app)
      .get("/api/users")
      .set("authorization", "SECRET_TEST_TOKEN_123");

    // Token doğru olduğu için içeri girmeli ve mock mesajımızı almalıyız
    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/User servisine yönlendirildi/i);
  });
});