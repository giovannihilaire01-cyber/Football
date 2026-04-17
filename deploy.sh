#!/bin/bash
# Manual GitHub Pages deployment script

set -e

echo "🔨 Building project..."
npm run build

echo "📦 Creating deployment files..."
mkdir -p gh-pages-deploy
cp -r dist/* gh-pages-deploy/ 2>/dev/null || true

echo "🚀 Preparing gh-pages branch..."

# Save current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Create or checkout gh-pages branch
if git rev-parse --verify gh-pages >/dev/null 2>&1; then
  git checkout gh-pages
else
  git checkout --orphan gh-pages
fi

# Remove all files except .git
git rm -rf . || true

# Copy new files
cp -r ../gh-pages-deploy/* . 2>/dev/null || true
cp ../gh-pages-deploy/.nojekyll . 2>/dev/null || true

# Stage and commit
git add -A
git commit -m "Deploy to GitHub Pages" || echo "No changes to commit"

# Push
git push origin gh-pages

# Return to original branch
git checkout $CURRENT_BRANCH

echo "✅ Deployment complete!"
echo "📍 Your site is available at: https://giovannihilaire01-cyber.github.io/Football/"
