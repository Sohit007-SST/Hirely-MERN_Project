# Hirely

**Post the work. Pick the right bid.**

Hirely is a small freelance marketplace built with the MERN stack (MongoDB, Express, React, Node.js).
Clients post gigs with a budget in ₹, freelancers bid on them, the client hires one bid and a private
real-time chat opens between the two. When the work is done both sides review each other. Gemini AI helps
freelancers write proposals and helps clients turn rough notes into a clear gig description.

End-term project for **Term 5: Building Web Applications using MERN**.
Author: **Sohit Kumar Nagar**

---

## Features

- **Accounts and roles**: register as a client or freelancer, JWT login, bcrypt-hashed passwords, admin role (seeded only).
- **Gigs**: post, edit (while open), delete, mark complete; full-text search, category / budget filters, sorting and pagination, all kept in the URL.
- **Bids**: one bid per freelancer per gig, withdraw and re-bid, compare bids, "Hire for ₹X". Hiring auto-rejects every other pending bid.
- **Real-time chat**: opens automatically on hire. Messages are saved in MongoDB, with typing indicator, online status, unread counts and "Load older messages".
- **Live notifications**: bids, hires, rejections, comments, saves, follows, reviews and offline messages, pushed over Socket.io and created through a Node `EventEmitter`.
- **Social**: follow / unfollow users, save (like) gigs, public Q&A comments on gigs, 1–5 star reviews with a live rating average.
- **AI helpers (Gemini)**: "Write proposal with Gemini" for freelancers and "Improve with Gemini" for clients. The output only fills the textarea, so it can be edited before sending.
- **Profiles**: avatar upload to Cloudinary, headline, bio, skills, hourly rate, follower counts, reviews.
- **Dashboards**: the client sees gigs taking bids, in progress and completed; the freelancer sees pending bids, hires and earnings.
- **Admin**: platform stats (aggregation pipelines) and a searchable users table with suspend / restore.
- **Design**: the marigold price "swing-tag" on every budget, full dark mode, responsive down to 360 px, keyboard focus and reduced-motion support.

---

## Syllabus coverage

