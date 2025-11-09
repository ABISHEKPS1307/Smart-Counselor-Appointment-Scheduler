# GenAI Features Deployment Checklist

## Pre-Deployment

### 1. Database Setup ✅
- [ ] Open Azure Portal
- [ ] Navigate to SQL Database → Query Editor
- [ ] Login with SQL authentication
- [ ] Open `sql/update-schema-feedback.sql`
- [ ] Execute the script
- [ ] Verify Feedback table created successfully

### 2. Azure OpenAI Setup ✅
- [ ] Azure OpenAI resource provisioned
- [ ] Model deployed (gpt-4o-mini or gpt-4o)
- [ ] Copy endpoint URL
- [ ] Copy API key
- [ ] Copy deployment name

### 3. Environment Configuration ✅
Add to Azure App Service settings:
```
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-02-01
AI_CACHE_TTL_MINUTES=10
AI_RATE_LIMIT_MAX_REQUESTS=20
AI_RATE_LIMIT_WINDOW_MINUTES=15
```

## Deployment

### Option 1: Automated Script (Recommended)
**Windows (PowerShell):**
```powershell
.\deploy-genai-features.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x deploy-genai-features.sh
./deploy-genai-features.sh
```

### Option 2: Manual Deployment
1. Install dependencies: `npm install --production`
2. Run tests: `npm test`
3. Create zip: Package src/, public/, node_modules/, package*.json
4. Deploy: `az webapp deployment source config-zip --resource-group CloudProjectNew --name counselor-scheduler-123 --src deploy.zip`
5. Restart: `az webapp restart --name counselor-scheduler-123 --resource-group CloudProjectNew`

## Post-Deployment Testing

### Test Feedback System
1. [ ] Login as student (alice.johnson@university.edu / Password123!)
2. [ ] Go to "My Appointments" tab
3. [ ] Find a past accepted appointment
4. [ ] Click "Give Feedback" button
5. [ ] Submit feedback (min 10 chars)
6. [ ] Verify AI analysis displays (rating, sentiment, summary)
7. [ ] Login as counselor (emily.carter@university.edu / Password123!)
8. [ ] Verify feedback statistics appear on dashboard
9. [ ] Check average rating and sentiment breakdown

### Test Chatbot
1. [ ] Login as student
2. [ ] Click 💬 button (bottom-right)
3. [ ] Test Chat mode: "How do I book an appointment?"
4. [ ] Test Wellbeing mode: "Give me stress management tips"
5. [ ] Test Recommendation mode: "I need help choosing a counselor"
6. [ ] Verify responses appear correctly
7. [ ] Test quick action buttons
8. [ ] Verify typing indicator works

### Verify API Endpoints
```bash
# Health check
curl https://counselor-scheduler-123-bjayctaaejfccyas.centralindia-01.azurewebsites.net/api/health

# Test with your JWT token
curl -X POST https://counselor-scheduler-123-bjayctaaejfccyas.centralindia-01.azurewebsites.net/api/ai/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Test message","mode":"chat"}'
```

## Monitoring

### Check Logs
```bash
az webapp log tail --name counselor-scheduler-123 --resource-group CloudProjectNew
```

### Application Insights
- Open Azure Portal → Application Insights
- Check for AI request metrics
- Monitor error rates
- Review feedback submissions

### Database Verification
```sql
-- Check feedback table
SELECT COUNT(*) AS TotalFeedback FROM Feedback;

-- Check average ratings
SELECT 
    c.Name,
    COUNT(f.FeedbackID) AS Count,
    AVG(CAST(f.Rating AS FLOAT)) AS AvgRating
FROM Counselors c
LEFT JOIN Feedback f ON c.CounselorID = f.CounselorID
GROUP BY c.Name;

-- Check AI logs
SELECT TOP 10 * FROM AI_Logs 
WHERE Mode IN ('chat', 'wellbeing_tips', 'recommendation', 'analyzeFeedback')
ORDER BY CreatedAt DESC;
```

## Troubleshooting

### Issue: "AI service not configured"
- Check AZURE_OPENAI_ENDPOINT is set
- Verify API key is correct
- Check Key Vault permissions if using Managed Identity

### Issue: "Feedback table doesn't exist"
- Re-run sql/update-schema-feedback.sql
- Check SQL user has CREATE TABLE permissions

### Issue: Chatbot not appearing
- Clear browser cache
- Check console for JavaScript errors
- Verify chatbot.css and chatbot.js are loaded

### Issue: Rate limit errors
- Wait 15 minutes
- Adjust AI_RATE_LIMIT_MAX_REQUESTS if needed

## Success Criteria

✅ All checklist items completed
✅ Database schema updated
✅ App deployed successfully
✅ Health check returns 200
✅ Feedback submission works
✅ Chatbot responds correctly
✅ Counselor dashboard shows ratings
✅ No errors in Application Insights

## Rollback Plan

If issues occur:
1. Restore previous deployment: `az webapp deployment slot swap`
2. Or redeploy from previous commit
3. Database changes are additive (Feedback table can remain)

## Support

- Documentation: GENAI_FEATURES.md
- GitHub Issues: https://github.com/ABISHEKPS1307/Smart-Counselor-Appointment-Scheduler/issues
- Logs: `az webapp log tail`
