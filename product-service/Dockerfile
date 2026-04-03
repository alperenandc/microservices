# Node.js'in hafif bir versiyonunu kullanıyoruz
FROM node:18-alpine

# Konteyner içindeki çalışma dizinini belirliyoruz
WORKDIR /app

# Önce paket bilgilerini kopyalayıp npm install yapıyoruz
COPY package*.json ./
RUN npm install

# Geri kalan tüm kodları (app.js vb.) kopyalıyoruz
COPY . .

# Uygulamayı başlatıyoruz
CMD ["node", "app.js"]