| Session | Topic | Where to find it in Hirely |
|---|---|---|
| MERN-1 | Node.js, event-driven architecture, modules, `http` | `server/src/server.js` (`http.createServer(app)`), `server/src/events/appEvents.js` (EventEmitter singleton), `server/src/events/listeners.js` (`notify` listener), `appEvents.emit('notify', …)` in `server/src/controllers/{gig,bid,review,user,chat}Controller.js` |
| MERN-2 | Express | `server/src/app.js` (middleware chain, one router per resource), `server/src/routes/*.js` |
| MERN-3 | MongoDB + Mongoose CRUD | `server/src/config/db.js`, full gig CRUD in `server/src/controllers/gigController.js` |
| MERN-4 | MVC architecture | `server/src/models/` (Model), `server/src/controllers/` (Controller), `server/src/routes/` (routing), React pages in `client/src/pages/` (View) |
| MERN-5 | Full-stack scaffold | `server/` (Express API) + `client/` (React + Vite) in one repo, root `package.json` helper scripts |
| MERN-6 | Models and data flow | 7 models in `server/src/models/` (`User, Gig, Bid, Review, Conversation, Message, Notification`) with validation, refs and indexes |
| MERN-7 | JWT auth and authorization | `server/src/middlewares/auth.js` (`protect`, `authorize(...roles)`), `server/src/utils/generateToken.js`, bcrypt hook in `server/src/models/User.js`, `server/src/controllers/authController.js`; client `client/src/context/AuthContext.jsx`, `client/src/components/ProtectedRoute.jsx` |
| MERN-8 | Reusable controllers, custom middleware, Cloudinary | `server/src/utils/asyncHandler.js`, `server/src/utils/ApiError.js`, `server/src/middlewares/{validate,errorHandler,upload}.js`, `server/src/validators/index.js`, `server/src/config/cloudinary.js`, avatar upload in `server/src/controllers/userController.js`, `client/src/pages/Settings.jsx` |
| MERN-9 | Posts API + dynamic feed | Gigs API with search, filters, sort and pagination in `server/src/controllers/gigController.js`, `server/src/utils/pagination.js`; `client/src/pages/Gigs.jsx`, `client/src/pages/GigDetails.jsx`, `client/src/components/GigCard.jsx` |
| MERN-10 | Follow / unfollow | `followUser` in `server/src/controllers/userController.js`, `followers` / `following` on `User`; Follow button and counts in `client/src/pages/Profile.jsx` |
| MERN-11 | Like + comment APIs | `toggleLike`, `addComment`, `deleteComment` in `server/src/controllers/gigController.js`; reviews in `server/src/controllers/reviewController.js` + `Review.calcAverage` aggregation in `server/src/models/Review.js`; `client/src/pages/GigDetails.jsx`, `client/src/components/StarRating.jsx` |
| MERN-12 | Socket.io messaging + notifications | `server/src/socket/index.js` (JWT handshake, user rooms, online map), `server/src/events/listeners.js`, `client/src/context/SocketContext.jsx`, `client/src/pages/Notifications.jsx` |
| MERN-13 | Finished chat, edge cases, persistence | `server/src/controllers/chatController.js` (persisted messages, unread aggregation, cursor pagination, read marking), `server/src/models/{Conversation,Message}.js`, `client/src/pages/Chat.jsx` (typing indicator, online status, unread badges, load older, dedupe) |
| MERN-14 | Performance | `React.lazy` + `Suspense` in `client/src/App.jsx`, `manualChunks` in `client/vite.config.js`, `memo` in `client/src/components/GigCard.jsx`, `client/src/utils/useDebounce.js`, `loading="lazy"` in `client/src/components/Avatar.jsx`; server `compression` in `app.js`, `server/src/middlewares/cache.js`, indexes in the models, `.lean()`, `select('-comments')` and `Promise.all` in the controllers |
| MERN-15 | Gemini API + prompt engineering | `server/src/controllers/aiController.js` (REST call with `fetch`, two structured prompts), `server/src/routes/aiRoutes.js` (per-user AI rate limit); "Write proposal with Gemini" in `client/src/pages/GigDetails.jsx`, "Improve with Gemini" in `client/src/pages/GigForm.jsx` |
| MERN-16 | Deployment, env vars, CI/CD | `render.yaml`, `client/vercel.json`, `server/.env.example`, `client/.env.example`, `.github/workflows/ci.yml`, `server/scripts/check.js`, required-env check in `server/src/server.js` |

Every file uses short `// Session N:` comments at the point where a concept is used.

---

## Tech stack

| Part | Libraries |
|---|---|
| Server (`server/`, CommonJS, Node ≥ 18) | express 4, mongoose 8, socket.io 4, jsonwebtoken 9, bcryptjs 2, dotenv, cloudinary 2, multer 2, express-validator 7, helmet 7, cors, compression, morgan, express-rate-limit 7, nodemon (dev). Gemini is called with the built-in `fetch`. |
| Client (`client/`, ES modules) | react 18, react-dom 18, react-router-dom 6, vite 5, @vitejs/plugin-react, axios, socket.io-client 4, react-hot-toast. Plain CSS in one `index.css` with CSS variables. |

---

## Getting started

### Prerequisites
- Node.js 18 or newer
- A MongoDB database: a local `mongod` or a free MongoDB Atlas cluster

### 1. Install
```bash
git clone <your-repo-url> hirely
cd hirely
npm run install:all          # installs server/ and client/
```

### 2. Configure
```bash
cp server/.env.example server/.env     # then fill in MONGO_URI and JWT_SECRET
cp client/.env.example client/.env     # defaults work for local development
```

### 3. Seed demo data (optional but recommended)
```bash
npm run seed
```
This wipes every collection and prints the demo logins:

| Role | Email | Password |
|---|---|---|
| Admin | admin@hirely.dev | admin123 |
| Client | priya@client.dev | password123 |
| Client | rahul@client.dev | password123 |
| Freelancer | aman@freelancer.dev | password123 |
| Freelancer | neha@freelancer.dev | password123 |
| Freelancer | karan@freelancer.dev | password123 |

### 4. Run
```bash
npm run dev:server     # API + Socket.io on http://localhost:5000
npm run dev:client     # React app on http://localhost:5173
```

Other scripts: `npm run check` in `server/` (CI smoke check), `npm run build` and `npm run preview` in `client/`.

---

## Environment variables

