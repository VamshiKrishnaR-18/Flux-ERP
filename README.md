# Flux ERP - College/Placement Assignment

Flux ERP is a full-stack MERN application built for college placement assignments, featuring a modern React.js frontend, Node.js + Express.js backend, MongoDB database, and full CRUD operations for clients, products, invoices, and more.

---

## 🚀 Tech Stack

### Backend (`apps/api`)
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB (Mongoose ODM)
*   **Security:** Helmet, CORS, Rate Limiting, Mongo Sanitize, HPP
*   **Validation:** Zod
*   **Documentation:** Swagger/OpenAPI

### Frontend (`apps/web`)
*   **Framework:** React 19 (Vite)
*   **Styling:** Tailwind CSS
*   **State Management:** TanStack Query (React Query)
*   **Charts:** Recharts

---

## 🛠️ Local Development Setup

### Prerequisites
*   Node.js >= 18
*   MongoDB Atlas account (for cloud database) or local MongoDB

### Installation Steps

1.  **Clone the repository**
    ```bash
    git clone https://github.com/VamshiKrishnaR-18/Flux-ERP.git
    cd Flux-ERP
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Setup MongoDB Atlas**
    - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
    - Create a free account and a new cluster
    - Create a database user and get your connection string (URI)
    - Allow your IP address in the network access settings

4.  **Environment Setup**
    *   **Backend:** Copy `apps/api/.env.example` to `apps/api/.env`
    *   Update the `MONGO_URI` with your MongoDB Atlas connection string
    *   **Frontend:** Copy `apps/web/.env.example` to `apps/web/.env`
    *   For local development, keep `VITE_API_URL` as `http://localhost:3001`

5.  **Run Development Servers**
    ```bash
    npm run dev
    ```
    This starts:
    - API on http://localhost:3001
    - Frontend on http://localhost:5173

6.  **(Optional) Seed the Database**
    ```bash
    cd apps/api
    npm run seed
    ```

---

## ☁️ Deployment

### Backend Deployment on Render

1.  Push your code to GitHub
2.  Go to [Render](https://render.com) and sign up using your GitHub account
3.  Create a new **Web Service** and connect your repository
4.  Configure the service:
    - **Root Directory:** `apps/api`
    - **Runtime:** Node
    - **Build Command:** `npm install && npm run build`
    - **Start Command:** `npm start`
    - **Branch:** `main`
5.  Add environment variables in Render dashboard (use `apps/api/.env.example` as reference):
    - `MONGO_URI`: Your MongoDB Atlas connection string
    - `PORT`: 10000 (Render's default)
    - `NODE_ENV`: production
    - `CORS_ORIGIN`: Your Vercel frontend URL
6.  Deploy and copy your Render API URL

### Frontend Deployment on Vercel

1.  Go to [Vercel](https://vercel.com) and sign up using your GitHub account
2.  Import your repository
3.  Configure project settings:
    - **Root Directory:** `apps/web`
    - **Framework Preset:** Vite
4.  Add environment variable in Vercel dashboard:
    - `VITE_API_URL`: Your Render API URL (e.g., `https://your-api.onrender.com`)
5.  Deploy your application!

---

## 📁 Project Structure

```
├── apps
│   ├── api          # Express Backend
│   │   ├── src
│   │   │   ├── controllers  # Route handlers
│   │   │   ├── models       # Mongoose schemas
│   │   │   ├── routes       # API routes
│   │   │   ├── middleware   # Express middleware
│   │   │   ├── utils        # Utility functions
│   │   │   └── server.ts    # Entry point
│   │   └── package.json
│   └── web          # React Frontend
│       ├── src
│       │   ├── components   # Reusable UI components
│       │   ├── features     # Feature-specific modules
│       │   ├── pages        # Page components
│       │   └── lib          # Utilities & configurations
│       └── package.json
└── package.json
```

## ✅ Available Scripts

### Root
- `npm run dev`: Start both frontend and backend dev servers
- `npm run build`: Build both frontend and backend
- `npm run lint`: Run ESLint
- `npm run test`: Run all tests

### Backend (apps/api)
- `npm run dev`: Start dev server on port 3001
- `npm run build`: Compile TypeScript
- `npm start`: Start production server
- `npm run seed`: Seed the database
- `npm run test`: Run Jest tests

### Frontend (apps/web)
- `npm run dev`: Start dev server on port 5173
- `npm run build`: Build for production
- `npm run test`: Run tests

---

## 📄 License
MIT
//////