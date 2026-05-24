# Bloc Backend

NestJS modular monolith for the Bloc climbing social platform.

## Prerequisites

- Node.js 22+
- Docker & Docker Compose

## Local development

```bash
cp .env.example .env
docker compose up -d postgres redis
npm install
npm run migration:run
npm run start:dev
```

Health check: `GET http://localhost:3000/api/health`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start with hot reload |
| `npm run migration:run` | Run TypeORM migrations |
| `npm run build` | Compile for production |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end tests |

## Infrastructure

AWS CDK stacks live in [`infrastructure/`](infrastructure/). Synth with:

```bash
cd infrastructure && npm install && npm run synth
```

Deploy via GitHub Actions (`Deploy` workflow) or manually with AWS credentials configured.
