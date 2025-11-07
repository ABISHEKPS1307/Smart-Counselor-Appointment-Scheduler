# 🚀 Deployment Guide - Automated GitHub Actions

## ✅ What's Configured

Your application is now set up for automatic deployment:
- ✅ Code cleaned and pushed to GitHub
- ✅ Dockerfile updated to Node 22
- ✅ GitHub Actions workflow created
- ✅ App Service configured: `counselor-scheduler-123`
- ✅ Database connected: `scmainserver.database.windows.net/sc-db`

## 📋 One-Time Setup Required

### Add Azure Publish Profile to GitHub Secrets

1. **Copy the Publish Profile:**
   Run this command and copy the entire XML output:
   ```powershell
   az webapp deployment list-publishing-profiles `
     --resource-group CloudProjectNew `
     --name counselor-scheduler-123 `
     --xml
   ```

2. **Add to GitHub:**
   - Go to: https://github.com/ABISHEKPS1307/Smart-Counselor-Appointment-Scheduler/settings/secrets/actions
   - Click **"New repository secret"**
   - Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Value: Paste the XML from step 1
   - Click **"Add secret"**

3. **Trigger Deployment:**
   - The workflow will run automatically when you push the workflow file
   - Or manually trigger: Go to Actions tab → Deploy to Azure App Service → Run workflow

## 🎯 How It Works

Every time you push to the `main` branch:
1. GitHub Actions builds your app
2. Installs dependencies
3. Deploys to your Azure App Service
4. Your app is live at: https://counselor-scheduler-123-bjayctaaejfccyas.centralindia-01.azurewebsites.net

## 🧪 Test Your Deployment

After setup, push the workflow file:
```powershell
git add .github/workflows/azure-deploy.yml
git commit -m "ci: add GitHub Actions deployment workflow"
git push origin main
```

Then visit:
- **GitHub Actions**: https://github.com/ABISHEKPS1307/Smart-Counselor-Appointment-Scheduler/actions
- **Your App**: https://counselor-scheduler-123-bjayctaaejfccyas.centralindia-01.azurewebsites.net

## 📊 Resources Used

All existing resources - no new costs:
- App Service: `counselor-scheduler-123`
- Resource Group: `CloudProjectNew`
- Database: `scmainserver.database.windows.net/sc-db`
- App Service Plan: `ASP-CounselorSchedulerRG-9348`

## 🔧 Troubleshooting

### Deployment fails?
- Check GitHub Actions logs
- Verify the publish profile secret is correctly added
- Ensure the app service is running

### App not responding?
- Check logs: `az webapp log tail -g CloudProjectNew -n counselor-scheduler-123`
- Restart: `az webapp restart -g CloudProjectNew -n counselor-scheduler-123`

---

**✅ Setup complete! Just add the GitHub secret and your app will auto-deploy!**
