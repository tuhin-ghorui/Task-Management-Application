# Task Management Application

A full-stack task management web application built step-by-step with:

- Frontend: React + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB
- Authentication: JWT
- Real-time communication: Socket.IO
- Deployment target: Vercel frontend + Render/Railway backend

## Project Architecture Overview

The app is split into two deployable services:

- `frontend/`: React client responsible for screens, forms, protected routes, and API calls.
- `backend/`: Express API responsible for authentication, task CRUD, database access, JWT validation, and Socket.IO events.

The frontend never talks directly to MongoDB. It sends HTTP requests to the backend API with a JWT access token. The backend validates the token, reads/writes MongoDB through Mongoose models, and optionally broadcasts task changes through Socket.IO.

```txt
Browser / React
  -> REST API requests with JWT
  -> Express backend
  -> Mongoose models
  -> MongoDB

Browser / React
  <-> Socket.IO
  <-> Express + Socket.IO server
```

## Recommended Folder Structure

```txt
Task-Management-Application/
  backend/
    src/
      config/
        db.js
        env.js
      controllers/
        auth.controller.js
        health.controller.js
        task.controller.js
      middleware/
        auth.middleware.js
        error.middleware.js
      models/
        Task.js
        User.js
      routes/
        auth.routes.js
        health.routes.js
        task.routes.js
      utils/
        AppError.js
        jwt.js
      app.js
      server.js
    .env.example
    package.json
  frontend/
```

## Step 1: Backend Initialization And MongoDB Connection

### Goal

Create a production-shaped Express backend that can:

- Load environment variables from `.env`
- Connect to MongoDB using Mongoose
- Expose a health-check route
- Handle unknown routes and errors consistently

### Installation Commands

Run these from the project root:

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, use:

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

Then update `backend/.env` with your real MongoDB connection string.

### How To Test This Step

After `npm run dev`, open:

```txt
http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Task Management API is healthy",
  "environment": "development"
}
```

### Common Mistakes To Avoid

- Do not commit `.env`; commit only `.env.example`.
- Make sure your MongoDB URI includes a database name, for example `/task-management`.
- Keep `server.js` responsible for startup and `app.js` responsible for Express configuration.
- Always call `next(error)` in async controllers so centralized error middleware can respond.

## Step 2: Authentication System

### Goal

Add a JWT authentication system with:

- User registration
- User login
- Password hashing with bcrypt
- Protected routes using `Authorization: Bearer <token>`
- Optional role field for future authorization

### Folder/File Structure

```txt
backend/
  src/
    controllers/
      auth.controller.js
    middleware/
      auth.middleware.js
    models/
      User.js
    routes/
      auth.routes.js
    utils/
      jwt.js
```

### Installation Commands

No new packages are needed in this step because `bcryptjs` and `jsonwebtoken` were installed during backend setup.

If you have not installed dependencies yet:

```powershell
cd backend
npm install
```

### Full Code Added

Key files:

- `src/models/User.js`: defines the user schema and hashes passwords before saving.
- `src/utils/jwt.js`: signs JWTs in one reusable place.
- `src/middleware/auth.middleware.js`: validates bearer tokens and attaches the logged-in user to `req.user`.
- `src/controllers/auth.controller.js`: handles register, login, and current-user responses.
- `src/routes/auth.routes.js`: exposes `/register`, `/login`, and `/me`.

### API Endpoint Examples

Register:

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Tuhin",
  "email": "tuhin@example.com",
  "password": "password123"
}
```

Login:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "tuhin@example.com",
  "password": "password123"
}
```

Get current user:

```http
GET /api/auth/me
Authorization: Bearer YOUR_TOKEN_HERE
```

### Explanation Of The Code

The `User` model stores `name`, `email`, `password`, and `role`. The password field uses `select: false`, so it is not returned by normal queries. Before saving a user, the schema hashes the password with bcrypt.

The login controller explicitly selects the password because comparing the submitted password requires access to the stored hash. If the email or password is wrong, the API returns the same generic error so attackers cannot discover which emails exist.

The `protect` middleware checks for a bearer token, verifies it with the JWT secret, loads the user from MongoDB, and attaches that user to `req.user`. Future task routes will use this to associate tasks with the logged-in user.

### Common Mistakes To Avoid

