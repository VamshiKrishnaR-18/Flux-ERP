# Flux ERP - Modern Business Management Solution

Flux ERP is a full-stack Enterprise Resource Planning (ERP) and Customer Relationship Management (CRM) solution designed for modern businesses. Built with scalability and performance in mind, it leverages a Monorepo architecture to manage both the backend API and frontend dashboard seamlessly.

## 🚀 Tech Stack

### Backend (`apps/api`)
*   **Runtime:** Node.js (Express.js)
*   **Database:** MongoDB (Mongoose)
*   **Authentication:** JWT & Cookies (Secure, HTTPOnly)
*   **Security:** Helmet, Rate Limiting, Mongo Sanitize, HPP
*   **Validation:** Zod
*   **Documentation:** Swagger/OpenAPI
*   **Logging:** Winston

### Frontend (`apps/web`)
*   **Framework:** React 19 (Vite)
*   **Styling:** Tailwind CSS + Shadcn/UI (Concepts)
*   **State Management:** TanStack Query (React Query)
*   **Forms:** React Hook Form + Zod
*   **Charts:** Recharts

### Infrastructure
*   **Monorepo:** Turborepo
*   **Containerization:** Docker & Docker Compose
*   **CI/CD:** GitHub Actions

---

## 🛠️ Getting Started

### Prerequisites
*   Node.js >= 18
*   Docker & Docker Compose (Optional, for containerization)
*   MongoDB (Local or Atlas)

### Local Development

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/flux-erp.git
    cd flux-erp
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    *   Copy `.env.example` to `.env` in `apps/api`.
    *   Configure your MongoDB URI and Secrets.

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    This command starts both the API (port 3000) and Web Dashboard (port 5173) concurrently.

---

## 🐳 Docker Deployment

Run the entire stack (API + Database) with a single command:

```bash
docker-compose up -d --build
```

*   **API:** http://localhost:3000
*   **MongoDB:** localhost:27017

---

## 📂 Project Structure

```
├── apps
│   ├── api          # Express Backend
│   └── web          # React Frontend
├── packages
│   ├── eslint-config # Shared ESLint configurations
│   ├── types        # Shared TypeScript interfaces
│   └── typescript-config # Shared TSConfig
└── docker-compose.yml
```

## 🛡️ Security Features
*   **Strict CORS Policy:** Only allows trusted origins.
*   **Secure Cookies:** HTTPOnly, SameSite=Strict.
*   **Input Sanitization:** Prevents NoSQL Injection.
*   **Rate Limiting:** Protects against DDoS/Brute-force.

## 📄 License
MIT
