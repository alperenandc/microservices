import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Özel metrikler
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time', true);

// Test Konfigürasyonu: 50 → 100 → 200 sanal kullanıcı
export const options = {
  stages: [
    { duration: '20s', target: 50  },   // Aşama 1: 50 VU'ya yükselt
    { duration: '30s', target: 50  },   // Aşama 1: 50 VU'da tut
    { duration: '20s', target: 100 },   // Aşama 2: 100 VU'ya yükselt
    { duration: '30s', target: 100 },   // Aşama 2: 100 VU'da tut
    { duration: '20s', target: 200 },   // Aşama 3: 200 VU'ya yükselt
    { duration: '30s', target: 200 },   // Aşama 3: 200 VU'da tut
    { duration: '20s', target: 0   },   // Sıfıra iniş (cool-down)
  ],
  // Başarısızlık eşikleri: %5'ten fazla hata veya %90 > 500ms ise test başarısız sayılır
  thresholds: {
    'http_req_failed':         ['rate<0.05'],
    'http_req_duration':       ['p(90)<500', 'p(95)<1000'],
    'http_req_duration{group:::Products API}': ['avg<300'],
    'http_req_duration{group:::Users API}':    ['avg<300'],
    'error_rate':              ['rate<0.05'],
  },
};

// Docker Compose içinde k6 servisi Dispatcher'a bu isimle ulaşır
// Yerel çalıştırmada 'localhost:8080' kullanılır
const BASE_URL = __ENV.BASE_URL || 'http://dispatcher:8080';

// Her VU başında login ol ve token al
function getJwtToken() {
  const loginPayload = JSON.stringify({ username: 'k6user', password: 'k6pass' });
  const loginRes = http.post(`${BASE_URL}/api/users/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (loginRes.status === 200 && loginRes.json('token')) {
    return loginRes.json('token');
  }
  // Eğer kullanıcı yoksa, önce register et, sonra login ol
  http.post(`${BASE_URL}/api/users`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  const retryLogin = http.post(`${BASE_URL}/api/users/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return retryLogin.json('token');
}

export default function () {
  // Her VU için login ve token al
  const token = getJwtToken();
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  // SENARYO 1: Ürün listesini getir (Product GET)
  group('Products API', () => {
    const res = http.get(`${BASE_URL}/api/products`, params);
    responseTime.add(res.timings.duration);
    const ok = check(res, {
      'Products: Durum 200': (r) => r.status === 200,
      'Products: Yanit suresi < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(!ok);
  });

  sleep(0.2);

  // SENARYO 2: Kullanıcı listesini getir (User GET)
  group('Users API', () => {
    const res = http.get(`${BASE_URL}/api/users`, params);
    responseTime.add(res.timings.duration);
    const ok = check(res, {
      'Users: Durum 200': (r) => r.status === 200,
      'Users: Yanit suresi < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(!ok);
  });

  sleep(0.1);

  // SENARYO 3: Sipariş listesini getir (Order GET)
  group('Orders API', () => {
    const res = http.get(`${BASE_URL}/api/orders`, params);
    responseTime.add(res.timings.duration);
    const ok = check(res, {
      'Orders: Durum 200': (r) => r.status === 200,
      'Orders: Yanit suresi < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(!ok);
  });

  sleep(0.1);
}
