# Smart Counselor Appointment Scheduler - Setup Instructions

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Azure CLI** (for Azure SQL Database access)
   - Download from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
   - Verify installation: `az --version`

4. **Azure Account** with access to:
   - Azure SQL Database
   - Azure OpenAI (optional, for AI features)

---

## 🚀 Step-by-Step Setup

### Step 1: Clone or Download the Project

If you haven't already, download the project to your local machine.

```bash
cd d:\appointment_scheduler
```

### Step 2: Install Dependencies

Install all required Node.js packages:

```bash
npm install
```

This will install all dependencies listed in `package.json`.

### Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```

2. Open `.env` file and update the following values:

   **Required Database Configuration:**
   ```env
   SQL_SERVER=scmainserver.database.windows.net
   SQL_DATABASE=sc-db
   SQL_USER=adminuser
   SQL_PASSWORD=Admin@user
   SQL_ENCRYPT=true
   SQL_TRUST_SERVER_CERTIFICATE=false
   ```

   **Optional AI Configuration (if using Azure OpenAI):**
   ```env
   AZURE_OPENAI_ENDPOINT=https://your-openai-resource.openai.azure.com/
   AZURE_OPENAI_API_KEY=your-api-key-here
   AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
   AZURE_OPENAI_API_VERSION=2023-05-15
   ```

### Step 4: Login to Azure

Login to your Azure account to access the SQL Database:

```bash
az login --use-device-code
```

Follow the prompts to authenticate.

### Step 5: Configure Firewall Rules

Your IP address must be allowed in the Azure SQL Server firewall. Run this command (replace with your actual resource group if different):

```bash
az sql server firewall-rule create --resource-group CloudProjectNew --server scmainserver --name "MyDevelopmentIP" --start-ip-address YOUR_IP --end-ip-address YOUR_IP
```

**Note:** The error message will tell you your current IP if denied. You can also find your IP by visiting: https://whatismyipaddress.com/

### Step 6: Initialize the Database (First Time Only)

The database schema should already be set up, but if needed, you can find SQL scripts in the `sql/` folder.

### Step 7: Start the Development Server

```bash
npm run dev
```

The server will start with hot-reloading enabled (automatically restarts on file changes).

**Expected Output:**
```
✅ Database connected successfully
🚀 Server started on port 8080
📝 Environment: development
💾 Database: scmainserver.database.windows.net/sc-db
📚 API Docs: http://localhost:8080/api-docs
✅ Server is ready to accept connections
```

### Step 8: Access the Application

Open your web browser and navigate to:

- **Main Application:** http://localhost:8080
- **API Documentation:** http://localhost:8080/api-docs

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm start` | Start production server |
| `npm test` | Run test suite |
| `npm run lint` | Check code for linting errors |

---

## 📱 Using the Application

### 1. Register a New Account

1. Click **Register** button
2. Choose user type: **Student** or **Counselor**
3. Fill in your details:
   - Full Name
   - Email Address
   - Password (minimum 8 characters)
4. If registering as a **Counselor**, also provide:
   - Counselor Type (Academic, Career, Personal, Mental Health)
   - Bio
5. Click **Register**

### 2. Login

1. Click **Login** button
2. Select your user type
3. Enter your email and password
4. Click **Login**

### 3. Book an Appointment (Students Only)

1. After logging in, click **Book Appointment**
2. Select counselor type
3. Choose a counselor from the dropdown
4. Select date and time
5. Click **Book Appointment**
6. Optional: Use **AI Recommendation** for guidance

### 4. View Appointments

- Click **My Appointments** to see all your scheduled appointments
- Students see their booked appointments
- Counselors see appointments requested with them

### 5. Use AI Assistant

- Click the floating **AI bot icon** in the bottom-right corner
- Ask questions about counseling, scheduling, or academic guidance
- Get intelligent recommendations

---

## 🛠️ Troubleshooting

### Issue: Database Connection Failed

**Error:** `Client with IP address 'X.X.X.X' is not allowed to access the server`

**Solution:**
1. Note your IP address from the error message
2. Add your IP to the firewall:
   ```bash
   az sql server firewall-rule create --resource-group CloudProjectNew --server scmainserver --name "MyIP" --start-ip-address YOUR_IP --end-ip-address YOUR_IP
   ```
3. Wait 2-5 minutes for the firewall rule to propagate
4. Restart the server

### Issue: Azure Login Required

**Error:** `No authentication token` or `Azure CLI not logged in`

**Solution:**
```bash
az login --use-device-code
```

### Issue: Port Already in Use

**Error:** `Port 8080 is already in use`

**Solution:**
- Kill the process using port 8080, or
- Change the port in `.env` file:
  ```env
  PORT=3000
  ```

### Issue: Module Not Found

**Solution:**
```bash
npm install
```

---

## 🌐 API Endpoints

### Authentication
- `POST /api/students/register` - Register new student
- `POST /api/students/login` - Student login
- `POST /api/counselors/register` - Register new counselor
- `POST /api/counselors/login` - Counselor login

### Counselors
- `GET /api/counselors` - Get all counselors (public)
- `GET /api/counselors/profile` - Get counselor profile (auth required)
- `PUT /api/counselors/profile` - Update counselor profile (auth required)

### Appointments
- `POST /api/appointments` - Create appointment (student, auth required)
- `GET /api/appointments/student/:id` - Get student appointments (auth required)
- `GET /api/appointments/counselor/:id` - Get counselor appointments (auth required)

### AI Assistant
- `POST /api/ai/query` - Query AI assistant (auth required)

---

## 🔐 Security Notes

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Change default passwords** in production
3. **Use HTTPS** in production environments
4. **Enable Azure Key Vault** for production secrets
5. **Implement rate limiting** in production

---

## 📞 Support

For issues or questions:
1. Check the **Troubleshooting** section above
2. Review the **API Documentation** at http://localhost:8080/api-docs
3. Check server logs in the terminal

---

## 🎨 Features

- ✅ JWT-based authentication
- ✅ Role-based access control (Student/Counselor)
- ✅ Real-time appointment booking
- ✅ Azure SQL Database integration
- ✅ Azure OpenAI integration
- ✅ Professional UI with modern color scheme
- ✅ Responsive design
- ✅ API documentation with Swagger
- ✅ Comprehensive error handling
- ✅ Logging and monitoring ready

---

**Version:** 1.0.0  
**Last Updated:** November 2025
