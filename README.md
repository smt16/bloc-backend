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

## Auth

JWT validation is Auth0 JWKS-based (see `src/modules/auth`). Email/password is proxied through the API so the mobile client never holds a client secret:

| Endpoint | Auth | Notes |
|----------|------|-------|
| `POST /api/auth/login` | Public | Auth0 password-realm grant |
| `POST /api/auth/register` | Public | Auth0 `/dbconnections/signup` then login |
| `POST /api/auth/refresh` | Public | Refresh tokens from the password-grant client |
| `POST /api/auth/forgot-password` | Public | Auth0 change-password email |
| `GET /api/auth/me` | Bearer | Claims from access token |

Set on the API (confidential Auth0 **Regular Web** app with **Password** grant
enabled — **not** the Native mobile app used for Google/Apple):

```bash
AUTH0_CLIENT_ID=          # e.g. 8oqNt0iheLlVRdYtciSNA91rP6C0JIom
AUTH0_CLIENT_SECRET=      # Regular Web app → Credentials → Client Secret
AUTH0_DB_CONNECTION=Username-Password-Authentication
```

On that Regular Web app in the Auth0 Dashboard, also set (Auth0 requires these
even though the Nest API does not use browser redirects for password login):

| Setting | Value |
|---------|--------|
| Allowed Callback URLs | `http://localhost:3000/callback` |
| Allowed Logout URLs | `http://localhost:3000` |
| Grant Types | **Password**, Authorization Code, Refresh Token |
| Connections | Database (`Username-Password-Authentication`) enabled |

Leave the **Native** app’s callbacks (`com.bloc://…`) alone — those are what
Google / Apple Sign In use from the Expo app.

Google / Apple Sign In stay on the mobile Native app (PKCE + `connection=…`); the backend only validates the resulting JWTs.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start with hot reload |
| `npm run migration:run` | Run TypeORM migrations |
| `npm run build` | Compile for production |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end tests |

## Infrastructure

AWS CDK stacks live in [`infrastructure/`](infrastructure/) for when you're ready to provision environments. Not wired into CI yet — synth locally with:

```bash
cd infrastructure && npm install && npm run synth
```
