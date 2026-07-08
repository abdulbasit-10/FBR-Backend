# FBR Sales Tax Digital Invoicing System — Backend

Node.js / Express / TypeScript / MySQL backend for the **FBR (PRAL) Digital
Invoicing** system. Built strictly against the module list in the internal
scope document (`FBR.docx`):

> Authentication · Company · Customer · Product · Invoice · Dashboard ·
> Reports · FBR Integration · Lookup · Database Design · API Logs ·
> Error Handling · Security · Queue System · Swagger

---

## 🏗 Architecture

```
React Frontend
      │  REST APIs
Node.js + Express + TypeScript
      │  Business Logic
    MySQL (Sequelize)
      │
FBR / PRAL Digital Invoicing APIs
```

---

## 📁 Project Structure

```
FBR/
├── src/
│   ├── config/                # env loader + Swagger spec
│   ├── controllers/           # thin HTTP handlers, one per module
│   ├── database/
│   │   ├── connection.ts      # Sequelize instance
│   │   ├── config.js          # sequelize-cli config
│   │   ├── migrations/        # schema migrations
│   │   └── seeders/           # roles/permissions + superadmin
│   ├── middlewares/           # authenticate, authorize, validate,
│   │                          # errorHandler, httpLogger, apiLogger (DB audit)
│   ├── models/                # Sequelize models (index.ts wires associations)
│   ├── routes/                # one router per module, mounted from routes/index.ts
│   ├── services/              # business logic
│   │   ├── auth.service.ts
│   │   ├── jwt.service.ts
│   │   ├── company.service.ts
│   │   ├── customer.service.ts
│   │   ├── product.service.ts
│   │   ├── invoice.service.ts     # + in-process queue
│   │   ├── dashboard.service.ts
│   │   ├── report.service.ts
│   │   ├── lookup.service.ts      # FBR reference cache
│   │   ├── fbr-client.service.ts  # HTTP client to gw.fbr.gov.pk
│   │   ├── fbr-token.service.ts
│   │   ├── user.service.ts        # users, roles, permissions
│   │   ├── setting.service.ts
│   │   ├── notification.service.ts
│   │   ├── api-log.service.ts
│   │   └── queue.service.ts       # generic retry/backoff queue
│   ├── types/                 # global TS augmentations
│   ├── utils/                 # logger, AppError, pagination, encryption, apiResponse
│   ├── validators/            # Joi schemas per module
│   ├── app.ts                 # Express app assembly
│   └── server.ts              # HTTP server bootstrap
├── nodemon.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Install dependencies
```powershell
npm install
```

### 2. Configure environment
```powershell
Copy-Item .env.example .env
```
Fill in:
- **MySQL** credentials (`DB_*`)
- **JWT secrets** — long random strings (min 32 chars each)
- **ENCRYPTION_KEY** — exactly 32 chars (AES-256 for FBR token storage)

### 3. Create the database
```sql
CREATE DATABASE fbr_invoicing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Run migrations + seed defaults
```powershell
npm run db:migrate
npm run db:seed
```

### 5. Run in development
```powershell
npm run dev
```
- Server: `http://localhost:3000`
- Health: `GET /health`
- API root: `GET /api/v1`
- Swagger docs: `GET /api/v1/docs`

### 6. Build for production
```powershell
npm run build
npm start
```

---

## 📦 Module Map

| # | Spec Module | Endpoint(s) | File(s) |
|---|-------------|-------------|---------|
| 1 | Authentication | `POST /auth/login`, `/refresh`, `/logout`, `/logout-all`, `GET /auth/me`, `POST /auth/change-password` | `services/auth.service.ts`, `services/jwt.service.ts` |
| 2 | Company APIs | `GET/POST/PUT/DELETE /companies` | `company.*` |
| 3 | Customer APIs | `GET/POST/PUT/DELETE /customers` | `customer.*` |
| 4 | Product APIs | `GET/POST/PUT/DELETE /products` | `product.*` |
| 5 | Invoice APIs | `GET/POST/PUT/DELETE /invoices` + `POST /invoices/:id/submit` (sync FBR call) + `POST /invoices/:id/enqueue` (queue) | `invoice.*` |
| 6 | Dashboard | `GET /dashboard` (cards, monthly-sales chart, tax summary, recent invoices) | `dashboard.*` |
| 7 | Reports | `GET /reports/daily`, `/monthly`, `/tax`, `/sales` | `report.*` |
| 8 | FBR Integration | `services/fbr-client.service.ts` + `services/fbr-token.service.ts` + `services/invoice.service.ts` orchestrator | — |
| 9 | Lookup APIs | `GET /lookup/{provinces,doc-types,hs-codes,uoms,transaction-types,sros,rates,registration-type}` + `POST /lookup/sync[/:kind]` | `lookup.*` |
| 10 | Database Design | 16 tables (see below) | `models/*`, `migrations/*` |
| 11 | API Logs | `GET /api-logs`, `/api-logs/errors`, `/api-logs/:id`. Auto-captured by `middlewares/apiLogger.ts` (inbound) and `services/fbr-client.service.ts` (outbound) | `apiLog.*` |
| 12 | Error Handling | Central `middlewares/errorHandler.ts` + typed errors in `utils/AppError.ts` | — |
| 13 | Security | `helmet`, `cors`, `express-rate-limit`, JWT + refresh rotation, bcrypt hashing, AES-256-GCM for FBR tokens, Joi input validation, secret redaction in logs | — |
| 14 | Queue System | In-process `Queue` with concurrency + exponential-backoff retries. Used for async invoice submission (`POST /invoices/:id/enqueue`). | `services/queue.service.ts`, `invoice.service.ts` |
| 15 | Swagger | `GET /api/v1/docs` (Swagger UI) + `/api/v1/docs.json` | `config/swagger.ts` |

