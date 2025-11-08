# GitHub Setup Guide

Step-by-step instructions to create a new GitHub repository named **new-usa-luxury-limo-service** and upload your project files.

## Prerequisites

- GitHub account ([sign up free](https://github.com/signup))
- Git installed on your computer
- Your project files ready (this directory)

## Option 1: Using GitHub Web Interface (Easiest)

### Step 1: Create Repository on GitHub

1. **Login to GitHub**
   - Go to [github.com](https://github.com)
   - Sign in to your account

2. **Create New Repository**
   - Click the **+** icon in top-right corner
   - Select **New repository**

3. **Configure Repository**
   - **Repository name**: `new-usa-luxury-limo-service`
   - **Description** (optional): `Luxury transportation booking platform with real-time pricing and dispatch management`
   - **Visibility**: Choose **Private** (recommended) or **Public**
   - **DO NOT** check "Add a README file" (we already have one)
   - **DO NOT** add .gitignore or license (we already have these)
   - Click **Create repository**

### Step 2: Upload Files from Your Computer

After creating the repository, GitHub will show you instructions. Follow these commands:

1. **Open Terminal/Command Prompt**
   - Navigate to your project directory:
     ```bash
     cd /path/to/your/project
     ```

2. **Initialize Git Repository**
   ```bash
   git init
   ```

3. **Add All Files**
   ```bash
   git add .
   ```

4. **Create Initial Commit**
   ```bash
   git commit -m "Initial commit: USA Luxury Limo Service"
   ```

5. **Add GitHub as Remote**
   Replace `YOUR_USERNAME` with your actual GitHub username:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/new-usa-luxury-limo-service.git
   ```

6. **Push to GitHub**
   ```bash
   git branch -M main
   git push -u origin main
   ```

7. **Enter Credentials**
   - Username: Your GitHub username
   - Password: Use a **Personal Access Token** (not your password)

### Step 3: Create Personal Access Token (If Needed)

If GitHub prompts for a token instead of password:

1. Go to [GitHub Settings → Developer Settings](https://github.com/settings/tokens)
2. Click **Personal access tokens** → **Tokens (classic)**
3. Click **Generate new token** → **Generate new token (classic)**
4. Give it a name: `Coolify Deployment`
5. Select scopes:
   - ✅ `repo` (Full control of private repositories)
6. Click **Generate token**
7. **COPY THE TOKEN** (you won't see it again!)
8. Use this token as your password when pushing

### Step 4: Verify Upload

1. **Visit Your Repository**
   ```
   https://github.com/YOUR_USERNAME/new-usa-luxury-limo-service
   ```

2. **Check Files are Present:**
   - ✅ README.md
   - ✅ Dockerfile
   - ✅ docker-compose.yml
   - ✅ DEPLOYMENT.md
   - ✅ package.json
   - ✅ .gitignore
   - ✅ client/ folder
   - ✅ server/ folder
   - ✅ shared/ folder

3. **Verify Sensitive Files are NOT Uploaded:**
   - ❌ .env (should not be visible)
   - ❌ node_modules (should not be visible)
   - ❌ dist (should not be visible)

## Option 2: Using GitHub Desktop (User-Friendly GUI)

### Step 1: Download GitHub Desktop

1. Download from [desktop.github.com](https://desktop.github.com/)
2. Install and sign in with your GitHub account

### Step 2: Add Your Project

1. Click **File** → **Add Local Repository**
2. Choose your project folder
3. If Git is not initialized, click **Create Repository**

### Step 3: Create Repository on GitHub

1. Click **Publish repository** button
2. Name: `new-usa-luxury-limo-service`
3. Description: `Luxury transportation booking platform`
4. Choose **Private** or **Public**
5. Click **Publish Repository**

### Step 4: Commit and Push Changes

1. Review files in "Changes" tab
2. Add commit message: `Initial commit: USA Luxury Limo Service`
3. Click **Commit to main**
4. Click **Push origin**

## Option 3: Using Git Command Line (Advanced)

For users comfortable with Git:

```bash
# Navigate to project directory
cd /path/to/your/project

# Initialize repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: USA Luxury Limo Service"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/new-usa-luxury-limo-service.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Verify Your Repository

After uploading, your repository should include:

### Essential Files for Deployment
- ✅ `Dockerfile` - Docker build configuration
- ✅ `docker-compose.yml` - Local testing setup
- ✅ `.dockerignore` - Excludes unnecessary files from Docker
- ✅ `.env.example` - Environment variable template

### Documentation
- ✅ `README.md` - Project overview
- ✅ `DEPLOYMENT.md` - Comprehensive deployment guide
- ✅ `QUICK_START.md` - 5-minute deployment guide
- ✅ `GITHUB_SETUP.md` - This file
- ✅ `DEPLOYMENT_CHECKLIST.md` - Validation checklist
- ✅ `ARCHITECTURE.md` - System architecture

### Application Code
- ✅ `client/` - Frontend React application
- ✅ `server/` - Backend Express application
- ✅ `shared/` - Shared types and schemas
- ✅ `package.json` - Dependencies
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `vite.config.ts` - Build configuration

### Files That Should NOT Be Uploaded
- ❌ `node_modules/` - Excluded via .gitignore
- ❌ `.env` - Excluded via .gitignore (contains secrets)
- ❌ `dist/` - Excluded via .gitignore (generated)
- ❌ `.replit` - Excluded via .gitignore
- ❌ `*.log` - Excluded via .gitignore

## Connect Coolify to Your Repository

Once your repository is on GitHub:

1. **In Coolify Dashboard:**
   - Go to **Sources** → **GitHub**
   - Click **Connect GitHub Account** (if not already connected)
   - Authorize Coolify to access your repositories

2. **When Creating Application:**
   - Select your connected GitHub source
   - Choose repository: `new-usa-luxury-limo-service`
   - Select branch: `main`
   - Coolify will use your `Dockerfile` automatically

3. **Enable Auto-Deploy (Optional):**
   - In app settings, enable "Auto Deploy on Commit"
   - Every push to `main` branch will trigger deployment

## Troubleshooting

### "Fatal: Not a Git Repository"
```bash
# Initialize Git first
git init
```

### "Remote Already Exists"
```bash
# Remove existing remote
git remote remove origin

# Add correct remote
git remote add origin https://github.com/YOUR_USERNAME/new-usa-luxury-limo-service.git
```

### "Permission Denied (Publickey)"
Use HTTPS instead of SSH:
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/new-usa-luxury-limo-service.git
```

### "Repository Not Found"
- Verify repository name is exactly: `new-usa-luxury-limo-service`
- Check repository visibility (private repos require authentication)
- Ensure you're using the correct GitHub username

### Files Not Uploading
```bash
# Check what's being tracked
git status

# If files are in .gitignore, they won't upload
# This is correct for node_modules, .env, etc.

# To force add a file (use carefully):
git add -f filename
```

### Large Files Rejected
GitHub has a 100MB file size limit. If you have large files:
- Don't commit `node_modules` (use .gitignore)
- Don't commit build outputs (`dist/`)
- Use Git LFS for large assets (if needed)

## Update Your Repository Later

After making changes to your code:

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Add new feature X"

# Push to GitHub
git push origin main
```

If auto-deploy is enabled in Coolify, this will automatically trigger a new deployment.

## Repository Settings Recommendations

### Branch Protection (Optional)
For team projects, protect your main branch:
1. Go to repository **Settings** → **Branches**
2. Click **Add rule** for `main` branch
3. Enable:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass

### Secrets (For GitHub Actions)
If using GitHub Actions (see `.github/workflows/`):
1. Go to repository **Settings** → **Secrets**
2. Add secrets needed for CI/CD
3. Never commit secrets to code

### Webhooks
Coolify automatically sets up webhooks for auto-deployment. You can view them in:
- Repository **Settings** → **Webhooks**

## Next Steps

After your repository is on GitHub:

1. ✅ Verify all files uploaded correctly
2. ✅ Connect Coolify to your GitHub account
3. ✅ Follow [QUICK_START.md](QUICK_START.md) to deploy
4. ✅ Use [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) to verify

## Need Help?

- GitHub Docs: [docs.github.com](https://docs.github.com)
- Git Documentation: [git-scm.com/doc](https://git-scm.com/doc)
- Coolify GitHub Integration: [coolify.io/docs](https://coolify.io/docs)

---

**Ready to Deploy?** See [QUICK_START.md](QUICK_START.md) for Coolify deployment instructions.
