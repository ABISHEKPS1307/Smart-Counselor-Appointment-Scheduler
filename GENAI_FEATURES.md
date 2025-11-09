# GenAI Features Implementation Guide

## Overview

This document describes the two new AI-powered features added to the Smart Counselor Appointment Scheduler:

1. **Feedback-Based Counselor Rating System** - AI-powered sentiment analysis and rating generation from student feedback
2. **AI Chatbot for Basic Counseling Help** - Floating chat widget providing wellbeing tips and counselor recommendations

## Table of Contents

- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [Feature 1: Feedback Rating System](#feature-1-feedback-rating-system)
- [Feature 2: AI Chatbot](#feature-2-ai-chatbot)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Safety Features](#safety-features)
- [Testing](#testing)

---

## Prerequisites

### Required Services

1. **Azure OpenAI Service**
   - Deployed model: `gpt-4o-mini` or `gpt-4o`
   - API endpoint configured
   - API key available

2. **Azure SQL Database**
   - Access to run SQL scripts
   - Connection string configured

3. **Node.js Application**
   - Version 18.0.0 or higher
   - All dependencies installed

### Environment Variables

Add the following to your `.env` file:

```env
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-02-01

# AI Cache & Rate Limiting
AI_CACHE_TTL_MINUTES=10
AI_RATE_LIMIT_MAX_REQUESTS=20
AI_RATE_LIMIT_WINDOW_MINUTES=15
```

---

## Database Setup

### Step 1: Run the Feedback Schema Update

Execute the SQL script to create the Feedback table:

```bash
# Navigate to the sql directory
cd sql

# Run the script in Azure Portal Query Editor or Azure Data Studio
# File: update-schema-feedback.sql
```

The script creates:
- **Feedback table** with AI analysis fields
- **Indexes** for performance optimization
- **Foreign key constraints** for data integrity

### Feedback Table Structure

```sql
CREATE TABLE dbo.Feedback (
    FeedbackID INT IDENTITY(1,1) PRIMARY KEY,
    AppointmentID INT NOT NULL,
    StudentID INT NOT NULL,
    CounselorID INT NOT NULL,
    FeedbackText NVARCHAR(MAX) NOT NULL,
    Rating INT NOT NULL,                    -- AI-generated 1-5
    Sentiment NVARCHAR(20) NOT NULL,        -- positive/neutral/negative
    Summary NVARCHAR(500) NULL,             -- AI-generated summary
    ImprovementSuggestions NVARCHAR(1000) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
)
```

---

## Feature 1: Feedback Rating System

### Overview

Students can submit feedback for completed appointments. Azure OpenAI automatically:
- Generates a 1-5 rating based on sentiment
- Classifies sentiment (positive/neutral/negative)
- Creates a concise summary
- Provides improvement suggestions for counselors

### User Flow

#### Student Workflow

1. Navigate to "My Appointments" tab
2. Find a past accepted appointment
3. Click "📝 Give Feedback" button
4. Write feedback (minimum 10 characters)
5. Submit feedback
6. View AI-generated analysis:
   - Rating (1-5 stars)
   - Sentiment classification
   - Summary

#### Counselor Workflow

1. View counselor dashboard
2. See **Feedback Summary** card showing:
   - Average rating with stars
   - Total feedback count
   - Sentiment breakdown
3. Review **Recent Feedback** section with:
   - Individual ratings
   - Sentiment indicators
   - AI summaries
   - Improvement suggestions

### Backend Implementation

#### API Endpoints

**Submit Feedback**
```http
POST /api/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "appointmentID": 1,
  "studentID": 1,
  "counselorID": 1,
  "feedback": "Great session, very helpful advice on career planning..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "feedback": {
      "FeedbackID": 1,
      "AppointmentID": 1,
      "Rating": 5,
      "Sentiment": "positive",
      "Summary": "Student found the career planning advice very helpful",
      "CreatedAt": "2024-01-15T10:30:00Z"
    },
    "analysis": {
      "rating": 5,
      "sentiment": "positive",
      "summary": "Student found the career planning advice very helpful"
    }
  },
  "message": "Feedback submitted and analyzed successfully"
}
```

**Get Counselor Feedback**
```http
GET /api/feedback/counselor/:counselorId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "feedback": [...],
    "statistics": {
      "totalFeedback": 15,
      "averageRating": 4.2,
      "sentimentBreakdown": {
        "positive": 12,
        "neutral": 2,
        "negative": 1
      }
    }
  }
}
```

#### Files Modified/Created

**Backend:**
- `sql/update-schema-feedback.sql` - Database schema
- `src/models/feedback.model.js` - Data access layer
- `src/controllers/feedback.controller.js` - Business logic
- `src/routes/feedback.routes.js` - API routes
- `src/app.js` - Route registration
- `src/utils/aiClient.js` - Added `analyzeFeedback` mode

**Frontend:**
- `public/student-dashboard.html` - Added feedback modal
- `public/static/student-dashboard.js` - Feedback submission logic
- `public/counselor-dashboard.html` - Added feedback display
- `public/static/counselor-dashboard.js` - Feedback loading logic

### AI Prompt for Feedback Analysis

```javascript
const aiPrompt = `Analyze this student feedback about a counseling session and provide structured analysis:

Feedback: "${feedback}"

Return a JSON object with the following structure:
{
  "rating": <number 1-5 based on sentiment and content>,
  "sentiment": "<positive|neutral|negative>",
  "summary": "<1-2 sentence summary of key points>",
  "improvementSuggestions": "<optional constructive suggestions for the counselor>"
}

Be objective, constructive, and professional. Base the rating on overall satisfaction expressed.`;
```

### Rate Limiting

- **5 feedback submissions per 15 minutes** per student
- Prevents spam and abuse
- Configured in `feedback.routes.js`

---

## Feature 2: AI Chatbot

### Overview

A floating chat widget provides instant support to students with three modes:
1. **Chat** - General questions about the platform
2. **Wellbeing Tips** - Stress management and wellness advice
3. **Recommendation** - Counselor type suggestions based on needs

### Features

- 💬 Floating chat button (bottom right)
- 🎯 Three specialized chat modes
- ⚡ Response caching (10 minutes)
- 🛡️ Safety guardrails for sensitive topics
- 📱 Mobile responsive design

### User Interface

#### Chat Widget Components

1. **Toggle Button**
   - 60px circular button with gradient
   - Fixed bottom-right corner
   - Opens/closes chat window

2. **Chat Window**
   - 360px wide, 500px height
   - Header with mode selector
   - Scrollable message area
   - Input field with send button

3. **Chat Modes**
   - **Chat**: General assistance
   - **Wellbeing**: Wellness tips
   - **Recommendation**: Counselor matching

### Backend Implementation

#### AI Modes

**1. Chat Mode**
```javascript
systemMessage: 'You are a helpful AI assistant for a counselor appointment scheduler. 
Provide concise, supportive, and helpful responses. Never provide medical advice or 
diagnoses. If a student mentions serious mental health concerns, suicide, self-harm, 
or crisis situations, always recommend they contact a real counselor immediately or 
call emergency services.'
```

**2. Wellbeing Tips Mode**
```javascript
systemMessage: 'You are a wellbeing assistant providing general wellness tips and 
stress management advice. Provide simple, actionable, and positive suggestions for 
students. Never provide medical advice or diagnoses. Keep responses brief and 
supportive. If serious issues are mentioned, recommend consulting a real counselor.'
```

**3. Recommendation Mode**
```javascript
systemMessage: 'You are an AI counselor recommendation assistant. Based on the 
student\'s needs, suggest the most suitable counselor type (Academic, Career, 
Personal, or Mental Health) and explain why. Be concise and helpful. For serious 
mental health concerns, always recommend Mental Health counselors and suggest 
seeking immediate help.'
```

#### API Endpoint

**Send Chat Message**
```http
POST /api/ai/query
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "I'm feeling stressed about exams",
  "mode": "wellbeing_tips"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Here are some tips for exam stress:\n\n1. Take regular breaks...",
    "mode": "wellbeing_tips",
    "cached": false
  },
  "message": "AI query successful"
}
```

#### Files Created

**Frontend:**
- `public/static/chatbot.css` - Chat widget styles
- `public/static/chatbot.js` - Chat functionality
- Updated `public/student-dashboard.html` - Include chatbot

**Backend:**
- Updated `src/utils/aiClient.js` - New AI modes
- Updated `src/controllers/ai.controller.js` - Mode handling

### Quick Actions

Pre-defined prompts for common questions:
- "How do I book an appointment?"
- "Give me stress management tips"
- "Help me choose a counselor"

### Rate Limiting

- **20 AI requests per 15 minutes** per user
- Applied to all AI endpoints
- Configured in `ai.routes.js`

---

## API Endpoints

### Feedback Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/feedback` | Student | Submit feedback with AI analysis |
| GET | `/api/feedback/counselor/:id` | Counselor, Admin | Get counselor feedback & stats |
| GET | `/api/feedback/student/:id` | Student, Admin | Get student's feedback history |
| GET | `/api/feedback/appointment/:id` | Student, Counselor, Admin | Get feedback for specific appointment |

### AI Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/query` | Authenticated | Send chat message to AI |
| GET | `/api/ai/cache/stats` | Admin | View cache statistics |

---

## Safety Features

### AI Safety Guardrails

1. **Crisis Detection**
   - Keywords: suicide, self-harm, emergency
   - Response: "Please contact a real counselor immediately or call emergency services"

2. **No Medical Advice**
   - Explicitly instructed not to diagnose
   - Redirects to professional counselors

3. **Positive Focus**
   - Constructive feedback analysis
   - Supportive wellness advice

4. **Rate Limiting**
   - Prevents API abuse
   - 20 requests per 15 minutes

### Data Privacy

- All AI interactions logged in `AI_Logs` table
- Feedback is anonymized for counselors (no student personal data exposed)
- JWT authentication required for all endpoints

### Input Validation

- Feedback: 10-1000 characters
- Prompt: Required, string type
- Mode: Must be valid mode name
- Parameterized SQL queries prevent injection

---

## Testing

### Manual Testing Checklist

#### Feedback System

**Student Side:**
- [ ] Submit feedback for past appointment
- [ ] View AI-generated rating and sentiment
- [ ] Try submitting duplicate feedback (should fail)
- [ ] Submit feedback under 10 characters (should fail)
- [ ] Verify feedback appears in appointments list

**Counselor Side:**
- [ ] View feedback statistics on dashboard
- [ ] Check average rating calculation
- [ ] Review sentiment breakdown
- [ ] Read recent feedback summaries
- [ ] View improvement suggestions

#### Chatbot

**General:**
- [ ] Click chat button to open widget
- [ ] Close chat widget
- [ ] Send message in each mode
- [ ] Test quick action buttons
- [ ] Verify typing indicator appears
- [ ] Check mobile responsiveness

**Safety:**
- [ ] Mention crisis keywords (should redirect to help)
- [ ] Ask for medical advice (should decline)
- [ ] Test rate limiting (send 20+ messages)

### Database Verification

```sql
-- Check feedback table
SELECT COUNT(*) FROM Feedback;
SELECT AVG(CAST(Rating AS FLOAT)) AS AvgRating FROM Feedback;

-- Check AI logs
SELECT COUNT(*) FROM AI_Logs WHERE Mode IN ('chat', 'wellbeing_tips', 'recommendation', 'analyzeFeedback');

-- View feedback statistics for counselor
SELECT 
    c.Name,
    COUNT(f.FeedbackID) AS TotalFeedback,
    AVG(CAST(f.Rating AS FLOAT)) AS AvgRating,
    SUM(CASE WHEN f.Sentiment = 'positive' THEN 1 ELSE 0 END) AS PositiveCount
FROM Counselors c
LEFT JOIN Feedback f ON c.CounselorID = f.CounselorID
GROUP BY c.CounselorID, c.Name;
```

### API Testing with cURL

**Submit Feedback:**
```bash
curl -X POST http://localhost:8080/api/feedback \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentID": 1,
    "studentID": 1,
    "counselorID": 1,
    "feedback": "Excellent counseling session! Very insightful and helpful advice."
  }'
```

**Chat with AI:**
```bash
curl -X POST http://localhost:8080/api/ai/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "How can I manage exam stress?",
    "mode": "wellbeing_tips"
  }'
```

---

## Deployment

### Pre-Deployment Checklist

1. **Environment Variables**
   - [ ] Azure OpenAI endpoint configured
   - [ ] API key stored in Azure Key Vault
   - [ ] Rate limit settings adjusted for production

2. **Database**
   - [ ] Feedback table created
   - [ ] Indexes created
   - [ ] Backup created

3. **Dependencies**
   - [ ] All npm packages installed
   - [ ] No security vulnerabilities

4. **Testing**
   - [ ] All manual tests passed
   - [ ] API endpoints tested
   - [ ] UI/UX verified

### Deployment Steps

1. **Database Migration**
```bash
# Run the SQL script in Azure Portal
sql/update-schema-feedback.sql
```

2. **Deploy Application**
```bash
# Install dependencies
npm install

# Run tests
npm test

# Build and deploy
npm run build
```

3. **Verify Deployment**
   - Check Azure App Service logs
   - Test feedback submission
   - Test chatbot functionality
   - Monitor Application Insights

---

## Monitoring

### Key Metrics

1. **Feedback System**
   - Total feedback submissions per day
   - Average rating trend
   - Sentiment distribution
   - AI analysis failures

2. **Chatbot**
   - Total chat sessions
   - Messages per session
   - Mode usage distribution
   - Cache hit rate
   - AI service errors

### Application Insights Queries

**Feedback Submissions:**
```kusto
customEvents
| where name == "FeedbackSubmitted"
| summarize count() by bin(timestamp, 1d)
```

**AI Requests:**
```kusto
customEvents
| where name == "AIRequest"
| summarize count() by tostring(customDimensions.mode)
```

**AI Errors:**
```kusto
traces
| where message contains "AI request failed"
| project timestamp, message, severityLevel
```

---

## Troubleshooting

### Common Issues

#### "AI service not configured"

**Cause:** Azure OpenAI API key not available

**Solution:**
1. Check `.env` file has `AZURE_OPENAI_API_KEY`
2. Verify Key Vault secret name matches
3. Check Managed Identity permissions

#### "Failed to parse AI analysis"

**Cause:** AI returned non-JSON response

**Solution:**
1. Check AI model version (use gpt-4o-mini or gpt-4o)
2. Review system prompt in `aiClient.js`
3. Falls back to default values automatically

#### "Rate limit exceeded"

**Cause:** Too many requests

**Solution:**
1. Wait 15 minutes
2. Adjust rate limits in `.env` if needed
3. Implement user-specific quotas

#### Feedback button not showing

**Cause:** Appointment criteria not met

**Solution:**
- Feedback only shows for **accepted** appointments that are in the **past**
- Check appointment status and date

---

## Security Considerations

1. **API Key Protection**
   - Store in Azure Key Vault
   - Never commit to source control
   - Rotate regularly

2. **Input Sanitization**
   - All inputs validated
   - SQL injection prevented (parameterized queries)
   - XSS protection (HTML escaping)

3. **Rate Limiting**
   - Prevents abuse
   - Protects Azure OpenAI costs
   - User-specific limits

4. **Authentication**
   - JWT tokens required
   - Role-based access control
   - Token expiration enforced

---

## Cost Optimization

### Azure OpenAI Usage

**Estimated Costs:**
- Feedback analysis: ~200 tokens/request
- Chat messages: ~300 tokens/request
- With caching: ~30% reduction

**Optimization Tips:**
1. Increase cache TTL for stable responses
2. Use gpt-4o-mini (cheaper than gpt-4o)
3. Implement aggressive rate limiting
4. Monitor token usage in Application Insights

---

## Future Enhancements

### Potential Features

1. **Enhanced Feedback**
   - Multi-language support
   - Feedback trends over time
   - Counselor comparison dashboard

2. **Advanced Chatbot**
   - Conversation context memory
   - Appointment booking via chat
   - Voice input support

3. **Analytics**
   - Sentiment analysis dashboard
   - Counselor performance metrics
   - Student satisfaction reports

4. **Notifications**
   - Email alerts for low ratings
   - Slack integration for feedback
   - Real-time dashboard updates

---

## Support

For issues or questions:
- Check Application Insights logs
- Review error messages in browser console
- Contact the development team

---

## Changelog

### v1.0.0 (2024-01-15)

**Added:**
- Feedback-based counselor rating system
- AI chatbot with three modes
- Real-time AI analysis
- Safety guardrails for sensitive content
- Comprehensive dashboard views

**Database:**
- New Feedback table
- Performance indexes
- Foreign key constraints

**Frontend:**
- Feedback modal for students
- Feedback statistics for counselors
- Floating chatbot widget
- Mobile-responsive design

**Backend:**
- Feedback API endpoints
- Enhanced AI client with new modes
- Rate limiting for AI requests
- Comprehensive error handling
