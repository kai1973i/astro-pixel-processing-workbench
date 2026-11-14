#!/bin/bash
# Deploy Astro Pixel Processing Workbench to GitHub
# Run this script after setting up your GitHub remote

set -e

echo "=== Astro Pixel Processing Workbench - GitHub Deployment ==="
echo ""
echo "This script helps you publish the repository to GitHub."
echo ""

# Check if gh CLI is available
if command -v gh &> /dev/null; then
    echo "✓ GitHub CLI (gh) is available"
    echo ""
    
    # Check authentication
    if gh auth status &> /dev/null; then
        echo "✓ You are authenticated with GitHub"
        echo ""
        
        # Create repository
        echo "Creating repository on GitHub..."
        REPO_NAME="astro-pixel-processing-workbench"
        
        # Ask for repository name if not provided
        if [ -z "$1" ]; then
            read -p "Enter repository name [$REPO_NAME]: " input
            if [ -n "$input" ]; then
                REPO_NAME="$input"
            fi
        else
            REPO_NAME="$1"
        fi
        
        # Ask for visibility
        echo ""
        echo "Repository visibility:"
        echo "  1) Public"
        echo "  2) Private"
        read -p "Select (1/2) [1]: " visibility_choice
        
        if [ "$visibility_choice" = "2" ]; then
            VISIBILITY="private"
        else
            VISIBILITY="public"
        fi
        
        # Create repository
        echo ""
        echo "Creating $VISIBILITY repository: $REPO_NAME"
        gh repo create "$REPO_NAME" --"$VISIBILITY" --source=. --remote=origin --push
        
        echo ""
        echo "✓ Repository created and pushed successfully!"
        echo ""
        echo "Repository URL: https://github.com/$(gh config get user)/$REPO_NAME"
        
    else
        echo "✗ You are not authenticated with GitHub"
        echo ""
        echo "Please run: gh auth login"
        echo ""
        echo "After authentication, run this script again."
    fi
else
    echo "GitHub CLI (gh) is not installed."
    echo ""
    echo "=== Manual Deployment Instructions ==="
    echo ""
    echo "1. Create a new repository on GitHub:"
    echo "   - Go to https://github.com/new"
    echo "   - Enter repository name: astro-pixel-processing-workbench"
    echo "   - Choose Public or Private"
    echo "   - Click 'Create repository'"
    echo ""
    echo "2. Add the remote and push:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/astro-pixel-processing-workbench.git"
    echo "   git push -u origin main"
    echo ""
    echo "   Or with SSH:"
    echo "   git remote add origin git@github.com:YOUR_USERNAME/astro-pixel-processing-workbench.git"
    echo "   git push -u origin main"
    echo ""
    echo "3. Alternatively, install GitHub CLI:"
    echo "   macOS: brew install gh"
    echo "   Linux: See https://github.com/cli/cli#installation"
    echo "   Windows: Download from https://github.com/cli/cli/releases"
    echo ""
    echo "   Then authenticate and run this script again."
fi

echo ""
echo "=== Deployment Complete ==="
