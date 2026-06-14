# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SalmaflorisAPI is an e-commerce API for a florist shop, built with Express.js, TypeScript, and Prisma ORM. It provides authentication, product catalog, shopping cart, order management, and payment integration (Midtrans).

## Commands

**Package Manager:** pnpm@10.27.0

```bash
# Development
pnpm dev          # Start development server with hot reload (tsx watch)

# Building
pnpm build        # Compile TypeScript (rimraf dist && tsc && tsc-alias)
pnpm start        # Run production build (node dist/index.js)

# Database
pnpm db:push      # Push schema changes to database (Prisma)
pnpm db:migrate   # Run Prisma migrations
pnpm db:studio    # Open Prisma Studio for database GUI
```

## Architecture

### Layer Pattern
The codebase follows a controller-service-validation layered architecture:

- **routes/** - Express route definitions, grouped by feature
- **controllers/** - Request handlers that delegate to services
- **services/** - Business logic and database operations
- **validations/** - Zod schemas for request validation
- **middlewares/** - Authentication, authorization, error handling, file upload

### Database
- **Prisma ORM** with MariaDB adapter (`@prisma/adapter-mariadb`)
- Schema is in `prisma/schema.prisma`
- Generated client outputs to `generated/prisma/` (note: non-standard path)
- Prisma client is exported from `src/lib/prisma.ts` with MariaDB connection pooling (limit: 5)

### Authentication & Authorization
- JWT-based authentication (`src/lib/jwt.ts`) with 7-hour token expiration
- `authMiddleware.ts` exports:
  - `authenticate` - Verifies JWT token and attaches `req.user`
  - `authorize(...roles)` - Role-based access control (accepts `EnumRole.ADMIN` or `EnumRole.USER`)
- `AuthRequest` interface extends Express Request with `user` property
- Password hashing with bcrypt (salt rounds: 10)

### Validation Pattern
Zod schemas are defined in `validations/*Validation.ts` files. The generic `validation()` function from `validations/validation.ts` parses requests and throws `ErrorResponse` on validation failure, which is caught by error middleware.

### Error Handling
- `ErrorResponse` class from `utils/response.ts` accepts (message, status, errors)
- `errorMiddleware.ts` catches and formats all errors
- Validation errors from Zod are flattened into field errors

### File Upload
- `uploadMiddleware.ts` uses multer with memory storage
- 5MB limit, images only
- Uploads are processed via Cloudinary (`src/lib/cloudinary.ts`)

### External Integrations
- **Midtrans** (Payment): Snap API for payment processing. Orders start as `PENDING`, webhook updates to `PAID`. Config: `MIDTRANS_IS_PRODUCTION` flag toggles sandbox/live.
- **RajaOngkir** (Shipping): Indonesian shipping API. Services: province/city/district lookup, cost calculation. Supported couriers: JNE, Sicepat, J&T, Ninja, Tiki, POS, Wahana, etc.

## Data Models

Key Prisma models and relationships:

- **User**: id (UUID), username, email, password, role (ADMIN/USER)
  - 1:1 with Cart, 1:N with Order and Address
- **Category**: 1:N with Product
- **Product**: id, categoryId, name, price, image, description, deletedAt (soft delete)
  - N:N with Cart (via CartItem) and Order (via OrderItem)
- **Cart**: 1:1 with User, 1:N with CartItem
- **Order**: id, userId, addressId, invoiceNumber, status (PENDING/PAID/PROCESSING/DELIVERED/COMPLETED/CANCELLED), totalAmount, shippingCost, totalPayment, courier details
  - Each order creates a new Address (one-to-one in practice)
  - 1:N with OrderItem
- **Address**: Full Indonesian address structure (provinceId/Name, cityId/Name, districtId/Name, postalCode, addressDetail, customerName, whatsappNumber)

## Order Status Flow

Expected order progression: `PENDING` → `PAID` → `PROCESSING` → `DELIVERED` → `COMPLETED`
- Orders can be `CANCELLED` at any point
- `DELIVERED` status requires a `shippingNumber` (resi)

## Configuration

Environment variables are centrally managed in `src/config/index.ts`:
- **Database**: `DATABASE_HOST`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`
- **JWT**: `JWT_SECRET` - Token signing key
- **Cloudinary**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Midtrans**: `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION`
- **RajaOngkir**: `RAJAONGKIR_API_KEY`, `RAJAONGKIR_BASE_URL`, `ORIGIN` (origin city code)

On startup, `src/index.ts` validates all config values are present.

## TypeScript Notes

- Uses ESNext modules with ES2023 target
- `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` enabled
- Prisma types are imported from `generated/prisma/client`

## Adding a New Feature

Follow the established pattern:

1. Define Zod schema in `src/validations/{feature}Validation.ts`
2. Create service in `src/services/{feature}Service.ts` with business logic
3. Create controller in `src/controllers/{feature}Controller.ts` using the validation helper
4. Create routes in `src/routes/{feature}Router.ts`
5. Register router in `src/routes/router.ts`
