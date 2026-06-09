# Scolink Backend API

A secure, scalable backend API for the Scolink educational management system built with Node.js, Express, TypeScript, and MySQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Super Admin System**: Create centers and assign center administrators
- **Center Management**: Full CRUD operations for educational centers
- **User Management**: Comprehensive user management with different roles
- **Security**: Password hashing, rate limiting, input validation, CORS protection
- **Database**: MySQL with Prisma ORM for type-safe database operations
- **API Versioning**: All endpoints use `/api/v1/` prefix
- **Logging**: Structured logging with Winston
- **Testing**: Comprehensive test suite with Jest

## 🏗️ Architecture

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models (Prisma)
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── database/
│   └── seeds/           # Database seed files
├── tests/               # Test files
└── prisma/              # Prisma schema and migrations
```

## 🔐 User Roles

1. **Super Admin** (`admin@admin.com` / configured `SUPER_ADMIN_PASSWORD`)
   - Can create and manage centers
   - Can create center administrators
   - Full system access

2. **Center Admin**
   - Manages a specific center
   - Can view center data and admins
   - Limited to their assigned center

3. **User** (Future expansion)
   - Regular users (students, teachers, etc.)

## 📡 API Endpoints

### Authentication
```
POST   /api/v1/auth/login          # User login
POST   /api/v1/auth/refresh        # Refresh access token
POST   /api/v1/auth/logout         # User logout
POST   /api/v1/auth/logout-all     # Logout all sessions
```

### User Management
```
GET    /api/v1/users/profile       # Get current user profile
PUT    /api/v1/users/profile       # Update current user profile
GET    /api/v1/users               # List users (admin only)
GET    /api/v1/users/:id           # Get user by ID (admin only)
POST   /api/v1/users               # Create user (super admin only)
PUT    /api/v1/users/:id           # Update user (super admin only)
DELETE /api/v1/users/:id           # Delete user (super admin only)
```

### Center Management
```
POST   /api/v1/centers             # Create center (super admin only)
GET    /api/v1/centers             # List centers (admin only)
GET    /api/v1/centers/:id         # Get center details (admin only)
GET    /api/v1/centers/:id/admins  # Get center with admins (admin only)
PUT    /api/v1/centers/:id         # Update center (super admin only)
DELETE /api/v1/centers/:id         # Delete center (super admin only)
```

### Center Admin Management
```
POST   /api/v1/centers/:centerId/admins     # Create center admin (super admin only)
GET    /api/v1/centers/:centerId/admins     # List center admins (admin only)
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the example environment file:
```bash
cp env.example .env
```

Update the `.env` file with your configuration:
```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/scolink_db"

# JWT Secrets (generate strong secrets)
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"

# Server
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:8080"
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed the database with super admin
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3001`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📊 Database Management

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Create migration
npm run db:migrate

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Authentication**: Access tokens (15min) + refresh tokens (7 days)
- **Rate Limiting**: Configurable rate limits on all endpoints
- **Input Validation**: Zod schemas for all inputs
- **CORS Protection**: Configurable CORS settings
- **Security Headers**: Helmet.js for security headers
- **Error Handling**: Secure error responses without sensitive data

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

## 🚀 Production Deployment

1. Set `NODE_ENV=production`
2. Use strong, unique JWT secrets
3. Configure proper CORS origins
4. Set up SSL/TLS certificates
5. Use environment variables for all secrets
6. Set up proper logging and monitoring
7. Configure database connection pooling

## 📚 Development Guidelines

- Follow TypeScript best practices
- Use proper error handling
- Write comprehensive tests
- Follow the established API patterns
- Use meaningful commit messages
- Document new features

## 🤝 Contributing

1. Follow the coding standards defined in `.cursor/rules/`
2. Write tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting

## 📄 License

MIT License - see LICENSE file for details
