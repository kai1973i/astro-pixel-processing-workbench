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

### Token Configuration (if using Freebuff Secrets)

If your `GITHUB_TOKEN` is stored in Freebuff Secrets but Git push fails with 403 errors,
you may need to:

1. **Check token scopes**: The token needs `repo` scope for Git operations
2. **Create a new token** if the current one is a Fine-Grained PAT without Git access:
   - Go to https://github.com/settings/tokens
   - Create a new token with `repo` scope (or `contents:write` for Fine-Grained)
   - Update the Freebuff Secret with the new token
3. **Verify token access**:
   ```bash
   curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
   ```
   Then test Git access:
   ```bash
   git ls-remote https://${GITHUB_TOKEN}@github.com/USERNAME/REPO.git
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
