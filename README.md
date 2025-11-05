# 🎓 Smart Counselor Appointment Scheduler

A full-stack web application for managing student-counselor appointments with AI-powered recommendations using Azure OpenAI Service.

[![CI/CD Pipeline](https://github.com/your-org/appointment-scheduler/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/your-org/appointment-scheduler/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Initialize database
sqlcmd -S <server>.database.windows.net -d CounselorScheduler -U <user> -P <password> -i sql/schema.sql

# Run application
npm run dev

# Access at http://localhost:8080
```

### Docker

```bash
# Start services
docker-compose up -d

# Initialize database
docker exec -it counselor-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd" -Q "CREATE DATABASE CounselorScheduler"
docker exec -it counselor-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd" -d CounselorScheduler -i /docker-entrypoint-initdb.d/schema.sql

# Access at http://localhost:8080
```

## 📋 Features

- ✅ **User Management** - Separate authentication for students and counselors
- ✅ **Appointment Scheduling** - Book, view, and manage appointments
- ✅ **AI Assistant** - Azure OpenAI-powered recommendations
- ✅ **Security** - JWT authentication, bcrypt hashing, Azure Key Vault
- ✅ **Monitoring** - Application Insights integration
- ✅ **DevSecOps** - Automated security scanning and deployment

## 🛠️ Tech Stack

- **Frontend:** Plain HTML, CSS, JavaScript (no frameworks)
- **Backend:** Node.js 18+ with Express (ES Modules)
- **Database:** Azure SQL Database (T-SQL)
- **AI:** Azure OpenAI Service (GPT-4)
- **Container:** Docker + Docker Compose
- **IaC:** Terraform
- **CI/CD:** GitHub Actions
- **Monitoring:** Application Insights

## 📚 Documentation

- **[Complete Documentation](docs/README.md)** - Comprehensive setup and deployment guide
- **[Terraform Guide](terraform/README.md)** - Infrastructure provisioning
- **[API Documentation](docs/README.md#api-documentation)** - API endpoints reference
- **[Architecture Diagram](plantuml/architecture.puml)** - System architecture
- **[Pipeline Diagram](plantuml/devops-pipeline.puml)** - CI/CD workflow

## 🔐 Security

- JWT token authentication with short TTL
- Bcrypt password hashing (cost factor 10)
- Azure Key Vault for secrets management
- Managed Identity for secure access
- HTTPS-only enforcement
- Rate limiting on API and AI endpoints
- Input validation and SQL injection prevention
- DevSecOps security scanning in CI/CD

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/students` | POST | Register student |
| `/api/students/login` | POST | Student login |
| `/api/counselors` | POST | Register counselor |
| `/api/counselors/login` | POST | Counselor login |
| `/api/counselors` | GET | List counselors |
| `/api/appointments` | POST | Create appointment |
| `/api/appointments/student/:id` | GET | Get student appointments |
| `/api/appointments/counselor/:id` | GET | Get counselor appointments |
| `/api/appointments/:id` | PATCH | Update appointment status |
| `/api/ai/query` | POST | AI assistant query |

## 🚀 Azure Deployment

### 1. Deploy Infrastructure

```bash
cd terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

### 2. Build and Push Docker Image

```bash
az acr login --name <acr-name>
docker build -t <acr-name>.azurecr.io/counselor-app:latest .
docker push <acr-name>.azurecr.io/counselor-app:latest
```

### 3. Deploy to App Service

```bash
az webapp config container set \
  --name <app-name> \
  --resource-group <rg-name> \
  --docker-custom-image-name <acr-name>.azurecr.io/counselor-app:latest
```

## 🔄 CI/CD Pipeline

GitHub Actions pipeline includes:

1. **Security & Quality Checks**
   - ESLint code quality
   - npm audit for dependencies
   - TruffleHog secret detection
   - SonarCloud SAST

2. **Testing**
   - Unit tests with Jest
   - Code coverage reporting

3. **Infrastructure**
   - Terraform validation and deployment

4. **Build & Deploy**
   - Docker image build and push to ACR
   - Trivy container scanning
   - Azure App Service deployment
   - Health checks

## 📝 Sample Credentials

Default test accounts (password: `Password123!`):

- **Student:** `alice.johnson@university.edu`
- **Counselor:** `emily.carter@university.edu`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Support

- **Documentation:** See [docs/README.md](docs/README.md)
- **Issues:** [GitHub Issues](https://github.com/your-org/appointment-scheduler/issues)
- **Architecture:** See [plantuml/architecture.puml](plantuml/architecture.puml)

## 🎯 Project Structure

```
appointment_scheduler/
├── .github/
│   └── workflows/
│       ├── ci-cd.yml          # Main CI/CD pipeline
│       └── scan.yml           # Security scanning
├── docs/
│   └── README.md              # Complete documentation
├── plantuml/
│   ├── architecture.puml      # System architecture diagram
│   └── devops-pipeline.puml   # CI/CD pipeline diagram
├── public/
│   ├── index.html             # Frontend HTML
│   └── static/
│       ├── styles.css         # CSS styling
│       └── script.js          # JavaScript logic
├── sql/
│   └── schema.sql             # Database schema with seed data
├── terraform/
│   ├── main.tf                # Infrastructure resources
│   ├── variables.tf           # Input variables
│   ├── outputs.tf             # Output values
│   ├── providers.tf           # Provider configuration
│   └── README.md              # Terraform documentation
├── .dockerignore              # Docker ignore rules
├── .env.example               # Environment template
├── .eslintrc.json             # ESLint configuration
├── .gitignore                 # Git ignore rules
├── docker-compose.yml         # Local development setup
├── Dockerfile                 # Container definition
├── jest.config.js             # Jest configuration
├── package.json               # Node.js dependencies
├── server.js                  # Express application
├── server.test.js             # Unit tests
└── README.md                  # This file
```

---

**Built with ❤️ using Azure, Node.js, and AI**
