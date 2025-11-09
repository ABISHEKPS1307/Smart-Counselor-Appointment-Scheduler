# 🎓 Smart Counselor Appointment Scheduler

A modern, full-stack web application for managing student-counselor appointments with AI-powered assistance using Azure OpenAI Service.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)
![Azure](https://img.shields.io/badge/Azure-Deployed-blue.svg)

**Live Demo:** [https://counselor-scheduler-123-bjayctaaejfccyas.centralindia-01.azurewebsites.net](https://counselor-scheduler-123-bjayctaaejfccyas.centralindia-01.azurewebsites.net)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [GenAI Features](#-genai-features)
- [API Documentation](#-api-documentation)
- [Security](#-security)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Sample Accounts](#-sample-accounts)
- [Contributing](#-contributing)

---

## ✨ Features

### 👤 User Management
- **Dual Authentication** - Separate login/registration for students and counselors
- **JWT Token Authentication** - Secure session management with 1-hour token expiry
- **Role-Based Access Control** - Students and counselors have different permissions
- **Profile Management** - Update personal information and preferences

### 📅 Appointment System
- **Book Appointments** - Students can schedule appointments with any counselor
- **Time Slot Management** - Conflict detection prevents double-booking
- **Status Tracking** - Pending, Accepted, Rejected, or Cancelled statuses
- **Appointment History** - View all past and upcoming appointments
- **Counselor Filtering** - Search counselors by specialization type

### 🤖 AI-Powered Features
- **Feedback Rating System** - AI analyzes student feedback to generate ratings (1-5), sentiment classification, and summaries
- **Floating Chat Widget** - 24/7 AI assistant with specialized modes (Chat, Wellbeing Tips, Recommendations)
- **Smart Recommendations** - AI suggests best counselors based on student needs
- **Sentiment Analysis** - Automatic positive/neutral/negative classification of feedback
- **Response Caching** - Fast responses for common queries (10-minute cache)
- **Safety Guardrails** - Crisis detection and appropriate redirects to professional help

### 🔐 Security & Performance
- **Bcrypt Password Hashing** - Industry-standard password protection
- **Azure Key Vault** - Secure secrets management
- **SQL Injection Prevention** - Parameterized queries throughout
- **Rate Limiting** - Prevent API abuse (100 req/15min, AI: 20 req/15min)
- **CORS Protection** - Controlled cross-origin access
- **Input Validation** - Comprehensive frontend and backend validation
- **Connection Pooling** - Optimized database performance

### 📊 Monitoring & Logging
- **Application Insights** - Real-time performance monitoring
- **Correlation IDs** - Distributed tracing across requests
- **Structured Logging** - JSON-formatted logs for analysis
- **Health Checks** - Endpoint for monitoring system status

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS variables
- **Vanilla JavaScript** - No framework dependencies
- **Responsive Design** - Mobile-first approach

### Backend
- **Node.js 22.x** - Latest LTS version
- **Express.js 4.x** - Web application framework
- **ES Modules** - Modern JavaScript module system
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing

### Database
- **Azure SQL Database** - Managed SQL Server
- **T-SQL** - Stored procedures and optimized queries
- **Connection Pooling** - Efficient connection management
- **Indexed Tables** - Performance-optimized schema

### AI & Azure Services
- **Azure OpenAI Service** - GPT-4 powered AI assistant
- **Azure Key Vault** - Secrets management
- **Azure App Service** - Web hosting (Linux + Node.js 22)
- **Application Insights** - Monitoring and telemetry

### DevOps
- **GitHub Actions** - CI/CD pipeline
- **Docker** - Containerization
- **ZIP Deployment** - Azure App Service deployment
- **Automated Testing** - Jest unit tests

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                         │
│  (HTML + CSS + JavaScript - Responsive Web App)              │
└────────────────────┬──────────────────────────────────────────┘
                     │ HTTPS
                     │
┌────────────────────▼──────────────────────────────────────────┐
│              Azure App Service (Linux)                        │
│                Node.js 22 + Express.js                        │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  API Routes                                           │    │
│  │  • /api/students      • /api/appointments            │    │
│  │  • /api/counselors    • /api/ai                      │    │
│  │  • /api/health                                        │    │
│  └────────────┬─────────────────────┬────────────────────┘    │
│               │                     │                         │
│    ┌──────────▼─────────┐  ┌───────▼──────────┐             │
│    │ Auth Middleware    │  │ Error Handler     │             │
│    │ (JWT + Roles)      │  │ (Global Catch)    │             │
│    └────────────────────┘  └───────────────────┘             │
└────────┬───────────────────────────┬────────────────────────┘
         │                           │
         │                           │
    ┌────▼─────────┐         ┌──────▼────────────┐
    │ Azure SQL DB │         │  Azure OpenAI     │
    │  (SQL Server)│         │  Service (GPT-4)  │
    │              │         │                   │
    │ • Students   │         │ • Chat Mode       │
    │ • Counselors │         │ • Recommendations │
    │ • Appointments│        │ • Summarization   │
    │ • AI_Logs    │         │                   │
    └──────────────┘         └───────────────────┘
         │
         │
    ┌────▼─────────┐
    │ Azure Key    │
    │ Vault        │
    │ (Secrets)    │
    └──────────────┘
```

### Data Flow

1. **Authentication Flow**
   - User submits credentials → Backend validates → JWT token generated → Token stored in localStorage

2. **Appointment Booking Flow**
   - Student selects counselor/date/time → Frontend validation → API request with JWT → Backend checks conflicts → Database insert → Confirmation

3. **AI Assistant Flow**
   - User sends prompt → Backend validates → Azure OpenAI API call → Response cached → Result returned to client

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 22.x or higher
- **Azure Account** (for deployment)
- **Azure SQL Database** (provisioned)
- **Git** for version control

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ABISHEKPS1307/Smart-Counselor-Appointment-Scheduler.git
   cd Smart-Counselor-Appointment-Scheduler
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```env
   NODE_ENV=development
   PORT=8080
   
   # Database
   SQL_SERVER=your-server.database.windows.net
   SQL_DATABASE=sc-db
   SQL_USER=adminuser
   SQL_PASSWORD=your-password
   SQL_ENCRYPT=true
   SQL_TRUST_SERVER_CERTIFICATE=false
   
   # JWT
   JWT_SECRET=your-secret-key-min-32-chars
   JWT_EXPIRES_IN=1h
   
   # Azure OpenAI (Optional)
   AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com/
   AZURE_OPENAI_API_KEY=your-api-key
   AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
   
   # Azure Key Vault (Optional)
   AZURE_KEY_VAULT_NAME=your-keyvault
   
   # Application Insights (Optional)
   APPINSIGHTS_CONNECTION_STRING=your-connection-string
   ```

4. **Initialize the database**
   
   Run the SQL schema on your Azure SQL Database:
   ```bash
   # Using Azure Portal Query Editor
   # Copy content from sql/complete-schema.sql and execute
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   ```
   http://localhost:8080
   ```

7. **Initialize GenAI features** (Optional)
   
   Run the feedback schema update:
   ```bash
   # Using Azure Portal Query Editor
   # Copy content from sql/update-schema-feedback.sql and execute
   ```

### Docker Development

```bash
# Build Docker image
docker build -t counselor-scheduler .

# Run container
docker run -p 8080:8080 --env-file .env counselor-scheduler

# Access at http://localhost:8080
```

---

## 🤖 GenAI Features

### Overview

Two powerful AI-driven features enhance the counseling experience:

1. **Feedback-Based Counselor Rating System** - Automatically analyze student feedback using Azure OpenAI
2. **AI Chatbot for Basic Counseling Help** - 24/7 floating chat assistant with specialized modes

📖 **Detailed Documentation**: See [GENAI_FEATURES.md](GENAI_FEATURES.md) for complete implementation guide

### Feature 1: Feedback Rating System

**What it does:**
- Students submit feedback after appointments
- Azure OpenAI (GPT-4o-mini) automatically analyzes the feedback
- Generates 1-5 star rating based on sentiment
- Classifies sentiment (positive/neutral/negative)
- Creates concise summaries
- Provides improvement suggestions for counselors

**For Students:**
1. Go to "My Appointments" tab
2. Find past accepted appointments
3. Click "📝 Give Feedback" button
4. Write your experience (min 10 characters)
5. View AI-generated analysis instantly

**For Counselors:**
- View average rating with star display
- See sentiment breakdown (positive/neutral/negative)
- Read AI-generated summaries
- Review improvement suggestions
- Track feedback trends

**API Endpoints:**
```http
POST /api/feedback                     # Submit feedback
GET /api/feedback/counselor/:id        # Get counselor feedback stats
GET /api/feedback/student/:id          # Get student feedback history
GET /api/feedback/appointment/:id      # Get appointment feedback
```

### Feature 2: AI Chatbot

**What it does:**
- Floating chat widget (bottom-right corner)
- Three specialized modes:
  - **Chat**: General questions about the platform
  - **Wellbeing Tips**: Stress management and wellness advice
  - **Recommendation**: Counselor type suggestions
- Response caching for faster replies
- Safety guardrails for crisis detection

**How to use:**
1. Click the 💬 button in bottom-right corner
2. Select a chat mode (Chat/Wellbeing/Recommend)
3. Type your message or use quick actions
4. Get instant AI-powered responses

**Safety Features:**
- Detects crisis keywords (suicide, self-harm, emergency)
- Redirects to professional help when needed
- Never provides medical diagnoses
- Rate limited to prevent abuse

**API Endpoint:**
```http
POST /api/ai/query
{
  "prompt": "I'm stressed about exams",
  "mode": "wellbeing_tips"
}
```

**Supported Modes:**
- `chat` - General assistance
- `wellbeing_tips` - Wellness advice
- `recommendation` - Counselor matching
- `analyzeFeedback` - Feedback analysis (internal)

### Azure OpenAI Configuration

Requires Azure OpenAI Service with:
- Model: `gpt-4o-mini` or `gpt-4o`
- API endpoint and key configured
- Cache TTL: 10 minutes
- Rate limit: 20 requests per 15 minutes

### Database Schema

New table for feedback:
```sql
CREATE TABLE Feedback (
    FeedbackID INT PRIMARY KEY,
    AppointmentID INT NOT NULL,
    StudentID INT NOT NULL,
    CounselorID INT NOT NULL,
    FeedbackText NVARCHAR(MAX),
    Rating INT NOT NULL,              -- AI-generated 1-5
    Sentiment NVARCHAR(20),           -- positive/neutral/negative
    Summary NVARCHAR(500),            -- AI summary
    ImprovementSuggestions NVARCHAR(1000),
    CreatedAt DATETIME2
)
```

---

## 📚 API Documentation

### Base URL
- **Local:** `http://localhost:8080/api`
- **Production:** `https://counselor-scheduler-123-bjayctaaejfccyas.centralindia-01.azurewebsites.net/api`

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Health Check
```http
GET /api/health
```
Returns system health status and database connectivity.

#### Students

**Register Student**
```http
POST /api/students/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@university.edu",
  "password": "Password123!"
}
```

**Student Login**
```http
POST /api/students/login
Content-Type: application/json

{
  "email": "john@university.edu",
  "password": "Password123!"
}
```

#### Counselors

**Register Counselor**
```http
POST /api/counselors/register
Content-Type: application/json

{
  "name": "Dr. Jane Smith",
  "email": "jane@university.edu",
  "password": "Password123!",
  "counselorType": "Academic",
  "bio": "PhD in Psychology, 10+ years experience"
}
```

**Counselor Login**
```http
POST /api/counselors/login
Content-Type: application/json

{
  "email": "jane@university.edu",
  "password": "Password123!"
}
```

**Get All Counselors** (Public)
```http
GET /api/counselors
```

**Get Counselor Profile** (Auth Required)
```http
GET /api/counselors/profile
Authorization: Bearer <token>
```

#### Appointments

**Create Appointment** (Student Only)
```http
POST /api/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentID": 1,
  "counselorID": 2,
  "date": "2025-11-15",
  "time": "14:00:00"
}
```

**Get Student Appointments**
```http
GET /api/appointments/student/:studentId
Authorization: Bearer <token>
```

**Get Counselor Appointments**
```http
GET /api/appointments/counselor/:counselorId
Authorization: Bearer <token>
```

**Update Appointment Status** (Counselor Only)
```http
PATCH /api/appointments/:appointmentId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Accepted"
}
```
Status options: `Pending`, `Accepted`, `Rejected`, `Cancelled`

#### AI Assistant

**Query AI Assistant** (Auth Required)
```http
POST /api/ai/query
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "I need help with course selection",
  "mode": "chat"
}
```
Modes: `chat`, `recommendation`, `summarizeFeedback`

### Response Format

**Success Response**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Operation successful",
  "timestamp": "2025-11-09T03:00:00.000Z"
}
```

**Error Response**
```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials",
    "code": 401
  },
  "timestamp": "2025-11-09T03:00:00.000Z"
}
```

---

## 🔒 Security

### Authentication & Authorization
- **JWT Tokens** - Short-lived tokens (1 hour expiry)
- **Bcrypt Hashing** - Password hashing with salt rounds (cost factor: 10)
- **Role-Based Access** - Students and counselors have different permissions
- **Token Validation** - All protected routes verify JWT signature

### Data Protection
- **Azure Key Vault** - Secure storage for secrets and credentials
- **Managed Identity** - Secure access to Azure resources without credentials
- **SQL Parameterization** - Prevents SQL injection attacks
- **Input Sanitization** - XSS prevention through input cleaning
- **HTTPS Only** - All traffic encrypted in transit

### Rate Limiting
- **General API**: 100 requests per 15 minutes
- **AI Endpoints**: 20 requests per 15 minutes
- **Per-IP Tracking**: Prevents abuse

### Additional Security Measures
- **CORS Configuration** - Controlled cross-origin access
- **Helmet.js** - Security headers (CSP, XSS protection)
- **Content Security Policy** - Prevents XSS and injection attacks
- **Error Handling** - No sensitive data leakage in error messages
- **Correlation IDs** - Request tracking without exposing user data

---

## 🚀 Deployment

### Azure App Service Deployment

The application is deployed using **ZIP deployment** to Azure App Service.

**Current Deployment:**
- **URL**: https://counselor-scheduler-123-bjayctaaejfccyas.centralindia-01.azurewebsites.net
- **Resource Group**: CloudProjectNew
- **App Service**: counselor-scheduler-123
- **Database**: scmainserver.database.windows.net/sc-db
- **Region**: Central India

### Deployment Methods

#### Method 1: GitHub Actions (Recommended)

The repository includes a GitHub Actions workflow that automatically deploys on push to `main`:

```yaml
# .github/workflows/azure-deploy.yml
- Push to main branch → Runs tests → Builds app → Deploys to Azure
```

**Required GitHub Secrets:**
- `AZURE_CREDENTIALS` - Service principal for Azure authentication
- `JWT_SECRET` - JWT signing secret

#### Method 2: Manual ZIP Deployment

```bash
# Build deployment package
npm install --production
zip -r deploy.zip . -x "node_modules/*" ".git/*" "*.md"

# Deploy to Azure
az webapp deployment source config-zip \
  --resource-group CloudProjectNew \
  --name counselor-scheduler-123 \
  --src deploy.zip
```

#### Method 3: Azure CLI

```bash
# Build and deploy
az webapp up \
  --name counselor-scheduler-123 \
  --resource-group CloudProjectNew \
  --runtime "NODE:22-lts"
```

### Environment Configuration

Set environment variables in Azure Portal:
```bash
az webapp config appsettings set \
  --resource-group CloudProjectNew \
  --name counselor-scheduler-123 \
  --settings \
    NODE_ENV=production \
    SQL_SERVER=scmainserver.database.windows.net \
    SQL_DATABASE=sc-db \
    SQL_USER=adminuser \
    SQL_ENCRYPT=true \
    JWT_SECRET="your-secret"
```

### Database Setup

The database schema is in `sql/complete-schema.sql`. It includes:
- Table definitions
- Indexes for performance
- Stored procedures
- Sample data (4 counselors, 3 students)

**To initialize:**
1. Go to Azure Portal → SQL Database → Query Editor
2. Login with SQL authentication
3. Copy and paste content from `sql/complete-schema.sql`
4. Execute the script

---

## 📁 Project Structure

```
appointment_scheduler/
├── .github/
│   └── workflows/
│       └── azure-deploy.yml        # CI/CD pipeline for Azure
│
├── public/                         # Frontend files (served statically)
│   ├── index.html                  # Main HTML page
│   ├── fix-login.html              # Session fix utility page
│   └── static/
│       ├── script.js               # Frontend JavaScript (750+ lines)
│       └── styles.css              # CSS styling
│
├── sql/
│   └── complete-schema.sql         # Complete database schema with seed data
│
├── src/                            # Backend source code
│   ├── controllers/                # Business logic
│   │   ├── ai.controller.js
│   │   ├── appointments.controller.js
│   │   ├── counselors.controller.js
│   │   └── students.controller.js
│   │
│   ├── middleware/                 # Express middleware
│   │   ├── auth.js                 # JWT authentication
│   │   ├── correlationId.js        # Request tracing
│   │   ├── errorHandler.js         # Global error handling
│   │   └── validate.js             # Input validation
│   │
│   ├── models/                     # Data access layer
│   │   ├── appointments.model.js
│   │   ├── counselors.model.js
│   │   ├── db.js                   # Database connection pool
│   │   └── students.model.js
│   │
│   ├── routes/                     # API route definitions
│   │   ├── ai.routes.js
│   │   ├── appointments.routes.js
│   │   ├── counselors.routes.js
│   │   ├── health.routes.js
│   │   └── students.routes.js
│   │
│   ├── utils/                      # Utility functions
│   │   ├── aiClient.js             # Azure OpenAI integration
│   │   ├── keyVaultClient.js       # Azure Key Vault client
│   │   ├── logger.js               # Winston logger
│   │   └── responseHelper.js       # API response formatting
│   │
│   ├── app.js                      # Express app configuration
│   ├── config.js                   # Configuration management
│   ├── server.js                   # Server entry point
│   ├── swagger.js                  # Swagger/OpenAPI setup
│   └── telemetry.js                # Application Insights
│
├── tests/                          # Test files
│   ├── health.test.js              # Health endpoint tests
│   └── setup.js                    # Test configuration
│
├── .dockerignore                   # Docker ignore rules
├── .env.example                    # Environment variables template
├── .eslintrc.json                  # ESLint configuration
├── .gitignore                      # Git ignore rules
├── Dockerfile                      # Docker container definition
├── jest.config.js                  # Jest test configuration
├── package.json                    # Node.js dependencies
├── package-lock.json               # Locked dependency versions
└── README.md                       # This file
```

### Key Files Explained

**Backend Entry Points:**
- `src/server.js` - Application startup, graceful shutdown, error handling
- `src/app.js` - Express configuration, middleware, routes
- `src/config.js` - Environment variable management

**Database:**
- `src/models/db.js` - Connection pool with retry logic and health checks
- `sql/complete-schema.sql` - Complete database schema (students, counselors, appointments, AI logs)

**Frontend:**
- `public/index.html` - Single-page application structure
- `public/static/script.js` - Client-side logic (authentication, API calls, UI updates)
- `public/static/styles.css` - Modern, responsive styling

**Security:**
- `src/middleware/auth.js` - JWT verification and role checks
- `src/middleware/validate.js` - Input validation and sanitization
- `src/utils/keyVaultClient.js` - Azure Key Vault integration

---

## 👥 Sample Accounts

### Test Credentials

**Students:**
| Name | Email | Password |
|------|-------|----------|
| Alice Johnson | alice.johnson@university.edu | Password123! |
| Bob Smith | bob.smith@university.edu | Password123! |
| Charlie Brown | charlie.brown@university.edu | Password123! |

**Counselors:**
| Name | Type | Email | Password |
|------|------|-------|----------|
| Dr. Emily Carter | Academic | emily.carter@university.edu | Password123! |
| Michael Rodriguez | Career | michael.rodriguez@university.edu | Password123! |
| Dr. Sarah Kim | Mental Health | sarah.kim@university.edu | Password123! |
| James Wilson | Personal | james.wilson@university.edu | Password123! |

**Note:** These are pre-seeded accounts in the database. You can also register new accounts through the UI.

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Manual Testing

1. **Health Check**
   ```bash
   curl https://counselor-scheduler-123-bjayctaaejfccyas.centralindia-01.azurewebsites.net/api/health
   ```

2. **Register Student**
   ```bash
   curl -X POST https://counselor-scheduler-123-bjayctaaejfccyas.centralindia-01.azurewebsites.net/api/students/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@test.com","password":"Test1234!"}'
   ```

3. **List Counselors**
   ```bash
   curl https://counselor-scheduler-123-bjayctaaejfccyas.centralindia-01.azurewebsites.net/api/counselors
   ```

---

## 🐛 Troubleshooting

### Common Issues

**1. "Database connection failed"**
- Verify SQL Server firewall allows your IP
- Check connection string in `.env`
- Test connection in Azure Portal Query Editor

**2. "JWT token expired"**
- Tokens expire after 1 hour
- Logout and login again to get a new token

**3. "Counselor dropdown is empty"**
- Clear browser cache
- Check browser console for API errors
- Verify counselors exist in database

**4. "Please login as a student to book appointments"**
- Logout and login again
- Or visit `/fix-login.html` to repair session data

**5. Time validation error when booking**
- Use the time picker provided in the UI
- Ensure time is in HH:MM format

### Debug Mode

Enable debug logging:
```bash
# In .env
LOG_LEVEL=debug
NODE_ENV=development
```

Check logs:
```bash
# Azure App Service
az webapp log tail --resource-group CloudProjectNew --name counselor-scheduler-123

# Local
npm run dev
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   git clone https://github.com/YOUR_USERNAME/Smart-Counselor-Appointment-Scheduler.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow existing code style
   - Add tests for new features
   - Update documentation

4. **Test your changes**
   ```bash
   npm test
   npm run lint
   ```

5. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
   
   Use conventional commits:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation only
   - `style:` - Code style changes
   - `refactor:` - Code refactoring
   - `test:` - Test changes
   - `chore:` - Build/tooling changes

6. **Push and create Pull Request**
   ```bash
   git push origin feature/amazing-feature
   ```

### Code Style

- **ESLint** - Run `npm run lint` to check
- **Prettier** - Code formatting
- **ES Modules** - Use `import/export` syntax
- **Async/Await** - Prefer over callbacks
- **Error Handling** - Always use try-catch
- **Comments** - JSDoc style for functions

---

## 📊 Performance

### Optimization Features

- **Database Connection Pooling** - Reuse connections (max: 10, min: 0)
- **SQL Indexes** - Optimized queries on Students.Email, Counselors.Email, Appointments.Date
- **AI Response Caching** - Cache common queries for 10 minutes
- **CDN Ready** - Static files can be served from CDN
- **Compression** - Gzip compression enabled
- **Lazy Loading** - Load counselors on demand

### Benchmarks

- **API Response Time**: < 200ms (avg)
- **Database Query Time**: < 50ms (avg)
- **AI Response Time**: 1-3 seconds (uncached), < 100ms (cached)
- **Page Load Time**: < 2 seconds

---

## 📜 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 Smart Counselor Appointment Scheduler

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📧 Support & Contact

- **GitHub Repository**: [ABISHEKPS1307/Smart-Counselor-Appointment-Scheduler](https://github.com/ABISHEKPS1307/Smart-Counselor-Appointment-Scheduler)
- **Issues**: [Report a Bug](https://github.com/ABISHEKPS1307/Smart-Counselor-Appointment-Scheduler/issues)
- **Live Demo**: [counselor-scheduler-123.azurewebsites.net](https://counselor-scheduler-123-bjayctaaejfccyas.centralindia-01.azurewebsites.net)

---

## 🙏 Acknowledgments

- **Azure** - Cloud infrastructure and AI services
- **Node.js Community** - Excellent ecosystem and packages
- **OpenAI** - GPT-4 model powering AI assistant
- **Express.js** - Robust web framework
- **Microsoft** - Azure SQL Database and App Service

---

## 🎯 Roadmap

### Future Enhancements

- [ ] Email notifications for appointments
- [ ] SMS reminders via Twilio
- [ ] Video call integration (Teams/Zoom)
- [ ] Mobile app (React Native)
- [ ] Calendar integration (Google/Outlook)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Appointment rescheduling
- [x] Feedback/rating system with AI analysis
- [x] AI chatbot for student support

---

## 📈 Version History

### v1.1.0 (Current - November 2025)
- ✅ AI-powered feedback rating system
- ✅ Floating AI chatbot with 3 modes
- ✅ Sentiment analysis for feedback
- ✅ Counselor ratings dashboard
- ✅ Safety guardrails for sensitive content
- ✅ Response caching for AI queries

### v1.0.0 (November 2025)
- ✅ Student and counselor authentication
- ✅ Appointment booking system
- ✅ AI-powered chat assistant
- ✅ Azure deployment
- ✅ Comprehensive error handling
- ✅ Role-based access control
- ✅ Security hardening

---

**Built with ❤️ by [Abishek PS](https://github.com/ABISHEKPS1307)**

**Powered by Azure, Node.js, and AI** ☁️🚀🤖
