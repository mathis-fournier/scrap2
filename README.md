# Scrap Main

## Overview

This repository contains a paired backend and frontend application for scraping Vinted listings and delivering live updates to users.

- `server/` contains the backend API, worker, and cron injector.
- `client/` contains the React/Vite dashboard UI.

The system is designed for:

- user registration and login
- storing Vinted session cookies and proxy assignments
- creating keyword trackers
- scanning Vinted for new items via a worker queue
- saving item results in a database
- broadcasting new drops in real time via Socket.IO

---

## Table of Contents

- [Repository Structure](#repository-structure)
- [Backend Architecture](#backend-architecture)
  - [Entry Points](#entry-points)
  - [Routes and Controllers](#routes-and-controllers)
  - [Worker and Cron Flow](#worker-and-cron-flow)
  - [Database](#database)
  - [Environment Variables](#environment-variables)
  - [Run the Backend](#run-the-backend)
- [Frontend Architecture](#frontend-architecture)
  - [Components](#components)
  - [Run the Frontend](#run-the-frontend)
- [Development Guide](#development-guide)
  - [Adding a Backend Route](#adding-a-backend-route)
  - [Adding a Frontend Screen or Component](#adding-a-frontend-screen-or-component)
- [Deployment and PM2](#deployment-and-pm2)
- [Troubleshooting](#troubleshooting)

---

## Repository Structure

```
root
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── README.md
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── workers/
│   │   ├── cron/
│   │   ├── app.js
│   │   ├── index.js
│   │   └── db.js
│   ├── ecosystem.config.js
│   ├── package.json
│   └── .env (not committed)
└── README.md
```

The root README documents the full project. The `client/README.md` is for frontend-specific notes.

---

## Backend Architecture

The backend is located in `server/src/` and is intentionally structured by responsibility.

### Entry Points

- `server/src/index.js`
  - Starts the Express HTTP server.
  - Configures Socket.IO for real-time connections.
  - Subscribes to Redis pub/sub channels to emit socket events.

- `server/src/app.js`
  - Creates the Express app.
  - Applies middleware for CORS and JSON parsing.
  - Mounts the API routes.

### Routes and Controllers

Routes are thin wrappers that delegate work to controller modules.

#### `server/src/routes`

- `authRoutes.js`
  - `POST /api/register`
  - `POST /api/login`

- `settingsRoutes.js`
  - `POST /api/settings`

- `keywordsRoutes.js`
  - `POST /api/keywords`
  - `GET /api/keywords/:targetUserId`
  - `DELETE /api/keywords/:keywordId`

- `itemsRoutes.js`
  - `GET /api/items/:targetUserId`

- `adminRoutes.js`
  - `GET /api/admin/stats`
  - `GET /api/admin/users`
  - `DELETE /api/admin/users/:targetId`

#### `server/src/controllers`

- `authController.js`
  - Handles user registration and login, JWT creation, and password hashing.

- `settingsController.js`
  - Saves Vinted cookies and assigns a proxy from `PROXY_POOL` if needed.

- `keywordController.js`
  - Creates keyword tracker records.
  - Returns a user’s keywords.
  - Deletes a keyword.

- `itemController.js`
  - Returns the latest saved items for a user.

- `adminController.js`
  - Returns dashboard statistics.
  - Lists users and their tracker counts.
  - Deletes user accounts.

### Middleware

- `server/src/middleware/auth.js`
  - Verifies the JWT in `Authorization: Bearer <token>`.
  - Attaches `req.user` on success.
  - Provides `requireAdmin` to protect admin-only routes.

### Services

- `server/src/services/vintedService.js`
  - Contains the `scanVinted()` helper.
  - Calls the Vinted API with cookie and optional proxy.
  - Normalizes response items.
  - Detects session expiration and proxy bans.

### Worker and Cron Flow

The scraping and queueing flow is the key backend feature.

#### `server/src/cron/injector.js`

- Periodically reads active users and their keywords from MySQL.
- Builds a job batch per user.
- Pushes batches into the `vinted-scan-queue` using BullMQ.
- Runs every 30 seconds.

#### `server/src/workers/scraperWorker.js`

- Listens on the BullMQ queue for user batches.
- For each keyword in a batch, it calls `scanVinted()`.
- Handles three outcomes:
  - `SESSION_EXPIRED`: clears the user cookie and publishes a system event.
  - `PROXY_BANNED` or no item: rotates the user proxy if available.
  - Success: inserts a new item into MySQL and publishes a new-item event.
- Uses Redis pub/sub to signal the real-time socket server.

### Database

The backend shares a single MySQL pool in `server/src/db.js`.

Data tables are expected to include at least:

- `users`
  - `id`, `email`, `password`, `role`
  - `vinted_cookie`, `proxy_url`, `user_agent`, `created_at`

- `keywords`
  - `id`, `user_id`, `name`, `min_price`, `max_price`, `api_url`

- `items`
  - `id`, `user_id`, `keyword_id`, `title`, `price`, `url`, `image_url`, `brand`, `size`

The code uses `mysql2/promise` and a connection pool.

### Environment Variables

The backend expects these variables from `.env`:

- `PORT` — HTTP server port (default `3000`).
- `JWT_SECRET` — secret for JWT signing.
- `DB_HOST` — MySQL host.
- `DB_USER` — MySQL user.
- `DB_PASSWORD` — MySQL password.
- `DB_NAME` — MySQL database name.
- `REDIS_URL` — Redis connection string for pub/sub and BullMQ.
- `PROXY_POOL` — comma-separated list of proxy URLs.

> Note: `.env` should not be committed. Keep it local and secure.

### Run the Backend

From `server/`:

```bash
npm install
npm run dev
```

For production / process-managed startup:

```bash
pm install
pm start
```

The repo also provides `server/ecosystem.config.js` for PM2.

---

## Frontend Architecture

The frontend is a React/Vite app in `client/`.

### Entry Points

- `client/src/main.jsx`
  - Bootstraps React and mounts the app.

- `client/src/App.jsx`
  - Renders the `Panel` component.

- `client/src/components/Panel.jsx`
  - Light wrapper that chooses between authentication and dashboard screens.

### Key Components

- `AuthScreen.jsx`
  - Login and registration form.
  - Stores JWT, user ID, and role in `localStorage`.

- `Dashboard.jsx`
  - Main user dashboard.
  - Connects to Socket.IO to receive new item events.
  - Loads keywords and items from the backend.
  - Supports settings, keyword creation, item views, and admin views.

- `ItemCards.jsx`
  - Displays scraped items in a card layout.

### Shared Client Services

- `client/src/services/api.js`
  - Centralizes the base API URL.
  - Builds authentication headers for requests.

### What the UI Does

- allows users to register and sign in
- stores user token and identity locally
- lets users save their Vinted session cookie
- lets users add keyword trackers with optional price filters
- displays scraped items in a live dashboard
- notifies users when their cookie expires
- provides admin tools for user and system management

### Run the Frontend

From `client/`:

```bash
npm install
npm run dev
```

To build for production:

```bash
npm run build
```

---

## Development Guide

This project is organized to make it easy to find the right file when adding features.

### Adding a Backend Route

1. Add a new route file in `server/src/routes/`.
2. Add a controller in `server/src/controllers/`.
3. If needed, add reusable logic in `server/src/services/`.
4. Import the route in `server/src/app.js` and mount it.
5. Add middleware in `server/src/middleware/` if authorization is required.

Example:

- `routes/newRoute.js`
- `controllers/newController.js`
- `app.use('/api', newRoute)`

### Adding a Frontend Screen or Component

1. Add a new component in `client/src/components/`.
2. If shared API logic is needed, add or extend `client/src/services/api.js`.
3. Import and render the component in `Panel.jsx`, or add a new route/page if routing is introduced.
4. Use `useState`, `useEffect`, and fetch the backend with `authFetch()` or `fetch()`.

---

## Deployment and PM2

The backend includes `server/ecosystem.config.js` to start three processes:

- `finder-api` — the web API and Socket.IO server.
- `finder-cron` — the batch injector that pushes work into the queue.
- `finder-worker` — the worker that performs Vinted scanning.

Start the full backend stack with:

```bash
cd server
pm install
pm start
pm install -g pm2
pm2 start ecosystem.config.js
```

If a process keeps failing, use:

```bash
pm2 logs
pm2 monit
pm2 delete all
```

---

## Troubleshooting

### Port Already in Use

If the API fails to start with `EADDRINUSE :3000`, another process is occupying port `3000`.

- Find the process: `netstat -ano | findstr :3000`
- Stop the process: `taskkill /PID <pid> /F`

### PM2 Old Configs

If PM2 still references deleted files, restart it cleanly:

```bash
pm2 delete all
pm2 start ecosystem.config.js
```

### Redis / MySQL Errors

- Verify `REDIS_URL` is correct and Redis is reachable.
- Verify MySQL credentials and `DB_NAME` are correct.
- Ensure the database tables exist with the expected fields.

### Frontend Build

If Vite fails, run:

```bash
cd client
npm install
npm run build
```

If the UI cannot connect to the API, confirm the API is running on the expected port and CORS is configured.

---

## Notes for New Contributors

- The codebase is intentionally separated into small, single-purpose modules.
- Use the `routes/controllers/services` pattern in the backend.
- Keep UI state in React hooks inside `Dashboard.jsx` and split large render sections into smaller components when needed.
- Document any new environment variables in this README.
- Avoid committing sensitive `.env` values.

Happy coding! If you want, I can also add a second guide that explains the database schema and Redis/BullMQ flow in even more detail.