### `server/.env`
| Variable | Required | Example | Notes |
|---|---|---|---|
| `PORT` | no | `5000` | |
| `NODE_ENV` | no | `development` | stack traces are only returned for development 500s |
| `CLIENT_URL` | no | `http://localhost:5173,http://localhost:4173` | comma-separated allowed origins for CORS and Socket.io (4173 = `vite preview`) |
| `MONGO_URI` | **yes** | `mongodb://127.0.0.1:27017/hirely` | the server exits with a clear message if missing |
| `JWT_SECRET` | **yes** | a long random string | the server exits with a clear message if missing |
| `JWT_EXPIRES_IN` | no | `7d` | |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | no | | without them avatar upload returns 503 with a clear message |
| `GEMINI_API_KEY` | no | | without it the AI endpoints return 503: "AI is not configured. Add GEMINI_API_KEY to the server .env" |
| `GEMINI_MODEL` | no | `gemini-2.5-flash` | |

### `client/.env`
| Variable | Default | Notes |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` | |
| `VITE_SOCKET_URL` | the API URL without `/api` | |

---

## Deployment

### API on Render
1. Push the repo to GitHub.
2. In Render choose **New → Blueprint** and select the repo. `render.yaml` creates the `hirely-api` web service (`rootDir: server`, `npm install`, `npm start`, health check `/api/health`) and generates `JWT_SECRET`.
3. Fill in the secrets Render asks for: `MONGO_URI` (Atlas; allow access from anywhere `0.0.0.0/0` or Render's IPs), `CLIENT_URL` (your Vercel URL), and optionally the Cloudinary and Gemini keys.
4. Run the seed once from your machine against the Atlas URI if you want demo data: `MONGO_URI="<atlas uri>" npm run seed --prefix server`.

### Client on Vercel
1. **New Project** → import the repo → set **Root Directory** to `client` (framework preset: Vite).
2. Environment variables: `VITE_API_URL=https://<render-app>.onrender.com/api`, `VITE_SOCKET_URL=https://<render-app>.onrender.com`.
3. Deploy. `client/vercel.json` rewrites every route to `index.html` so React Router deep links work.
4. Add the Vercel URL to `CLIENT_URL` on Render (comma-separated) and redeploy the API.

### CI
`.github/workflows/ci.yml` runs on every push to `main` and every pull request, with two jobs on Node 20:
- **server**: `npm install` then `npm run check` (loads the app, every router, the socket and the listeners without a database)
- **client**: `npm install` then `npm run build`

---

## API reference

Base path `/api`. Responses are `{ success: true, ... }` or `{ success: false, message }`. 🔒 = needs `Authorization: Bearer <token>`.

| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/health` | public | `{ status: 'ok', uptime }` |
| POST | `/auth/register` | public | role `client` or `freelancer` only |
| POST | `/auth/login` | public | suspended users get 403 |
| GET | `/auth/me` | 🔒 | |
| GET | `/users/freelancers?q=&skill=&page=` | public | sorted by rating |
| PUT | `/users/me` | 🔒 | name, headline, bio, skills, hourlyRate, location |
| PUT | `/users/me/avatar` | 🔒 | multipart field `avatar`, images only, ≤ 2 MB |
| GET | `/users/:id` | public (+ optional auth) | counts, `isFollowing`, stats |
| GET | `/users/:id/reviews` | public | |
| POST | `/users/:id/follow` | 🔒 | toggle |
| GET | `/gigs?q=&category=&status=&minBudget=&maxBudget=&skill=&sort=&page=&limit=` | public, cached 30 s | sort: `newest`, `oldest`, `budget-high`, `budget-low`, `popular` |
| POST | `/gigs` | 🔒 client | |
| GET | `/gigs/mine` | 🔒 client | |
| GET | `/gigs/:id` | public | |
| PUT | `/gigs/:id` | 🔒 owner | only while open |
| DELETE | `/gigs/:id` | 🔒 owner or admin | not while in progress (admin can); deletes its bids |
| PATCH | `/gigs/:id/complete` | 🔒 owner | only from in progress |
| POST | `/gigs/:id/like` | 🔒 | toggle |
| POST | `/gigs/:id/comments` | 🔒 | |
| DELETE | `/gigs/:id/comments/:commentId` | 🔒 | author, gig owner or admin |
| GET | `/gigs/:id/bids` | 🔒 | owner/admin see all; a freelancer sees their own |
| POST | `/gigs/:id/bids` | 🔒 freelancer | re-activates a withdrawn bid |
| GET | `/bids/mine` | 🔒 freelancer | |
| PATCH | `/bids/:id/accept` | 🔒 gig owner | rejects the other bids, starts the chat, returns `conversationId` |
| PATCH | `/bids/:id/withdraw` | 🔒 bid owner | only pending bids |
| POST | `/reviews` | 🔒 | `{ gigId, rating, comment }`, only after completion |
| GET | `/reviews/gig/:gigId/mine` | 🔒 | |
| GET / POST | `/chat/conversations` | 🔒 | list with unread counts / find or create `{ userId, gigId? }` |
| GET | `/chat/conversations/:id/messages?before=` | 🔒 participant | 30 per page, oldest first, `hasMore` |
| POST | `/chat/conversations/:id/messages` | 🔒 participant | saved, then emitted |
| GET | `/notifications` | 🔒 | latest 40 + `unreadCount` |
| PATCH | `/notifications/read-all`, `/notifications/:id/read` | 🔒 | |
| POST | `/ai/proposal` | 🔒 freelancer | `{ gigId, notes? }`, 20 requests / 15 min per user |
| POST | `/ai/gig-description` | 🔒 client | `{ title, description, category }` |
| GET | `/admin/stats`, `/admin/users?q=&page=` | 🔒 admin | |
| PATCH | `/admin/users/:id/ban` | 🔒 admin | toggle; admins can't be suspended |

### Socket.io events

Connect with `io(SOCKET_URL, { auth: { token } })`. The server verifies the JWT and rejects missing or suspended users.

| Event | Direction | Payload |
|---|---|---|
| `users:online` | server → everyone | array of online user ids |
| `conversation:join` | client → server | `conversationId` (participants only), ack `{ ok }` |
| `conversation:leave` | client → server | `conversationId` |
| `typing:start` / `typing:stop` | client → server → the other participant | `{ conversationId }` → `{ conversationId, userId }` |
| `message:new` | server → every participant's `user:<id>` room | the saved message |
| `notification:new` | server → `user:<id>` | the saved notification |

---

## Folder structure

```
hirely/
├── package.json                 root helper scripts (install:all, dev:server, dev:client, seed)
├── README.md
├── .gitignore
├── render.yaml                  Render blueprint for the API
├── .github/workflows/ci.yml
├── server/
│   ├── package.json             start, dev, seed, check
│   ├── .env.example
│   ├── scripts/
│   │   ├── seed.js              demo data (wipes collections first)
│   │   └── check.js             loads app, routers, socket, listeners (used by CI)
│   └── src/
│       ├── server.js            dotenv → connectDB → http server → initSocket → listeners → listen
│       ├── app.js               express app, exports { app, allowedOrigins }
│       ├── config/              db.js, cloudinary.js
│       ├── models/              User, Gig, Bid, Review, Conversation, Message, Notification
│       ├── controllers/         auth, user, gig, bid, review, chat, notification, ai, admin
│       ├── routes/              one router per resource
│       ├── middlewares/         auth, validate, errorHandler, upload, cache
│       ├── validators/index.js  express-validator rule arrays
│       ├── events/              appEvents.js (EventEmitter), listeners.js
│       ├── socket/index.js      initSocket, getIO, isOnline
│       └── utils/               ApiError, asyncHandler, generateToken, pagination (+ escapeRegex)
└── client/
    ├── package.json, vite.config.js, index.html, vercel.json, .env.example
    ├── public/favicon.svg
    └── src/
        ├── main.jsx, App.jsx, index.css
        ├── api/axios.js
        ├── context/             AuthContext.jsx, SocketContext.jsx
        ├── components/          Navbar, ProtectedRoute, Loader, Avatar, PriceTag, StatusPill,
        │                        StarRating, Pagination, EmptyState, GigCard
        ├── pages/               Home, Login, Register, Gigs, GigDetails, GigForm, Freelancers,
        │                        Profile, Settings, Dashboard, Chat, Notifications, Admin, NotFound
        └── utils/               format.js, useDebounce.js
```

---

## Author

**Sohit Kumar Nagar**, Term 5: Building Web Applications using MERN.
