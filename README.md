# Emirates-Style Auction Platform 🎯

A modern, real-time auction platform built with Next.js, featuring Emirates Auction-inspired design and comprehensive auction management capabilities.

## ✨ Features

### 🏆 Core Auction Features
- **Real-time Bidding**: Live bidding with WebSocket integration
- **Smart Bid System**: Quick bid options with balance validation
- **Auction Types**: Multiple auction formats and categories
- **Product Management**: Comprehensive product catalog
- **User Management**: Multi-role user system (Admin, Agent, User)

### 🎨 Emirates-Inspired Design
- **Signature Red Theme**: Using Emirates red (#CE0E2D) color scheme
- **Modern UI/UX**: Material-UI components with custom styling
- **Responsive Design**: Mobile-first approach
- **Real-time Updates**: Live auction countdowns and bid updates

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Admin, Agent, and User permissions
- **Email Verification**: Account verification system
- **Password Reset**: Secure password recovery

### 📊 Advanced Features
- **Dashboard Analytics**: Comprehensive admin dashboard
- **Notification System**: Real-time notifications
- **Search & Filters**: Advanced product search
- **Audit Logging**: Complete action tracking
- **Multi-currency Support**: Virtual balance system

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kareem-3del/auction-platform.git
   cd auction-platform
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Update with your database and Redis configurations
   ```

4. **Setup database**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start development server**
   ```bash
   yarn dev
   ```

Visit `http://localhost:8083` to access the application.

## 🐳 Docker Deployment

### Development with Docker
```bash
docker-compose up -d
```

### Production Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

The production setup includes:
- **Application**: Port 3001
- **PostgreSQL**: Port 5433
- **Redis**: Port 6380
- **Nginx**: Ports 80/443

## 📝 Available Scripts

### Development
```bash
yarn dev          # Start development server (port 8083)
yarn start        # Start production server
yarn build        # Build for production
```

### Code Quality
```bash
yarn lint         # ESLint check
yarn lint:fix     # Auto-fix ESLint issues
yarn fm:check     # Prettier format check
yarn fm:fix       # Auto-fix formatting
yarn fix:all      # Run both lint:fix and fm:fix
```

### Database
```bash
yarn db:migrate   # Run Prisma migrations
yarn db:seed      # Seed database with sample data
yarn db:studio    # Open Prisma Studio
```

### TypeScript
```bash
yarn tsc:watch    # TypeScript watch mode
yarn tsc:dev      # Dev server + TypeScript watch
```

### Maintenance
```bash
yarn clean        # Clean build artifacts
yarn re:dev       # Clean, install, and start dev
yarn re:build     # Clean, install, and build
```

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 18, TypeScript
- **UI Framework**: Material-UI (MUI)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT with NextAuth.js
- **Real-time**: Socket.io
- **Styling**: Material-UI with custom theme

### Key Components
- **Layout System**: Dashboard and authentication layouts
- **Authentication**: JWT-based auth with role management
- **Product Catalog**: Advanced search and filtering
- **Auction Engine**: Real-time bidding system
- **Notification System**: In-app and email notifications
- **Admin Dashboard**: Comprehensive management interface

## 🌐 Production Configuration

### Environment Variables
Create `.env.production` with:
```env
DATABASE_URL=postgresql://user:password@postgres:5432/auction_platform
REDIS_URL=redis://redis:6379
NEXTAUTH_SECRET=your_secret_key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_WS_URL=wss://yourdomain.com
```

### Nginx Configuration
The included `nginx.prod.conf` provides:
- **Reverse Proxy**: Route requests to the application
- **Static File Serving**: Optimized asset delivery
- **Rate Limiting**: API endpoint protection
- **Security Headers**: Enhanced security
- **SSL Support**: HTTPS configuration ready

### SSL Setup
1. Obtain SSL certificates (Let's Encrypt recommended)
2. Update `nginx.prod.conf` with certificate paths
3. Uncomment HTTPS server block

## 📱 API Documentation

### Authentication Endpoints
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
GET  /api/auth/profile      # Get user profile
```

### Auction Endpoints
```
GET  /api/auctions          # List auctions
GET  /api/auctions/:id      # Get auction details
POST /api/auctions          # Create auction (Admin)
POST /api/auctions/:id/bid  # Place bid
```

### Product Endpoints
```
GET  /api/products          # List products
GET  /api/products/:id      # Get product details
POST /api/products          # Create product (Admin)
```

## 🎨 Design System

### Colors
- **Primary**: Emirates Red (#CE0E2D)
- **Secondary**: Dark Blue (#0F1419)
- **Background**: Light Gray (#f8f9fa)
- **Success**: Green (#28a745)
- **Warning**: Orange (#ffc107)
- **Error**: Red (#dc3545)

### Typography
- **Headers**: Roboto Bold
- **Body**: Roboto Regular
- **Captions**: Roboto Light

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

### Code Quality Guidelines
- Follow ESLint configuration
- Use Prettier for formatting
- Write TypeScript types
- Add JSDoc comments for functions
- Follow Material-UI patterns

## 📊 Database Schema

### Core Entities
- **User**: Authentication and profile management
- **Product**: Auction items with details and images
- **Auction**: Auction configuration and timing
- **Bid**: Bidding history and current bids
- **Category**: Product categorization
- **Brand**: Brand management

### Key Relationships
- User → Bids (One-to-Many)
- Product → Auction (One-to-One)
- Category → Products (One-to-Many)
- Brand → Products (One-to-Many)

## 🔧 Troubleshooting

### Common Issues

**Build Errors**
```bash
yarn clean && yarn install && yarn build
```

**Database Connection Issues**
```bash
npx prisma db push
npx prisma generate
```

**TypeScript Errors**
```bash
yarn tsc:watch
```

**Port Conflicts**
- Development: 8083
- Production: 3001
- Database: 5433 (prod), 5432 (dev)
- Redis: 6380 (prod), 6379 (dev)

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Emirates Auction platform design
- Built with Next.js and Material-UI
- PostgreSQL and Redis for data management
- Docker for containerization

---

**Happy Bidding!** 🎯

For support and questions, please open an issue on GitHub.
