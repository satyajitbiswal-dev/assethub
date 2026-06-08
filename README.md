# Smart Asset Management System
> Cult Open Projects 2026 — IIT Roorkee

A full-stack asset management platform for organisations to manage, track, and book physical assets. Built with Django + DRF (backend) and React TypeScript + Redux Toolkit (frontend).

---

## 🚀 Quick Start (Docker)

```bash
git clone <your-repo-url>
cd smart-asset-mgmt

# Copy and fill in env
cp backend/.env.example backend/.env

# Run everything
docker compose up --build
```

Visit **http://localhost** — the seed command auto-creates demo data.

**Demo credentials:**
| Role  | Email           | Password  |
|-------|-----------------|-----------|
| Admin | admin@demo.com  | Admin@123 |
| User  | alice@demo.com  | User@123  |
| User  | bob@demo.com    | User@123  |

---

## 🛠 Local Development (without Docker)

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # fill in your PostgreSQL credentials
python manage.py migrate
python manage.py seed  # loads demo data
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev   # runs on http://localhost:5173
```

The Vite dev server proxies `/api` calls to `http://localhost:8000` automatically.

---

## 🧱 Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Backend    | Django 5 · Django REST Framework · PostgreSQL   |
| Auth       | JWT via djangorestframework-simplejwt            |
| Frontend   | React 18 · TypeScript · Vite                    |
| State      | Redux Toolkit + RTK Query                       |
| UI         | Tailwind CSS · Lucide React · Recharts          |
| Forms      | React Hook Form + Zod                           |
| Container  | Docker + docker-compose                         |
| Prod serve | Gunicorn + Nginx + Whitenoise                   |

---

## 📁 Project Structure

```
smart-asset-mgmt/
├── backend/
│   ├── config/            # Django settings, urls, wsgi
│   ├── apps/
│   │   ├── users/         # Custom User model, JWT auth
│   │   ├── assets/        # Asset & Category models, QR codes
│   │   ├── bookings/      # Booking workflow, AuditLog
│   │   ├── analytics/     # Dashboard analytics endpoints
│   │   ├── notifications/ # In-app notification system
│   │   └── core/          # Permissions, exception handler, seed cmd
│   ├── tests/             # pytest test suite (25+ tests)
│   └── requirements.txt
└── frontend/
    └── src/
        ├── app/           # Redux store, RTK base API, hooks
        ├── features/      # authSlice + all RTK Query APIs
        ├── components/    # Layout (Sidebar, AppLayout), shared UI
        ├── pages/
        │   ├── admin/     # Dashboard, Assets, Bookings, Users
        │   └── user/      # Dashboard, Asset catalog, My Bookings
        └── types/         # All TypeScript interfaces
```

---

## 🔑 API Endpoints

| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| POST   | /api/auth/register/               | Register new user        |
| POST   | /api/auth/login/                  | Login → JWT tokens       |
| POST   | /api/auth/token/refresh/          | Refresh access token     |
| GET    | /api/auth/me/                     | Current user profile     |
| GET    | /api/assets/                      | List assets (filterable) |
| POST   | /api/assets/                      | Create asset (admin)     |
| GET    | /api/assets/{id}/qr/              | Asset QR code PNG        |
| GET    | /api/bookings/                    | List bookings            |
| POST   | /api/bookings/                    | Create booking request   |
| PATCH  | /api/bookings/{id}/approve/       | Approve (admin)          |
| PATCH  | /api/bookings/{id}/reject/        | Reject (admin)           |
| PATCH  | /api/bookings/{id}/issue/         | Issue asset (admin)      |
| PATCH  | /api/bookings/{id}/return/        | Return asset (admin)     |
| GET    | /api/analytics/summary/           | KPI summary (admin)      |
| GET    | /api/analytics/utilisation/       | By-category chart data   |

---

## 🧪 Running Tests

```bash
cd backend
pip install -r requirements.txt
pytest --cov=apps tests/ -v
```

---

## 📦 Environment Variables

| Variable                        | Default        | Description              |
|---------------------------------|----------------|--------------------------|
| `SECRET_KEY`                    | —              | Django secret key        |
| `DEBUG`                         | `True`         | Debug mode               |
| `DB_NAME / DB_USER / DB_PASSWORD` | `asset_mgmt` | PostgreSQL credentials   |
| `DB_HOST`                       | `localhost`    | DB host (use `db` in Docker) |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | `60`       | Access token lifetime    |
| `EMAIL_HOST / EMAIL_PORT`       | `localhost:1025` | SMTP config            |
| `CORS_ALLOWED_ORIGINS`          | `localhost:5173` | React dev server       |
