# copilot# Mobil Öncelikli Canlı Chat Destek Sistemi

## Kurulum

### 1. Backend/Ana API (FastAPI + Postgres)

```bash
docker-compose up --build
```
- API: http://localhost:8000
- Sağlık kontrolü: http://localhost:8000/health

### 2. Frontend (React + Tailwind)

```bash
cd frontend
npm install
npm start
```
- Uygulama: http://localhost:3000

#### Önemli
- Mobilde 320 piksel ve üzeri tüm ekranlarda responsive çalışır.
- Demo giriş, chat ve admin panel hazır.
- WebSocket bağlantısı, backend node ve portu `.env` veya koddan düzenlenebilir.
- Tüm bağlantı ve işlemlerde minimum validation otomatik devrede.

### 3. Test

```bash
pytest tests/
```
- Temel WebSocket ve auth testleri için.

---

> Geliştirme ve sorunlar için [issues](https://github.com/btasarimambalaj-afk/copilot/issues) kanalını kullanabilirsiniz.
> Sistem kurulduktan sonra isterseniz Telegram, Redis ve ileri entegrasyonlar eklenebilir.