- Do not store plain-text passwords.
- Do not return the password hash in API responses.
- Do not put the JWT secret in code; keep it in `.env`.
- Always send the token as `Authorization: Bearer <token>`.
- Use a long random `JWT_SECRET` in production.

### How To Test The Feature

Start the backend:

```powershell
cd backend
npm run dev
```

Use Postman, Insomnia, or REST Client:

1. `POST http://localhost:5000/api/auth/register`
2. Copy the returned `token`.
3. `GET http://localhost:5000/api/auth/me`
4. Add header: `Authorization: Bearer <token>`

Expected `/me` response:

```json
{
  "success": true,
  "user": {
    "id": "mongodb_user_id",
    "name": "Tuhin",
    "email": "tuhin@example.com",
    "role": "user"
  }
}
```

## Step 3: Protected Task CRUD API

### Goal

Add task management features that are available only to logged-in users:

- Create tasks
- Read one task or a paginated task list
- Edit tasks
- Delete tasks
- Mark tasks as completed or pending
- Filter by status
- Search by title or description

### Folder/File Structure

```txt
backend/
  src/
    controllers/
      task.controller.js
    models/
      Task.js
    routes/
      task.routes.js
```

### Installation Commands

No new packages are required for this step.

Run the backend:

```powershell
cd backend
npm run dev
```

### Full Code Added

Key files:

- `src/models/Task.js`: defines the MongoDB task schema.
- `src/controllers/task.controller.js`: contains CRUD, search, filter, and pagination logic.
- `src/routes/task.routes.js`: exposes protected task endpoints.
- `src/app.js`: mounts task routes at `/api/tasks`.

### API Endpoint Examples

All task routes require:

```http
Authorization: Bearer YOUR_TOKEN_HERE
```

Create a task:

```http
POST /api/tasks
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "title": "Build task API",
  "description": "Create protected CRUD endpoints",
  "priority": "high",
  "dueDate": "2026-06-15"
}
```

Get tasks:

```http
GET /api/tasks
Authorization: Bearer YOUR_TOKEN_HERE
```

Search, filter, and paginate:

```http
GET /api/tasks?status=pending&search=api&page=1&limit=10
Authorization: Bearer YOUR_TOKEN_HERE
```

Get one task:

```http
GET /api/tasks/TASK_ID
Authorization: Bearer YOUR_TOKEN_HERE
```

Update a task:

```http
PATCH /api/tasks/TASK_ID
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE

{
  "status": "in-progress",
  "priority": "medium"
}
```

Toggle complete:

```http
PATCH /api/tasks/TASK_ID/toggle-complete
Authorization: Bearer YOUR_TOKEN_HERE
```

Delete a task:

```http
DELETE /api/tasks/TASK_ID
Authorization: Bearer YOUR_TOKEN_HERE
```

### Explanation Of The Code

Each task stores a `user` field that references the owner. Every task query includes `user: req.user._id`, which prevents one logged-in user from reading or changing another user's tasks.

The `status` field supports `pending`, `in-progress`, and `completed`. This is more flexible than only storing `completed: true` because the UI can later show columns or filters for different workflow states.

The list endpoint supports:

- `status`: filter tasks by workflow state
- `search`: match text in title or description
- `page` and `limit`: return a manageable page of results

The update controller only accepts approved fields. This prevents clients from changing protected fields like `user`, `_id`, or timestamps.

### Common Mistakes To Avoid

- Do not expose task routes without `protect` middleware.
- Do not query by task ID alone; always include the authenticated user's ID.
- Do not let clients update ownership fields like `user`.
- Validate status values before filtering.
- Keep pagination limits reasonable so one request cannot fetch thousands of records.

### How To Test The Feature

1. Register or log in and copy the returned token.
2. Create a task with `POST /api/tasks`.
3. Fetch tasks with `GET /api/tasks`.
4. Update the task with `PATCH /api/tasks/:id`.
5. Toggle completion with `PATCH /api/tasks/:id/toggle-complete`.
6. Delete it with `DELETE /api/tasks/:id`.

Expected create response:

```json
{
  "success": true,
  "task": {
    "title": "Build task API",
    "description": "Create protected CRUD endpoints",
    "status": "pending",
    "priority": "high",
    "user": "mongodb_user_id"
  }
}
```

## Step 4: Frontend Initialization With React And Tailwind

### Goal

Create the browser-based React frontend with:

