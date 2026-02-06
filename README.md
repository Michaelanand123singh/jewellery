# Adorné Luxe Jewels - E-commerce Platform

A modern, high-performance jewellery e-commerce application built with Next.js 16, TypeScript, Tailwind CSS, and shadcn/ui components.

**Live Site**: [https://adorneluxejewels.com](https://adorneluxejewels.com)  
**Staging**: [https://staging.adorneluxejewels.com](https://staging.adorneluxejewels.com)  
**Repository**: [https://github.com/Michaelanand123singh/jewellery](https://github.com/Michaelanand123singh/jewellery)

## ✨ Features

- 🛍️ **Product Catalog** - Browse and filter products by category, price, and more
- 🛒 **Shopping Cart** - Add, remove, and manage items in your cart
- ❤️ **Wishlist** - Save your favorite products for later
- 👤 **User Accounts** - Create an account and manage your profile
- 💳 **Checkout** - Secure checkout with Razorpay integration
- 📦 **Order Management** - Track orders with Shiprocket logistics
- 📧 **Email Notifications** - Order confirmations and status updates
- 🎨 **Admin Panel** - Complete admin dashboard for managing products, orders, and settings
- 📱 **Responsive Design** - Fully responsive design that works on all devices
- ⚡ **Performance** - Optimized for speed and SEO

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Storage**: MinIO (Object Storage)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Payment**: Razorpay
- **Logistics**: Shiprocket
- **Email**: Nodemailer (SMTP)
- **Process Manager**: PM2
- **CI/CD**: GitHub Actions

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose (recommended)
- PostgreSQL 16 (if not using Docker)

### Local Development with Docker

```bash
# Clone the repository
git clone https://github.com/Michaelanand123singh/jewellery.git
cd jewellery

# Copy environment file
cp env.example .env

# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Access the application
# Frontend: http://localhost:3000
# MinIO Console: http://localhost:9001
```

### Local Development without Docker

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your database credentials

# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed

# Start development server
npm run dev
```

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed the database
- `npm run db:studio` - Open Prisma Studio

## 🔧 Environment Variables

Create a `.env` file based on `env.example`. Key variables:

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Minimum 32 characters
- `NEXT_PUBLIC_APP_URL` - Your application URL

### Optional (for full functionality)
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` - Payment processing
- `SHIPROCKET_EMAIL` & `SHIPROCKET_PASSWORD` - Shipping/logistics
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - Google OAuth login
- `REDIS_URL` - Redis connection (for caching)
- `MINIO_*` - MinIO configuration (for file storage)

**Note**: Email settings are configured through the admin panel (Settings → Email), not environment variables.

## 🐳 Docker Configuration

### Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production
```bash
docker-compose up --build
```

### Services
- **PostgreSQL**: Port 5432
- **Redis**: Port 6379
- **MinIO API**: Port 9000
- **MinIO Console**: Port 9001
- **Next.js App**: Port 3000

## 🚢 Deployment

### Environments

- **Staging**: `staging.adorneluxejewels.com` (auto-deploys on push to `staging` branch)
- **Production**: `adorneluxejewels.com` (auto-deploys on push to `main` branch)

### CI/CD with GitHub Actions

The project includes automated CI/CD pipelines:

1. **Staging Deployment**: Automatically deploys when code is pushed to `staging` branch
2. **Production Deployment**: Automatically deploys when code is pushed to `main` branch

#### Setup GitHub Secrets

Configure these secrets in GitHub (Settings → Secrets and variables → Actions):

- `STAGING_HOST` - Staging server IP/domain
- `STAGING_SSH_KEY` - SSH private key for staging
- `STAGING_SSH_USER` - SSH username (usually `root`)
- `PRODUCTION_HOST` - Production server IP/domain
- `PRODUCTION_SSH_KEY` - SSH private key for production
- `PRODUCTION_SSH_USER` - SSH username (usually `root`)

#### Generate SSH Key for GitHub Actions

On your VPS server:
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_actions_deploy  # Copy this to GitHub Secrets
```

#### Deployment Process (Non-Docker)

The CI/CD pipeline automatically:
1. Builds the application
2. Runs tests and linting
3. Connects to the server via SSH
4. Pulls the latest code
5. Installs dependencies
6. Builds the application
7. Runs database migrations
8. Restarts the application using PM2

#### Server Setup Requirements

1. **Node.js 20+** installed on the server
2. **PM2** installed globally: `npm install -g pm2`
3. **Git** repositories cloned at:
   - `/var/www/staging` (staging branch)
   - `/var/www/production` (main branch)
4. **PM2 ecosystem configs** in each directory (see `ecosystem.config.js`)
5. **Environment files** (`.env`) configured in each directory

For detailed setup instructions, see [CICD_SETUP.md](./CICD_SETUP.md)

### Manual Deployment

**Staging:**
```bash
cd /var/www/staging
git pull origin staging
npm ci
npm run build
npx prisma migrate deploy
pm2 restart jewellery-staging
```

**Production:**
```bash
cd /var/www/production
git pull origin main
npm ci
npm run build
npx prisma migrate deploy
pm2 restart jewellery-production
```

Or use the deployment scripts:
```bash
# Staging
bash /var/www/staging/scripts/deploy-staging.sh

# Production
bash /var/www/production/scripts/deploy-production.sh
```

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── (admin)/           # Admin routes
│   ├── (auth)/            # Authentication routes
│   ├── (public)/          # Public routes
│   ├── (user)/            # User routes
│   └── api/               # API routes
├── components/            # React components
│   ├── admin/            # Admin components
│   ├── ui/               # shadcn/ui components
│   └── layout/           # Layout components
├── src/                  # Source code
│   ├── domains/          # Domain logic
│   ├── infrastructure/   # Infrastructure code
│   └── shared/           # Shared utilities
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── scripts/              # Utility scripts
```

## 🔐 Security

- JWT-based authentication
- CSRF protection
- Password hashing with bcrypt
- SQL injection prevention (Prisma)
- XSS protection
- Secure headers configured
- Environment variable validation

## 📧 Email Configuration

Email service is configured through the admin panel:

1. Go to Admin Panel → Settings → Email
2. Configure SMTP settings:
   - SMTP Host (e.g., `smtp.gmail.com`)
   - SMTP Port (e.g., `587` for TLS)
   - SMTP Username and Password
   - From Email and Name
3. Test email configuration

**Supported Email Events:**
- User registration welcome email
- Order confirmation email
- Order status update emails (shipped, delivered, etc.)

## 💳 Payment Integration

- **Razorpay**: Configure in admin panel (Settings → Payment)
- Supports both online payments and Cash on Delivery (COD)
- Payment webhooks for status updates
- Automatic payment reconciliation

## 📦 Shipping Integration

- **Shiprocket**: Configure in admin panel (Settings → Shipping)
- Automatic shipment creation
- Tracking integration
- Webhook support for status updates

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📝 Database Management

```bash
# Generate Prisma Client
npm run db:generate

# Create a new migration
npm run db:migrate

# Apply migrations (production)
npx prisma migrate deploy

# Open Prisma Studio
npm run db:studio

# Seed database
npm run db:seed
```

## 🔍 Health Check

The application includes a health check endpoint:

```
GET /api/health
```

Returns application and database health status.

## 🛠️ Troubleshooting

### Build Issues
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Database Connection Issues
```bash
# Check database connection
docker-compose ps postgres
docker-compose logs postgres
```

### Docker Issues
```bash
# Rebuild containers
docker-compose down
docker-compose up --build
```

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues and questions, please open an issue on [GitHub](https://github.com/Michaelanand123singh/jewellery/issues).

---


