# FitTrack — Full-Stack Fitness Tracker

A complete fitness tracking web application built with React (Vite) + Node.js/Express + PostgreSQL.

---

## Prerequisites

- **Node.js** 18+  (`node --version`)
- **PostgreSQL** 14+  (`psql --version`)
- **npm** 8+

---

## 1. Database Setup

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE fitnessdb;"

# Run migrations (creates all tables)
cd server
npm install
npm run migrate

# Seed exercises (40 exercises across all muscle groups)
npm run seed
```

---

## 2. Environment Configuration

### Server (`/server/.env`)
```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fitnessdb
JWT_SECRET=your_super_secret_jwt_key_here
```

> Copy `/server/.env.example` and update credentials to match your PostgreSQL setup.

### Client (`/client/.env`) — optional
```env
VITE_API_URL=http://localhost:5000/api
```

The client defaults to `http://localhost:5000/api` via the Axios instance.

---

## 3. Run the Backend

```bash
cd server
npm install
npm run dev     # starts on http://localhost:5000
```

Backend health check: `curl http://localhost:5000/api/health`

---

## 4. Run the Frontend

```bash
cd client
npm install
npm run dev     # starts on http://localhost:5173
```

Open your browser at **http://localhost:5173**

---

## 5. API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |
| PUT | `/api/auth/profile` | ✅ | Update profile / change password |
| DELETE | `/api/auth/account` | ✅ | Delete account |

### Exercises
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/exercises` | — | List all (`?q=search&muscle=group`) |
| POST | `/api/exercises` | ✅ | Create custom exercise |
| GET | `/api/exercises/:id/history` | ✅ | User's history for exercise |

### Workouts
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/workouts` | ✅ | List user's workouts |
| POST | `/api/workouts` | ✅ | Log new workout with sets |
| GET | `/api/workouts/:id` | ✅ | Get workout detail + sets |
| PUT | `/api/workouts/:id` | ✅ | Update workout |
| DELETE | `/api/workouts/:id` | ✅ | Delete workout |

### Stats
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/stats/summary` | ✅ | Weekly summary (workouts, calories, streak, volume) |
| GET | `/api/stats/progress` | ✅ | Workout count per day (last 30 days) |
| GET | `/api/stats/personal-bests` | ✅ | Max weight per exercise |
| GET | `/api/stats/volume-trend` | ✅ | Total volume per week (last 8 weeks) |

### Body Metrics
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/metrics` | ✅ | List metrics history |
| POST | `/api/metrics` | ✅ | Log new entry |
| DELETE | `/api/metrics/:id` | ✅ | Delete entry |

### Goals
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/goals` | ✅ | List goals |
| POST | `/api/goals` | ✅ | Create goal |
| PUT | `/api/goals/:id` | ✅ | Update progress / mark complete |
| DELETE | `/api/goals/:id` | ✅ | Delete goal |

> All protected routes require `Authorization: Bearer <token>` header.

---

## 6. Project Structure

```
fitness-track/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── api/axios.js       # Axios instance with auth interceptor
│   │   ├── components/        # Layout, PrivateRoute
│   │   ├── context/           # AuthContext, ToastContext
│   │   ├── pages/             # All 7 page components
│   │   └── styles/index.css   # Global design system
│   ├── index.html
│   └── vite.config.js
│
├── server/                    # Node.js + Express backend
│   ├── db/
│   │   ├── pool.js            # PostgreSQL connection pool
│   │   ├── migrate.js         # Schema migration script
│   │   └── seed.js            # Exercise seed data (40 exercises)
│   ├── middleware/auth.js     # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── exercises.js
│   │   ├── workouts.js
│   │   ├── stats.js
│   │   ├── metrics.js
│   │   └── goals.js
│   ├── index.js               # Express app entry point
│   ├── .env                   # Environment variables
│   └── package.json
│
└── README.md
```

---

## 7. Features

- 🔐 **JWT Authentication** — register/login with bcrypt password hashing
- 🏋️ **Workout Logging** — log exercises with sets/reps/weight or cardio (duration/distance)
- 📊 **Dashboard** — stat cards, area chart, bar chart, recent workouts, active goals
- 📅 **Workout History** — calendar view, expandable cards, personal bests table
- 🏋️ **Exercise Library** — 40 seeded exercises, search/filter, custom exercises, progress chart
- 📈 **Body Metrics** — weight/body fat tracking, BMI calculator, history table
- 🎯 **Goals** — set targets, track progress with bars, mark complete
- 👤 **Profile** — edit info, change password, account deletion
- 🔔 **Toast Notifications** — success/error feedback on all actions
- 📱 **Responsive** — sidebar collapses to hamburger on mobile
- ⚡ **Code Splitting** — React.lazy + Suspense for all routes