- Vite React setup
- Tailwind CSS styling
- Login and registration screens
- JWT session storage
- Protected dashboard route
- Responsive task dashboard connected to the backend API

### Folder/File Structure

```txt
frontend/
  src/
    components/
      AuthLayout.jsx
      FormField.jsx
      ProtectedRoute.jsx
    context/
      AuthContext.jsx
      auth-context.js
      useAuth.js
    lib/
      api.js
    pages/
      Dashboard.jsx
      Login.jsx
      Register.jsx
    App.jsx
    index.css
    main.jsx
  .env.example
  tailwind.config.js
  postcss.config.js
```

### Installation Commands

From the project root:

```powershell
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

The frontend runs at:

```txt
http://localhost:5173
```

### Environment Variables

Create `frontend/.env` from `frontend/.env.example`:

```powershell
Copy-Item .env.example .env
```

Default local values:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Explanation Of The Code

`src/lib/api.js` centralizes API calls and automatically attaches the JWT token from local storage.

`AuthContext.jsx` stores the logged-in user and token, exposes `login`, `register`, and `logout`, and validates an existing token through `/api/auth/me`.

`ProtectedRoute.jsx` blocks dashboard access when no valid session exists.

`Dashboard.jsx` connects to the task API and supports create, edit, delete, toggle complete, search, and status filtering.

Tailwind CSS gives us a mobile-first layout without writing large custom CSS files.

### Common Mistakes To Avoid

- Do not use Expo Go for this project; this is a web app, not React Native.
- Make sure the backend is running on `http://localhost:5000`.
- Make sure MongoDB is connected before testing register/login.
- Frontend environment variables must start with `VITE_`.
- Do not store sensitive secrets in frontend `.env` files.

### How To Test The Feature

Run the frontend:

```powershell
cd frontend
npm run dev -- --host 0.0.0.0
```

Open:

```txt
http://localhost:5173
```

You should see the login screen. Click `Create an account` to view the registration screen.

To test the full flow:

1. Start MongoDB.
2. Start the backend with `npm run dev` inside `backend`.
3. Start the frontend with `npm run dev` inside `frontend`.
4. Register a user.
5. Create, edit, complete, search, filter, and delete tasks from the dashboard.

## Step 5: Real-Time Task Updates With Socket.IO

### Goal

Add live synchronization so task changes update across the same user's open browser tabs or devices.

This step adds:

- Socket.IO server on the backend
- JWT authentication for socket connections
- User-specific socket rooms
- Task event broadcasts after create, update, complete, and delete actions
- Frontend socket listener that refreshes the dashboard automatically

### Folder/File Structure

```txt
backend/
  src/
    socket/
      socket.js
    controllers/
      task.controller.js
    server.js

frontend/
  src/
    lib/
      socket.js
    pages/
      Dashboard.jsx
```

### Installation Commands

No new packages are needed because these were already installed:

```txt
backend: socket.io
frontend: socket.io-client
```

Run both apps:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm run dev -- --host 0.0.0.0
```

### How It Works

The frontend connects to Socket.IO using the same JWT token used for API requests.

The backend verifies that token before allowing the socket connection. After verification, the socket joins a room named after the logged-in user:

```txt
user:<userId>
```

When a task changes, the backend emits one of these events to that user room:

```txt
task:created
task:updated
task:deleted
```

The dashboard listens for those events and refreshes the task list.

### Why User Rooms Matter

Task data is private. Broadcasting every task update to every connected browser would leak information between users.

User-specific rooms let the app sync across the same user's tabs and devices while keeping each user's tasks isolated.

### How To Test The Feature

1. Start MongoDB.
2. Start the backend.
3. Start the frontend.
4. Log in to the app.
5. Open the dashboard in two browser tabs.
6. Create, edit, complete, or delete a task in one tab.
7. The other tab should update automatically.

The dashboard header shows:

```txt
Live sync on
```

If the backend is not running, it shows:

```txt
Live sync off
```

### Common Mistakes To Avoid

- Do not accept unauthenticated socket connections.
- Do not broadcast private task data globally.
- Keep `CLIENT_URL` correct in the backend `.env`, usually `http://localhost:5173`.
- Keep `VITE_SOCKET_URL` correct in the frontend `.env`, usually `http://localhost:5000`.
- Remember that WebSockets require the backend server to be running, not just the frontend.
