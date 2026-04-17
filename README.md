# 🌿 SmartSeason — Field Monitoring System

A full-stack web application for tracking crop progress across multiple fields during a growing season.

**GitHub:** https://github.com/somotto/SmartSeason-Field-Monitoring-System

---

## Tech Stack

| Layer    | Technology          |
|----------|---------------------|
| Backend  | Node.js + Express   |
| Frontend | React (CRA)         |
| Database | PostgreSQL           |
| Auth     | JWT (jsonwebtoken)  |
| Styling  | Vanilla CSS-in-JS   |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally

---

### 1. Clone the repo

```bash
git clone https://github.com/somotto/SmartSeason-Field-Monitoring-System.git
cd SmartSeason-Field-Monitoring-System
```

---

### 2. Set up the Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set your database connection:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/smartseason
JWT_SECRET=change_this_to_something_long_and_random
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Create the database (Linux/macOS):
```bash
sudo -u postgres psql -c "CREATE DATABASE smartseason;"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'yourpassword';"
```

Run migrations + seed:
```bash
npm run db:migrate
npm run db:seed
```

Start the API:
```bash
npm run dev    # development (nodemon)
npm start      # production
```

API runs at: `http://localhost:5000`

---

### 3. Set up the Frontend

```bash
cd ../frontend
npm install
cp .env.example .env
```

`.env` defaults work out of the box:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start the app:
```bash
npm start
```

Frontend runs at: `http://localhost:3000`

---

## Demo Credentials

| Role  | Email                     | Password  |
|-------|---------------------------|-----------|
| Admin | admin@smartseason.com     | admin123  |
| Agent | james@smartseason.com     | agent123  |
| Agent | aisha@smartseason.com     | agent123  |

---

## API Endpoints

### Auth
| Method | Endpoint         | Description       |
|--------|------------------|-------------------|
| POST   | /api/auth/login  | Login → JWT token |
| GET    | /api/auth/me     | Get current user  |

### Fields
| Method | Endpoint           | Access      | Description                 |
|--------|--------------------|-------------|-----------------------------|
| GET    | /api/fields        | All         | List fields (role-filtered) |
| GET    | /api/fields/stats  | All         | Dashboard summary stats     |
| GET    | /api/fields/:id    | All         | Field detail + history      |
| POST   | /api/fields        | Admin only  | Create field                |
| PUT    | /api/fields/:id    | All         | Update field (role-scoped)  |
| DELETE | /api/fields/:id    | Admin only  | Delete field                |

### Users
| Method | Endpoint          | Access      | Description      |
|--------|-------------------|-------------|------------------|
| GET    | /api/users/agents | Admin only  | List all agents  |
| POST   | /api/users        | Admin only  | Create agent     |

---

## Field Status Logic

Status is **computed at query time** from the field's data — it is never stored in the database. This keeps the logic centralised and easy to change.

**Rules (`backend/src/models/fieldStatus.js`):**

| Condition                                            | Status      |
|------------------------------------------------------|-------------|
| `current_stage === 'harvested'`                      | `completed` |
| `stage === 'ready'` and planted 180+ days ago        | `at_risk`   |
| `stage === 'growing'` and planted 120+ days ago      | `at_risk`   |
| `stage === 'planted'` and planted 30+ days ago       | `at_risk`   |
| Everything else                                      | `active`    |

The reasoning: a field stuck in an early stage beyond expected timelines likely has a problem (pest, drought, delayed management) and should draw attention.

---

## Design Decisions

### Role-based access
- **Admin (Coordinator):** Full CRUD on fields; can assign agents; sees all fields and updates.
- **Field Agent:** Sees only their assigned fields; can update stage + add notes; cannot create or delete fields.
- Access enforced on both the backend (middleware) and frontend (route guards + conditional UI).

### Field update history
Every stage change is logged in a `field_updates` table with the agent, previous stage, new stage, and optional notes. This creates a full audit trail without modifying the main `fields` row.

### Separation of concerns
```
backend/src/
  config/      ← DB connection, migrate, seed
  middleware/  ← JWT auth, role guard
  models/      ← Business logic (status computation)
  controllers/ ← Request handlers
  routes/      ← Route definitions
```

### Computed status
Status is derived from data, not persisted, ensuring it is always current and consistent. If business rules change, only `fieldStatus.js` needs updating.

---

## Project Structure

```
SmartSeason-Field-Monitoring-System/
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   ├── migrate.js
│   │   │   └── seed.js
│   │   ├── middleware/auth.js
│   │   ├── models/fieldStatus.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── fieldsController.js
│   │   │   └── usersController.js
│   │   └── routes/index.js
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── public/index.html
    ├── src/
    │   ├── index.js
    │   ├── App.js
    │   ├── index.css
    │   ├── context/AuthContext.js
    │   ├── utils/api.js
    │   ├── components/
    │   │   ├── Layout.js
    │   │   └── StatusBadge.js
    │   └── pages/
    │       ├── Login.js
    │       ├── Dashboard.js        ← Admin overview
    │       ├── AgentDashboard.js   ← Agent card view
    │       ├── FieldsList.js       ← Filterable table
    │       ├── FieldDetail.js      ← Detail + update history
    │       ├── FieldForm.js        ← Create / Edit form
    │       └── Agents.js           ← Agent management
    ├── package.json
    └── .env.example
```

---

## Assumptions

- No email verification required; demo credentials are sufficient.
- A field can only be assigned to one agent at a time.
- Agents can update the stage to any value (including going backwards) — intentional, as field conditions may warrant this.
- Area and location are optional fields.
- The frontend proxies API calls via the `proxy` field in `package.json` in development.
