# Flux ERP - Modern Business Management Solution

Flux ERP is a full-stack Enterprise Resource Planning (ERP) and Customer Relationship Management (CRM) solution designed for modern businesses. Built with scalability and performance in mind, it leverages a Monorepo architecture to manage both the backend API and frontend dashboard seamlessly.

## ✨ Portfolio Highlights

This project is built to demonstrate production-grade software engineering practices, featuring:

*   **🛡️ Demo Mode (Mock Environment):** A sophisticated Axios interceptor strategy that allows the entire application to be explored with simulated data. Perfect for showcasing features without a live database.
*   **🤖 Flux AI Advisor:** Integration with **Groq (Llama 3)** to provide real-time business intelligence. It uses a **RAG (Retrieval-Augmented Generation)** pattern to analyze business snapshots and provide context-aware insights.
*   **💬 Intelligent Chatbot:** A floating AI assistant that answers questions about clients, invoices, and financial trends using the current business context.
*   **♿ Accessibility Hardening:** WCAG-compliant form elements, ARIA roles, and keyboard navigation support.
*   **📊 Dynamic Reporting:** Real-time charts and metrics powered by Recharts, with customizable dashboard widgets.

---

## 🚀 Tech Stack

### Backend (`apps/api`)
*   **Runtime:** Node.js (Express.js)
*   **Database:** MongoDB (Mongoose)
*   **Authentication:** Clerk (Identity & Access Management)
*   **AI:** Groq SDK (Llama 3.3 70B)
*   **Security:** Helmet, Rate Limiting, Mongo Sanitize, HPP
*   **Validation:** Zod
*   **Documentation:** Swagger/OpenAPI

### Frontend (`apps/web`)
*   **Framework:** React 19 (Vite)
*   **Styling:** Tailwind CSS + Modern UI/UX patterns
*   **State Management:** TanStack Query (React Query)
*   **Authentication:** Clerk React SDK
*   **Charts:** Recharts
*   **Animations:** Framer Motion

---

## 🛠️ Getting Started

### Prerequisites
*   Node.js >= 18
*   Docker & Docker Compose (Optional)
*   Groq API Key (for AI features)
*   Clerk API Keys (for authentication)

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
    *   **Backend:** Copy `apps/api/.env.example` to `apps/api/.env` and add your keys.
    *   **Frontend:** Copy `apps/web/.env.example` to `apps/web/.env` and configure the API URL.

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    This command starts both the API (port 3001) and Web Dashboard (port 5173) concurrently using Turborepo.

---

## 💡 Demo Mode

If you don't want to set up a database, you can toggle **Demo Mode** from the sidebar. 
*   **Request Hijacking:** API calls are intercepted and return high-fidelity mock data from `mockData.ts`.
*   **AI Pass-through:** Even in Demo Mode, the AI Advisor works by sending a "Demo Snapshot" to the backend, allowing you to interact with the AI using simulated data.

---

## 🐳 Docker Deployment

Run the entire stack (API + Database) with a single command:

```bash
docker-compose up -d --build
```

*   **API:** http://localhost:3000
*   **MongoDB:** localhost:27017

---

## ☁️ AWS Deployment

*   **API Base URL:** https://eoyai58be6.execute-api.ap-south-2.amazonaws.com/dev/


---
## ▲ Vercel Deployment

*   **Web App:** https://flux-erp-web.vercel.app/

---



```
├── apps
│   ├── api          # Express Backend
│   └── web          # React Frontend
├── packages
│   ├── eslint-config # Shared ESLint configurations
│   ├── types        # Shared TypeScript interfaces
│   └── typescript-config # Shared TSConfig
├── docs
└── docker-compose.yml
```

## 📚 Documentation

- [Repository Structure](./docs/structure.md)
- [Testing](./docs/testing.md)

## ✅ Common Scripts

```bash
npm run dev
npm run build
npm run lint
npm run check-types
npm run test
```

## 🛡️ Security Features
*   **Strict CORS Policy:** Only allows trusted origins.
*   **Secure Cookies:** HTTPOnly, SameSite=Strict.
*   **Input Sanitization:** Prevents NoSQL Injection.
*   **Rate Limiting:** Protects against DDoS/Brute-force.

## 📄 License
MIT
/////