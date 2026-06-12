# AssetHub — Smart Asset Management Platform

> **Cult Open Projects 2026 · IIT Roorkee**

AssetHub is a full-stack web platform that helps organisations **catalogue, book, track, and analyse** physical assets (lab equipment, electronics, furniture, AV gear, and more). It provides separate **Admin** and **User** portals with real-time notifications, analytics dashboards, QR-based asset scanning, and a complete booking lifecycle from request to return.

---

## Project Overview

Managing shared physical assets in universities and organisations is often manual — spreadsheets, email chains, and missed return dates. AssetHub digitises this workflow end-to-end:

- **Users** browse available assets, submit booking requests, scan QR codes, receive notifications, submit reviews after return, and participate in feedback campaigns.
- **Admins** manage inventory, approve/reject/issue/return bookings, monitor utilisation analytics, send overdue reminders, manage users, and review asset feedback.

The system enforces role-based access, maintains an audit trail of all operations, and pushes **real-time in-app notifications** via WebSockets alongside optional email alerts.

---

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Django 5, Django REST Framework, PostgreSQL |
| **Real-time** | Django Channels, Daphne, Redis |
| **Background jobs** | Celery, Redis broker |
| **Authentication** | JWT (djangorestframework-simplejwt)|
| **Frontend** | React 18, TypeScript, Vite |
| **State management** | Redux Toolkit, RTK Query |
| **UI** | Tailwind CSS, Lucide React, Recharts |
| **Forms & validation** | React Hook Form, Zod |
| **QR scanning** | html5-qrcode, qrcode (Python) |
| **Deployment** | Docker Compose, Nginx, Daphne |

---

## Setup Instructions

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose **(recommended)**
- OR: Python 3.12+, Node.js 18+, PostgreSQL 16, Redis 7

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd smart-asset-mgmt
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` as needed. For Docker, defaults work out of the box (`DB_HOST=db`, `REDIS_HOST=redis` are set in `docker-compose.yml`).

### 3. Run with Docker (recommended)

```bash
docker compose up --build
```

This starts:

| Service | Purpose |
|---------|---------|
| `db` | PostgreSQL database |
| `redis` | Channels layer + Celery broker |
| `web` | Django API + WebSocket (Daphne) |
| `celery_worker` | Async email tasks |
| `frontend` | React app served via Nginx on port **80** |

On first boot, migrations run automatically and demo data is seeded.

---

## Running the Application

### Production / Demo (Docker)

```bash
docker compose up --build -d
```

Open **http://localhost** in your browser.

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@demo.com` | `Admin@123` |
| User | `alice@demo.com` | `User@123` |
| User | `bob@demo.com` | `User@123` |
| User | `carol@demo.com` | `User@123` |

### Local development (without Docker)

**Backend:**

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # set DB_HOST=localhost, REDIS_HOST=localhost
python manage.py migrate
python manage.py seed
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

In a second terminal, start Celery for emails:

```bash
cd backend && source venv/bin/activate
celery -A config worker -l info
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173 — proxies /api and /ws to backend
```

### Running tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

---

## Feature List

### Authentication & Users
- Email-based registration with enrollment number validation
- JWT login with access/refresh tokens and automatic token refresh
- Forgot password (temporary password via email)
- Profile management and change password
- Admin user list with search, block/unblock

### Asset Management (Admin)
- CRUD for assets and categories
- Quantity tracking (`available_qty` / `total_qty`)
- Status (available, maintenance, retired) and condition tracking
- Search, filter, and sort assets
- Per-asset QR code generation and download
- Asset reviews summary (admin accordion modal)

### Booking Workflow
- User booking requests with date range and quantity
- Admin approve → reject → issue → return lifecycle
- User cancellation (pending/approved)
- Inventory automatically adjusted on issue/return
- Overdue detection for issued bookings
- Admin one-click overdue reminder (in-app + email)

### QR Scanner
- User and admin QR scanner pages
- Scan asset QR to view details and create bookings quickly
- Admin scan for issue/return workflows

### Notifications
- Persistent in-app notifications (database-backed)
- Real-time delivery via WebSocket (`/ws/notifications/`)
- Unread badge in sidebar and mobile header
- Mark read, mark all read, clear all
- Retention policy (30 days / max 100 per user)
- Email notifications for bookings and overdue reminders

### Analytics (Admin)
- KPI dashboard: total assets, utilisation, pending requests, overdue
- Utilisation by category (bar chart)
- Borrowed assets by category (pie chart)
- Top borrowed assets ranking
- Overdue bookings list with reminder action
- Human-readable activity log (audit trail)

### Reviews & Feedback
- Users review returned assets (rating + text, one per booking)
- Admin views reviews per asset, marks as seen
- Admin feedback campaigns; users submit product/improvement suggestions

### Security
- Role-based access control (Admin vs User)
- Blocked users rejected at login, API, token refresh, and WebSocket
- Admin-only endpoints for sensitive operations
- JWT token blacklist on logout


## Project Structure

```
assethub/
├── backend/
│   ├── config/              # Settings, URLs, ASGI (HTTP + WebSocket)
│   ├── apps/
│   │   ├── users/           # Auth, profiles, user management
│   │   ├── assets/          # Assets, categories, QR codes
│   │   ├── bookings/        # Bookings, reviews, audit logs
│   │   ├── analytics/       # Dashboard analytics
│   │   ├── notifications/   # Notifications + WebSocket consumer
│   │   ├── feedback/        # Feedback campaigns & responses
│   │   └── core/            # Permissions, auth, seed command
│   └── tests/
├── frontend/
│   └── src/
│       ├── app/             # Redux store, RTK Query base API
│       ├── features/        # API slices (auth, bookings, assets, …)
│       ├── components/      # Layout, shared UI components
│       └── pages/           # User & admin pages
├── docker-compose.yml
├── README.md
└── TECHNICAL_DOCUMENTATION.md
```

---

## Team / License

Built for **Cult Open Projects 2026, IIT Roorkee**.
