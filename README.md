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
      middleware/
        auth.middleware.js
        error.middleware.js
      models/
        User.js
      routes/
        auth.routes.js
        health.routes.js
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
