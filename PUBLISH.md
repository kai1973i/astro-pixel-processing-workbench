# Publishing to GitHub

This guide explains how to publish the Astro Pixel Processing Workbench to GitHub.

## Quick Method (Using GitHub CLI)

If you have the GitHub CLI (`gh`) installed and authenticated:

```bash
# Authenticate with GitHub (if not already done)
gh auth login

# Create repository and push
gh repo create astro-pixel-processing-workbench --public --source=. --remote=origin --push
```

Or for a private repository:

```bash
gh repo create astro-pixel-processing-workbench --private --source=. --remote=origin --push
```

### ⚠️ Token Configuration (Important!)

**Current Issue:** Fine-Grained Personal Access Tokens (PATs starting with `github_pat_`) 
do NOT support Git operations over HTTPS. They only work with the REST API and GraphQL API.

If you encounter `403 Permission denied` errors when pushing:

#### Solution 1: Create a Classic Personal Access Token (Recommended)

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scope: `repo` (full control of private repositories)
4. Copy the token (starts with `ghp_`)
5. Use it for Git operations:
   ```bash
   git push https://USERNAME:ghp_YOUR_TOKEN@github.com/USERNAME/REPO.git main
   ```

#### Solution 2: Use GitHub CLI with Browser Login

```bash
# Clear any problematic token
export -n GITHUB_TOKEN

# Login via browser (uses session cookies, no PAT needed)
gh auth login

# Follow the interactive prompts
# This allows Git operations without PAT issues

# Then push
git push -u origin main
```

#### Solution 3: Use SSH

```bash
# Generate SSH key if needed
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub: https://github.com/settings/keys

# Configure Git to use SSH
git remote set-url origin git@github.com:USERNAME/REPO.git

# Push
git push -u origin main
```

#### Testing Token Access

Before pushing, verify your token works:

**For Classic PAT (`ghp_`):**
```bash
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
# Should show your username

# Test Git access
GIT_ASKPASS=true git ls-remote https://${GITHUB_TOKEN}@github.com/USERNAME/REPO.git
# Should list branches
```

**For Fine-Grained PAT (`github_pat_`):**
```bash
# Only works for API, NOT for Git push
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
# Works

git push https://${GITHUB_TOKEN}@github.com/USERNAME/REPO.git main
# FAILS with 403
```

## Manual Method

### Step 1: Create a Repository on GitHub

1. Go to https://github.com/new
2. Enter repository name: `astro-pixel-processing-workbench`
3. Add description (optional): "A web-based astrophotography image processing application"
4. Choose Public or Private
5. **Do NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

### Step 2: Push Your Code

```bash
# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/astro-pixel-processing-workbench.git

# Push to GitHub
git push -u origin main
```

Or with SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/astro-pixel-processing-workbench.git
git push -u origin main
```

## Using the Deploy Script

A deployment script is included: `deploy-to-github.sh`

```bash
./deploy-to-github.sh
```

This script will guide you through the process if you have `gh` CLI installed.

## After Publishing

Once published, share your repository:

- **Repository URL:** https://github.com/YOUR_USERNAME/astro-pixel-processing-workbench
- **Web App:** Open `src/index.html` in a browser or use a local server

## Project Summary

- **Name:** Astro Pixel Processing Workbench
- **Description:** Web-based astrophotography image processing application
- **Technology:** HTML5, JavaScript, Canvas API
- **No backend required** - runs entirely in the browser
- **Inspiration:** Astro Pixel Processor (https://www.astropixelprocessor.com)
- **Not a copy** - own implementation with similar workflow concepts

## Features

- Load light, bias, dark, and flat frames
- Create master calibration frames
- Calibrate light frames
- Star-based image alignment
- Frame normalization
- Stacking with multiple methods (median, average, sigma clipping)
- Background/gradient correction
- Histogram stretching and color adjustments
- Export to PNG, JPEG, WebP
- Real-time preview with zoom controls
- Test image generator
- Unit tests (21 tests passing)

## License

This project is open source. Add your preferred license (MIT, GPL, etc.) when creating the repository, or add a LICENSE file manually.
