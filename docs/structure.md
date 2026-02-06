# Repository Structure

```
.
├── apps
│   ├── api
│   │   ├── src
│   │   │   ├── __tests__
│   │   │   ├── config
│   │   │   ├── controllers
│   │   │   ├── docs
│   │   │   ├── jobs
│   │   │   ├── middleware
│   │   │   ├── models
│   │   │   ├── routes
│   │   │   ├── scripts
│   │   │   ├── services
│   │   │   ├── types
│   │   │   └── utils
│   │   ├── .env.example
│   │   ├── Dockerfile
│   │   ├── jest.config.js
│   │   ├── package.json
│   │   ├── serverless.yml
│   │   └── tsconfig.json
│   └── web
│       ├── public
│       ├── src
│       │   ├── components
│       │   ├── context
│       │   ├── features
│       │   ├── hooks
│       │   ├── layouts
│       │   ├── lib
│       │   └── pages
│       ├── Dockerfile
│       ├── package.json
│       ├── tailwind.config.js
│       └── vite.config.ts
├── packages
│   ├── eslint-config
│   ├── types
│   └── typescript-config
├── docs
├── .github
├── docker-compose.yml
├── package.json
└── turbo.json
```

## Conventions

- API routes, controllers, and models are grouped by domain in apps/api/src.
- Shared types live in packages/types and are consumed by both apps.
- Frontend feature code is colocated under apps/web/src/features, with pages as entry points.
