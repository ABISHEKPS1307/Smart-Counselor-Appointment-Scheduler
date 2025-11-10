# 🎓 Smart Counselor Appointment Scheduler

> **A modern, AI-powered appointment scheduling platform for university counseling services with GenAI features**

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)
![Azure](https://img.shields.io/badge/Azure-Container%20Apps-blue.svg)
![GenAI](https://img.shields.io/badge/GenAI-Azure%20OpenAI-purple.svg)

**🌐 Live Demo:** [https://counselor-app.happybeach-63d85bb1.centralindia.azurecontainerapps.io](https://counselor-app.happybeach-63d85bb1.centralindia.azurecontainerapps.io)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [GenAI Features](#-genai-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Sample Accounts](#-sample-accounts)
- [Contributing](#-contributing)

---

## 🌟 Overview

The Smart Counselor Appointment Scheduler is a comprehensive web application designed for university counseling centers. It streamlines the appointment booking process while incorporating cutting-edge AI technology to enhance the counseling experience.

### **What Makes It Smart?**

- **AI-Powered Feedback Analysis** - Automatically analyzes student feedback to generate ratings and insights
- **Intelligent Chatbot** - 24/7 AI assistant with specialized counseling modes
- **Smart Recommendations** - AI suggests the best counselors based on student needs
- **Sentiment Analysis** - Real-time analysis of student feedback for early intervention
- **Modern UI** - Beautiful, animated interface with glass morphism design

---

## ✨ Key Features

### 👤 **User Management**
- Dual authentication system (Students & Counselors)
- Secure JWT-based session management
- Role-based access control
- Profile management and preferences
- Password recovery system

### 📅 **Appointment System**
- Real-time appointment booking
- Automatic conflict detection
- Time slot management
- Status tracking (Pending, Accepted, Rejected, Cancelled)
- Complete appointment history
- Email notifications (configurable)
- Counselor filtering by specialization

### 🎨 **Modern UI/UX**
- **Animated gradient backgrounds** with particle effects
- **Glass morphism design** with frosted glass cards
- **Smooth animations** - Slide, fade, and scale effects
- **Interactive elements** - Glowing focus states and hover effects
- **Responsive design** - Works perfectly on mobile, tablet, and desktop
- **Accessibility** - WCAG 2.1 compliant

---

## 🤖 GenAI Features

### 1. **AI-Powered Feedback System**
Students can submit feedback after appointments, which is automatically analyzed by Azure OpenAI:

- **Automatic Rating Generation** (1-5 stars)
- **Sentiment Classification** (Positive/Neutral/Negative)
- **Feedback Summarization**
- **Key Insights Extraction**
- **Trend Analysis** for counselor performance

**Technology:** Azure OpenAI GPT-4 with structured JSON output

### 2. **Intelligent Chatbot Widget**
A floating chat widget provides 24/7 AI assistance with three specialized modes:

#### **Chat Mode** 🤖
- General questions about the system
- Booking assistance
- Navigation help
- FAQ responses

#### **Wellbeing Tips Mode** 💚
- Mental health resources
- Stress management techniques
- Self-care suggestions
- Crisis hotline information
- Emergency detection and routing

#### **Recommend Mode** 🎯
- Personalized counselor recommendations
- Matching based on student needs
- Specialization-based suggestions
- Availability-aware recommendations

**Features:**
- Context-aware conversations
- Response caching for performance (10-min TTL)
- Safety guardrails for crisis situations
- Rate limiting to prevent abuse
- Mobile-optimized interface

### 3. **Counselor Ratings Dashboard**
Counselors can view AI-generated insights:

- Overall rating statistics
- Sentiment distribution charts
- Recent feedback summaries
- Performance trends over time
- Anonymous student feedback

---

## 🛠 Tech Stack

### **Frontend**
```
├── HTML5 - Semantic markup
├── CSS3 - Modern styling with animations
│   ├── CSS Variables (Design system)
│   ├── Glass morphism effects
│   ├── Keyframe animations
│   └── Responsive grid layouts
└── Vanilla JavaScript - No framework dependencies
    ├── Fetch API for HTTP requests
    ├── LocalStorage for session management
    └── Lucide icons for UI elements
```

### **Backend**
```
├── Node.js 22.x (LTS)
├── Express.js 4.x
├── ES Modules
├── JWT Authentication
├── Bcrypt Password Hashing
├── Winston Logging
└── Express Rate Limit
```

### **Database**
```
├── Azure SQL Database
├── T-SQL Stored Procedures
├── Indexed tables for performance
├── Connection pooling
└── Parameterized queries (SQL injection prevention)
```

### **AI & Azure Services**
```
├── Azure OpenAI Service (GPT-4)
├── Azure Container Apps (Hosting)
├── Azure Container Registry
├── Azure SQL Database
├── Log Analytics Workspace
└── Managed Identity (Future)
```

### **DevOps & Infrastructure**
```
├── GitHub Actions (CI/CD)
├── Docker (Containerization)
├── Terraform (Infrastructure as Code)
├── Azure CLI (Deployment automation)
└── Multi-stage Docker builds
```

---

## 🏗 Architecture

### **System Architecture**
```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Browser │  │  Mobile  │  │  Tablet  │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │             │              │                     │
│       └─────────────┴──────────────┘                    │
│                     │                                    │
└─────────────────────┼────────────────────────────────────┘
                      │ HTTPS
┌─────────────────────┼────────────────────────────────────┐
│              APPLICATION LAYER                           │
│       ┌──────────────┴────────────────┐                 │
│       │  Azure Container Apps         │                 │
│       │  (Node.js + Express)          │                 │
│       ├───────────────────────────────┤                 │
│       │  • JWT Authentication         │                 │
│       │  • Rate Limiting              │                 │
│       │  • Request Validation         │                 │
│       │  • Error Handling             │                 │
│       └──┬─────────────────────┬──────┘                 │
│          │                     │                         │
└──────────┼─────────────────────┼─────────────────────────┘
           │                     │
┌──────────┼─────────────────────┼─────────────────────────┐
│    DATA LAYER            AI LAYER                        │
│  ┌───────▼───────┐    ┌──────▼────────┐                │
│  │ Azure SQL DB  │    │ Azure OpenAI  │                │
│  │               │    │               │                │
│  │ • Users       │    │ • GPT-4       │                │
│  │ • Appointments│    │ • Chat        │                │
│  │ • Feedback    │    │ • Analysis    │                │
│  └───────────────┘    └───────────────┘                │
└─────────────────────────────────────────────────────────┘
```

### **Deployment Flow**
```
Developer Push → GitHub → Actions Workflow → Docker Build
    ↓
Azure Container Registry ← Docker Image
    ↓
Azure Container Apps ← Pull & Deploy
    ↓
Health Check → Live Traffic
```

---

## 🚀 Getting Started

### **Prerequisites**
```bash
- Node.js 22.x or higher
- npm 10.x or higher
- Azure account (for deployment)
- Docker (optional, for local container testing)
```

### **Local Development**

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
Create a `.env` file:
```env
# Server Configuration
NODE_ENV=development
PORT=8080

# Azure SQL Database
SQL_SERVER=your-server.database.windows.net
SQL_DATABASE=your-database
SQL_USER=your-username
SQL_PASSWORD=your-password
SQL_ENCRYPT=true
SQL_TRUST_SERVER_CERTIFICATE=false

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=1h

# Azure OpenAI (for GenAI features)
AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

4. **Initialize the database**
```bash
# Run the SQL scripts in order:
1. sql/schema.sql         # Create tables
2. sql/seed-data.sql      # Insert sample data
3. sql/indexes.sql        # Create indexes
```

5. **Start the development server**
```bash
npm run dev
# Server runs on http://localhost:8080
```

6. **Test the application**
```bash
npm test
```

### **Docker Development**

Build and run with Docker:
```bash
# Build image
docker build -t counselor-app .

# Run container
docker run -p 8080:8080 \
  -e SQL_SERVER="your-server.database.windows.net" \
  -e SQL_DATABASE="your-database" \
  -e SQL_USER="your-username" \
  -e SQL_PASSWORD="your-password" \
  -e JWT_SECRET="your-jwt-secret" \
  counselor-app
```

---

## 📦 Deployment

### **Azure Container Apps (Production)**

The application is deployed using Azure Container Apps with automated CI/CD:

1. **Push to main branch**
```bash
git add .
git commit -m "Your changes"
git push origin main
```

2. **Automated deployment**
- GitHub Actions triggers automatically
- Docker image built and pushed to Azure Container Registry
- Azure Container Apps pulls and deploys new image
- Health checks verify deployment
- Deployment completes in ~3-5 minutes

3. **Manual deployment (if needed)**
```bash
# Using Azure CLI
az containerapp update \
  --name counselor-app \
  --resource-group CloudProjectNew \
  --image counselorsch123acr.azurecr.io/counselor-app:latest
```

### **Infrastructure as Code (Terraform)**

Deploy infrastructure with Terraform:
```bash
cd terraform

# Initialize Terraform
terraform init

# Review changes
terraform plan

# Apply infrastructure
terraform apply

# Destroy resources (when needed)
terraform destroy
```

**Resources Created:**
- Container Apps Environment
- Container App
- Container Registry (if not exists)
- Log Analytics Workspace
- Managed Identity (optional)

### **GitHub Actions Secrets Required**

Configure these secrets in your GitHub repository:
```
AZURE_CREDENTIALS  - Service principal JSON
ACR_PASSWORD       - Container registry admin password
SQL_PASSWORD       - Database password
JWT_SECRET         - JWT signing key
```

---

## 📚 API Documentation

### **Authentication Endpoints**

#### **POST /api/students/register**
Register a new student account
```json
{
  "name": "John Doe",
  "email": "john@university.edu",
  "password": "SecurePass123!"
}
```

#### **POST /api/students/login**
Student login
```json
{
  "email": "john@university.edu",
  "password": "SecurePass123!"
}
```

#### **POST /api/counselors/login**
Counselor login
```json
{
  "email": "counselor@university.edu",
  "password": "SecurePass123!"
}
```

### **Appointment Endpoints**

#### **GET /api/appointments**
Get all appointments for logged-in user
```
Headers: Authorization: Bearer <token>
```

#### **POST /api/appointments**
Create a new appointment
```json
{
  "counselorID": 1,
  "appointmentDateTime": "2025-11-15T10:00:00",
  "notes": "Need career guidance"
}
```

#### **PUT /api/appointments/:id/status**
Update appointment status (Counselor only)
```json
{
  "status": "Accepted"
}
```

### **GenAI Endpoints**

#### **POST /api/ai/chat**
Chat with AI assistant
```json
{
  "message": "How do I book an appointment?",
  "mode": "chat"
}
```

#### **POST /api/ai/wellbeing**
Get wellbeing tips
```json
{
  "message": "I'm feeling stressed about exams"
}
```

#### **POST /api/ai/recommend**
Get counselor recommendations
```json
{
  "message": "I need help with anxiety"
}
```

#### **POST /api/feedback**
Submit appointment feedback (triggers AI analysis)
```json
{
  "appointmentID": 123,
  "rating": 5,
  "feedback": "Very helpful session!"
}
```

#### **GET /api/counselors/:id/ratings**
Get AI-generated ratings for a counselor
```
Returns: Overall rating, sentiment distribution, summaries
```

### **Health & Monitoring**

#### **GET /api/health**
Health check endpoint
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-10T..."
}
```

---

## 📁 Project Structure

```
appointment_scheduler/
├── .github/
│   └── workflows/
│       └── deploy.yml                # CI/CD pipeline
├── public/
│   ├── static/
│   │   ├── styles.css                # Modern UI styles
│   │   └── chatbot.css               # Chatbot widget styles
│   ├── index.html                    # Landing page
│   ├── login.html                    # Login page
│   ├── register.html                 # Registration page
│   ├── student-dashboard.html        # Student dashboard
│   └── counselor-dashboard.html      # Counselor dashboard
├── src/
│   ├── controllers/
│   │   ├── appointment.controller.js # Appointment logic
│   │   ├── auth.controller.js        # Authentication
│   │   ├── ai.controller.js          # AI features
│   │   └── feedback.controller.js    # Feedback & ratings
│   ├── middleware/
│   │   ├── auth.middleware.js        # JWT verification
│   │   ├── rateLimiter.middleware.js # Rate limiting
│   │   └── validation.middleware.js  # Input validation
│   ├── models/
│   │   ├── student.model.js          # Student data model
│   │   ├── counselor.model.js        # Counselor data model
│   │   ├── appointment.model.js      # Appointment model
│   │   └── feedback.model.js         # Feedback model
│   ├── routes/
│   │   ├── student.routes.js         # Student endpoints
│   │   ├── counselor.routes.js       # Counselor endpoints
│   │   ├── appointment.routes.js     # Appointment endpoints
│   │   ├── ai.routes.js              # AI endpoints
│   │   └── feedback.routes.js        # Feedback endpoints
│   ├── utils/
│   │   ├── db.js                     # Database connection
│   │   ├── logger.js                 # Winston logger
│   │   ├── cache.js                  # In-memory cache
│   │   └── validators.js             # Validation functions
│   ├── config/
│   │   └── config.js                 # Configuration loader
│   ├── app.js                        # Express app setup
│   └── server.js                     # Server entry point
├── sql/
│   ├── schema.sql                    # Database schema
│   ├── seed-data.sql                 # Sample data
│   └── indexes.sql                   # Performance indexes
├── terraform/
│   ├── main.tf                       # Infrastructure definition
│   ├── variables.tf                  # Terraform variables
│   └── .gitignore                    # Terraform exclusions
├── tests/
│   └── api.test.js                   # API tests
├── Dockerfile                        # Container definition
├── .dockerignore                     # Docker exclusions
├── .env.example                      # Environment template
├── .gitignore                        # Git exclusions
├── package.json                      # Dependencies
├── DEPLOYMENT_SUCCESS.md             # Deployment guide
├── UI_IMPROVEMENTS.md                # UI documentation
└── README.md                         # This file
```

---

## 👥 Sample Accounts

### **Students**
| Email | Password | Name |
|-------|----------|------|
| `alice.johnson@university.edu` | `Password123!` | Alice Johnson |
| `bob.smith@university.edu` | `Password123!` | Bob Smith |
| `charlie.brown@university.edu` | `Password123!` | Charlie Brown |

### **Counselors**
| Email | Password | Name | Specialization |
|-------|----------|------|----------------|
| `dr.wilson@university.edu` | `Password123!` | Dr. Sarah Wilson | Academic |
| `emily.carter@university.edu` | `Password123!` | Emily Carter | Career |
| `michael.davis@university.edu` | `Password123!` | Michael Davis | Personal |

**Note:** Change passwords after first login in production!

---

## 🔒 Security Features

- ✅ **JWT Authentication** with secure token management
- ✅ **Bcrypt password hashing** (10 rounds)
- ✅ **SQL injection prevention** via parameterized queries
- ✅ **XSS protection** with input sanitization
- ✅ **CORS configuration** for controlled access
- ✅ **Rate limiting** to prevent abuse
- ✅ **Helmet.js** security headers
- ✅ **Environment variable protection**
- ✅ **HTTPS enforcement** in production
- ✅ **Session management** with token expiry

---

## 📊 Monitoring & Logging

### **Application Monitoring**
- Health check endpoint: `/api/health`
- Database connectivity verification
- Uptime tracking
- Response time metrics

### **Logging**
- Structured JSON logs
- Winston logger with multiple transports
- Correlation IDs for request tracing
- Error stack traces in development
- Production-safe logging (no sensitive data)

### **Azure Container Apps Logs**
```bash
# View real-time logs
az containerapp logs show \
  --name counselor-app \
  --resource-group CloudProjectNew \
  --follow

# View last 100 lines
az containerapp logs show \
  --name counselor-app \
  --resource-group CloudProjectNew \
  --tail 100
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### **Code Style**
- Use ES6+ features
- Follow existing code structure
- Add comments for complex logic
- Write tests for new features
- Update documentation

### **Commit Messages**
```
feat: Add new feature
fix: Bug fix
docs: Documentation update
style: Code formatting
refactor: Code refactoring
test: Test updates
chore: Maintenance tasks
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Azure OpenAI** for powerful AI capabilities
- **Microsoft Azure** for reliable cloud infrastructure
- **Node.js community** for excellent packages
- **Open source contributors** for inspiration

---

## 📞 Support

For issues, questions, or suggestions:
- 📧 Email: 220701010@rajalakshmi.edu.in
- 🐛 Issues: [GitHub Issues](https://github.com/ABISHEKPS1307/Smart-Counselor-Appointment-Scheduler/issues)
- 📖 Documentation: [Wiki](https://github.com/ABISHEKPS1307/Smart-Counselor-Appointment-Scheduler/wiki)

---

## 🎉 Final Prototype Status

### ✅ **What's Complete**

**Core Features:**
- ✅ User authentication (Students & Counselors)
- ✅ Appointment booking system
- ✅ Real-time availability checking
- ✅ Status tracking and notifications

**GenAI Features:**
- ✅ AI-powered feedback analysis
- ✅ Intelligent chatbot widget
- ✅ Smart counselor recommendations
- ✅ Sentiment analysis
- ✅ Automated rating generation

**UI/UX:**
- ✅ Modern animated interface
- ✅ Glass morphism design
- ✅ Responsive layout
- ✅ Interactive elements
- ✅ Smooth transitions

**Infrastructure:**
- ✅ Azure Container Apps deployment
- ✅ Automated CI/CD pipeline
- ✅ Docker containerization
- ✅ Terraform infrastructure as code
- ✅ Health monitoring

### 🚀 **Ready for Production!**

The application is fully functional, secure, and deployed on Azure Container Apps.

**Live URL:** https://counselor-app.happybeach-63d85bb1.centralindia.azurecontainerapps.io

---

**Made with ❤️ for university counseling centers**

**⭐ Star this repo if you find it useful!**
