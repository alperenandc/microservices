import http from 'k6/http';
import { check, sleep } from 'k6';

// Proje İsteri 4.4: 50, 100, 200 gibi eşzamanlı istek (VU - Virtual User) senaryoları
export let options = {
    stages: [
        { duration: '10s', target: 50 },  // 10 saniye içinde 50 kullanıcıya çık
        { duration: '15s', target: 100 }, // Ardından 15 saniye boyunca 100 kullanıcıya çık
        { duration: '10s', target: 200 }, // Hızlanıp 200 kullanıcı ile sistemi zorla
        { duration: '5s', target: 0 },    // Testi yavaşça bitir
    ],
};

export default function () {
    // Dispatcher'ın yönlendirme (Proxy) hızını test ediyoruz. 
    // Health rotası auth gerektirmediği için doğrudan Gateway performansını ölçer.
    let res = http.get('http://host.docker.internal:8080/api/users/health');

    // Gelen cevapların başarılı (200 OK) olup olmadığını kontrol ediyoruz
    check(res, {
        'Durum kodu 200 mü?': (r) => r.status === 200,
        'Yanıt süresi 500ms altında mı?': (r) => r.timings.duration < 500,
    });

    // İstekler arası çok kısa bir bekleme (Gerçek kullanıcı simülasyonu)
    sleep(0.1);
}