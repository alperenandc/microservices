# Kocaeli Üniversitesi - Yazılım Geliştirme Laboratuvarı-II Proje 1

Bu proje Kocaeli Üniversitesi Bilişim Sistemleri Mühendisliği "Yazılım Geliştirme Laboratuvarı-II" dersi kapsamında **Test-Driven Development (TDD)** disiplini kullanılarak geliştirilmiş bir Mikroservis Mimarisidir.

## Proje Bilgileri
- **Geliştiriciler**: Eren, Alperen (Örnek)
- **Tarih**: 11 Mart 2026
- **Ana Teknolojiler**: Node.js, Express.js, MongoDB, Docker, Jest, K6, Mermaid.

## Sistem Mimarisi ve İzolasyon (Network Isolation)
Sistemimiz 4 temel docker servisinden oluşmaktadır. Disptacher (API Gateway) dışındaki hiçbir servis dış dünyaya açık değildir. İç ağda (Backend network) birbirleriyle iletişim kurarlar.

```mermaid
graph TD
    User((Kullanıcı/İstemci)) -->|Port: 8080| Dispatcher
    
    subgraph Izole_Iç_Ag [İzole İç Ağ - Docker Network]
        Dispatcher[Dispatcher API Gateway]
        AuthService[User/Auth Service]
        ProductService[Product Service]
        OrderService[Order Service]
        
        DispDB[(Dispatcher Logs DB)]
        AuthDB[(User DB)]
        ProductDB[(Product DB)]
        OrderDB[(Order DB)]
        
        Dispatcher -->|Port: 3001| AuthService
        Dispatcher -->|Port: 3002| ProductService
        Dispatcher -->|Port: 3003| OrderService
        Dispatcher -->|Log| DispDB
        
        AuthService --> AuthDB
        ProductService --> ProductDB
        OrderService --> OrderDB
    end

    classDef public fill:#f9f,stroke:#333,stroke-width:2px;
    classDef private fill:#bbf,stroke:#333,stroke-width:2px;
    class Dispatcher public;
    class AuthService,ProductService,OrderService private;
```

## Richardson Maturity Model (RMM) - Seviye 2
Tüm servisler REST standartları (RMM Level 2) göz önünde bulundurularak tasarlanmıştır.

| Servis | Metot | URL Endpoint | Açıklama |
|---|---|---|---|
| User | `POST` | `/api/users` | Yeni Kullanıcı Kaydı |
| User | `POST` | `/api/users/login` | Sisteme Kimlik Doğrulama (JWT Üretimi) |
| Product | `GET` | `/api/products` | Tüm Ürünleri Listele |
| Product | `POST` | `/api/products` | Yeni Ürün Ekle |
| Product | `PUT` | `/api/products/:id` | Ürün Bilgisi Güncelle |
| Product | `DELETE`| `/api/products/:id` | Ürünü Veritabanından Sil |
| Order | `GET` | `/api/orders` | Tüm Siparişleri Listele |
| Order | `POST` | `/api/orders` | Yeni Sipariş Ver |
| Order | `PUT` | `/api/orders/:id` | Sipariş Durumunu Güncelle (örn: pending) |
| Order | `DELETE`| `/api/orders/:id` | Siparişi İptal Et/Sil |

## Dispatcher Akış Şeması (TDD & Logic Katmanı)

Dispatcher gelen istekleri şu aşamalardan geçirir:
1. İsteği MongoDB'ye loglar.
2. Açık (Public) rotaları kontrol eder. Kayıt veya giriş değilse JWT'yi doğrular.
3. JWT doğrulamasını geçenleri ilgili mikroservise iletir ("Reverse Proxy").

```mermaid
sequenceDiagram
    participant C as İstemci (K6 / Postman)
    participant D as Dispatcher (Gateway)
    participant M as MongoDB (Log)
    participant S as Alt Servisler (User/Product)

    C->>D: HTTP GET /api/products (Token Yok)
    D->>M: İsteği Logla
    D-->>C: 401 Unauthorized (Access Denied)

    C->>D: HTTP GET /api/products (Bearer JWT...)
    D->>M: İsteği Logla
    D->>D: JWT Geçerliliğini Doğrula
    D->>S: İsteği Yönlendir
    S-->>D: Servis Yanıtı (200 OK, JSON Veri)
    D-->>C: Response Aktarımı
```

## Performans & Yük Testi
Sistem `k6` analiz aracıyla 50, 100, 200 ve 500 eşzamanlı sanal kullanıcı kapasitesi ile test test edilebilir şekilde tasarlanmıştır.

**Yük Testini Çalıştırmak İçin:**
```bash
# İlk önce sistemi ayağa kaldırın
docker-compose up -d

# Ardından test scriptini çalıştırın
k6 run load_test.js
```

Aynı zamanda gelen trafik loglarını UI tablosundan izlemek için `http://localhost:8080/ui` adresine giriş yapabilirsiniz.

## Sonuç
Proje tüm gereksinimleri (Ağ izolasyonu, Docker, Bireysel Veritabanları, TDD Timestamp kuralları, RMM Seviye 2) hatasız entegre ederek uçtan uca çalışır hale getirilmiştir. Geliştirme süreci Github reposunda düzenli commit edilmiştir.