### Support modules (needed to make the above work)
| Endpoint | Purpose |
|----------|---------|
| `/admin/users`, `/admin/roles`, `/admin/permissions` | User management + RBAC |
| `/settings` | Per-company key/value settings |
| `/notifications` | Per-user in-app notifications |
| `/fbr-tokens` | Store per-company FBR bearer tokens (AES encrypted at rest) |

---

## 🗄 Database Tables

Matches spec Section 10 (`users, companies, customers, products, invoices,
invoice_items, invoice_logs, api_logs, roles, permissions, settings,
notifications`) plus support tables:

| Table | Purpose |
|-------|---------|
| `companies` | Seller / tenant record (NTN, address, province, FBR env) |
| `users` | Login accounts (belongs to a Company; SuperAdmin has none) |
| `roles`, `permissions`, `role_permissions` | RBAC |
| `refresh_tokens` | JWT refresh sessions (hashed, rotation + theft detection) |
| `customers` | Buyers used in invoices |
| `products` | Sellable items with HS code, UOM, sale type, rate |
| `invoices`, `invoice_items` | Invoice header + lines (snapshot of FBR contract) |
| `invoice_logs` | Per-invoice state timeline (created / validated / posted / failed …) |
| `fbr_tokens` | AES-encrypted per-company / per-env FBR bearer tokens |
| `fbr_provinces`, `fbr_doc_types`, `fbr_hs_codes`, `fbr_uoms`, `fbr_transaction_types`, `fbr_sros`, `fbr_rates` | Local cache of FBR reference data (Module 9 backing store) |
| `api_logs` | Inbound + outbound HTTP audit log |
| `settings` | Per-company / global key/value configuration |
| `notifications` | Per-user in-app notifications |

---

## 🔐 FBR Endpoints (used by `services/fbr-client.service.ts`)

Base URL: `https://gw.fbr.gov.pk`

| Purpose | Endpoint |
|---------|----------|
| Post invoice (Sandbox) | `/di_data/v1/di/postinvoicedata_sb` |
| Post invoice (Production) | `/di_data/v1/di/postinvoicedata` |
| Validate invoice (Sandbox) | `/di_data/v1/di/validateinvoicedata_sb` |
| Validate invoice (Production) | `/di_data/v1/di/validateinvoicedata` |
| Provinces | `/pdi/v1/provinces` |
| Document Types | `/pdi/v1/doctypecode` |
| HS Codes | `/pdi/v1/itemdesccode` |
| UOM | `/pdi/v1/uom` |
| Transaction Types | `/pdi/v1/transtypecode` |
| SRO Item | `/pdi/v1/sroitemcode` |
| Sale-type → Rate | `/pdi/v2/SaleTypeToRate` |
| Registration Type | `/dist/v1/Get_Reg_Type` |
| STATL | `/dist/v1/statl` |

Sandbox vs Production is determined by the **security token** used — both URL
families are supported explicitly.

---

## 📤 Invoice Lifecycle

```
       create              submit(validate)          submit(post)
draft ────────► draft ──────────────────────► validated ─────► posted
                  │ error                        │ error
                  ▼                              ▼
              (stays draft)                    failed
                                                 │ update
                                                 ▼
                                                draft
```

Every transition writes a row in `invoice_logs`; every FBR call writes a row
in `api_logs` (outbound). The controller `POST /invoices/:id/enqueue` runs the
same logic through the retry queue (Module 14).

---

## 🧪 Health & Docs

- `GET /health` – liveness/readiness probe
- `GET /api/v1` – API root (returns version + docs URL)
- `GET /api/v1/docs` – Swagger UI
- `GET /api/v1/docs.json` – OpenAPI JSON

---

## 📄 License
Encov Solution internal project.
