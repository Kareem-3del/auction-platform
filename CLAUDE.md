# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development Server
- `yarn dev` - Start development server on port 8083 with Turbopack
- `yarn start` - Start production server on port 8083
- `yarn build` - Build production bundle

### Database Operations
- `yarn db:migrate` - Run Prisma migrations
- `yarn db:generate` - Generate Prisma client
- `yarn db:push` - Push schema changes to database
- `yarn db:seed` - Seed database with initial data
- `yarn db:studio` - Open Prisma Studio for database management
- `yarn db:reset` - Reset database and run migrations

### Code Quality
- `yarn lint` - Run ESLint
- `yarn lint:fix` - Auto-fix ESLint issues
- `yarn fm:check` - Check Prettier formatting
- `yarn fm:fix` - Auto-fix Prettier formatting
- `yarn fix:all` - Run both lint:fix and fm:fix

### TypeScript
- `yarn tsc:watch` - Run TypeScript in watch mode
- `yarn tsc:dev` - Run dev server + TypeScript watch mode

### Testing
- `yarn test` - Run Jest tests
- `yarn test:watch` - Run Jest in watch mode
- `yarn test:coverage` - Generate test coverage report

### Docker Development
- `docker-compose up -d` - Start all services in development mode
- `docker-compose down` - Stop all services

### PM2 Restart (Production)
After updates and successful build, restart the app with PM2 as mentioned in user's global instructions.

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 with React 19, TypeScript, Material-UI
- **Backend**: Next.js API Routes with Prisma ORM
- **Database**: PostgreSQL with comprehensive audit logging
- **Cache**: Redis for sessions and real-time data
- **Real-time**: WebSocket server for live bidding
- **Authentication**: JWT-based with Argon2 password hashing

### Key Architecture Patterns

#### Database Schema (Prisma)
The application uses a unified auction platform schema where Products directly contain auction functionality:
- **Users**: Support for buyers, agents, admins with KYC verification
- **Products**: Combined product + auction model with real-time bidding
- **Bids**: Manual and automatic bidding system
- **Transactions**: Virtual and real balance management
- **Comprehensive audit logging** for all actions

#### Authentication System (`src/lib/auth.ts`)
- JWT access tokens (15 min expiration)
- Refresh tokens (30 days)
- Account lockout after 5 failed attempts
- Anonymous display names for privacy
- Session management with cleanup

#### Real-time Bidding (`src/lib/websocket/bidding-server.ts`)
- WebSocket server for live auction updates
- Product-based connection rooms
- Heartbeat monitoring for connection health
- Broadcasting bid updates and auction status

#### Layout System
- **Dashboard Layout**: Full admin interface with navigation
- **Auth Layout**: Split layout for login/register pages
- **Simple Layout**: Minimal layout for public pages
- Material-UI theming with Emirates red color scheme

### Project Structure

#### API Routes (`src/app/api/`)
- **auth/**: Authentication endpoints (login, register, refresh)
- **products/**: Product and auction management
- **bids/**: Bidding operations
- **users/**: User management and profiles
- **admin/**: Administrative functions
- **analytics/**: Dashboard analytics

#### Components (`src/components/`)
- **bidding/**: Real-time bidding interfaces
- **product-card/**: Various product display cards
- **sections/**: Homepage sections (featured, trending, etc.)
- **layout/**: Header, footer, navigation components
- **common/**: Shared utilities like CountdownTimer, ImageUpload

#### Database Models (Key Entities)
- **User**: Authentication, balance management, KYC status
- **Agent**: Business information for auction agents
- **Product**: Unified auction + product model with extensive auction fields
- **Bid**: Bidding history with support for auto-bidding
- **Transaction**: Financial operations with audit trails

### Development Workflow

1. **Database Changes**: Always run `yarn db:generate` after schema changes
2. **Real-time Features**: WebSocket server runs on port 8081 (configurable)
3. **Authentication**: JWT tokens stored in HTTP-only cookies
4. **File Uploads**: Handled through `/api/upload/image` endpoint
5. **Testing**: API routes have test coverage in `__tests__` directories

### Key Configuration Files
- **Database**: `prisma/schema.prisma` - Complete auction platform schema
- **Routes**: `src/routes/paths.ts` - Application route definitions
- **Navigation**: `src/layouts/nav-config-dashboard.tsx` - Dashboard menu structure
- **Theme**: Emirates red theme with Material-UI customization

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string  
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `WS_PORT` - WebSocket server port (default: 8081)

### Docker Services
The application includes a comprehensive Docker setup with:
- PostgreSQL with optimized configuration
- Redis for caching and sessions
- MinIO for S3-compatible file storage
- Elasticsearch and Kibana for analytics
- RabbitMQ for message queuing
- Nginx reverse proxy
- Monitoring with Prometheus and Grafana

### New Features Added

#### Binance Recharge System
- **API Endpoint**: `/api/binance/recharge` - Handles USD balance recharge via Binance Pay simulation
- **Database**: `BinanceRecharge` model tracks all recharge transactions
- **Features**: Automatic balance updates, transaction records, notifications

#### Manual Balance Adjustment (Admin)
- **API Endpoint**: `/api/admin/balance` - Allows admins to manually adjust user balances
- **Database**: `BalanceAdjustment` model for audit trails
- **Features**: Support for Real, Virtual, and USD balance types with full audit logging

#### Support Ticket System
- **API Endpoints**: 
  - `/api/tickets` - Create and list support tickets
  - `/api/tickets/[id]` - Get ticket details and update status
  - `/api/tickets/[id]/messages` - Add messages to tickets
- **Database**: `SupportTicket`, `SupportMessage`, `TicketAttachment` models
- **Features**: Priority levels, categories, assignment, internal notes

#### Enhanced Notification System
- **API Endpoints**: 
  - `/api/notifications/[id]` - Mark as read, delete notifications
  - `/api/notifications/preferences` - Manage notification preferences
- **Database**: `NotificationPreference` model for granular notification control
- **Features**: Email, Push, SMS preferences for different event types

#### Bilingual Support (Arabic/English)
- **i18n Setup**: Using `next-i18next` with Arabic RTL support
- **Database**: All content models now have Arabic fields (nameAr, descriptionAr, etc.)
- **Components**: 
  - `LanguageSwitcher` - Switch between languages
  - `useLocale` hook - Helper functions for localization
  - `BilingualCategoryForm` - Example bilingual form
  - `BilingualDashboardView` - Dashboard with bilingual content
- **Translation Files**: Located in `public/locales/en/` and `public/locales/ar/`

### Updated Database Schema
- **User Model**: Added `balanceUSD` field
- **Bilingual Fields**: Added Arabic versions of all content fields
- **New Models**: BinanceRecharge, SupportTicket, SupportMessage, TicketAttachment, BalanceAdjustment, NotificationPreference

### Testing Strategy
- API route testing with Jest and Supertest
- Component testing for authentication hooks
- Integration tests for critical auction workflows
- remember the app working fine now on domain https://auction.lebanon-auction.bdaya.tech/ and you in production server so you can workas you need here to develop but after build good the next app resert it please in pm2 to let me see the updates