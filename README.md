# Mobil Öncelikli Canlı Destek Chat Sistemi

Prod-ready FastAPI backend + React + Tailwind frontend.

Run locally:

1. Backend: `docker-compose up --build`
2. Frontend: `cd frontend && npm install && npm start`

Environment variables (set in deployment):
- DATABASE_URL
- JWT_SECRET
- ADMIN_OTP
- MEDIA_ROOT (optional)
- CORS_ORIGINS

Deploy notes: Use Railway or Vercel for frontend. Use S3 for media in production.
