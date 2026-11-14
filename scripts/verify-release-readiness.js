#!/usr/bin/env node

/**
 * Verify Release Readiness for Astro Pixel Processing Workbench
 * 
 * This script checks that all required files for GitHub release are present
 * and contain meaningful content (not empty placeholders).
 */

const fs = require('fs');
const path = require('path');

// Color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function logSuccess(message) {
  console.log(colors.green + '✓ ' + message + colors.reset);
}

function logError(message) {
  console.error(colors.red + '✗ ' + message + colors.reset);
}

function logWarning(message) {
  console.log(colors.yellow + '⚠ ' + message + colors.reset);
}

function logInfo(message) {
  console.log(colors.blue + 'ℹ ' + message + colors.reset);
}

// Required files for release
const requiredFiles = [
  { path: 'README.md', minSize: 1000, description: 'Project overview and documentation' },
  { path: 'LICENSE', minSize: 500, description: 'Open source license' },
  { path: 'PUBLISH.md', minSize: 1000, description: 'Publishing guide for GitHub' },
  { path: 'deploy-to-github.sh', minSize: 500, description: 'Deployment helper script', executable: true },
  { path: 'package.json', minSize: 100, description: 'Node.js package configuration' },
  { path: 'src/index.html', minSize: 500, description: 'Main application HTML' },
  { path: 'src/css/style.css', minSize: 500, description: 'Application styles' },
  { path: 'src/js/app.js', minSize: 1000, description: 'Main application controller' },
  { path: 'src/js/imageProcessor.js', minSize: 500, description: 'Core image processing' },
  { path: 'src/js/calibration.js', minSize: 500, description: 'Calibration handling' },
  { path: 'src/js/aligner.js', minSize: 500, description: 'Image alignment' },
  { path: 'src/js/stacker.js', minSize: 500, description: 'Stacking engine' },
  { path: 'src/js/colorCorrect.js', minSize: 500, description: 'Color correction' },
  { path: 'src/js/export.js', minSize: 300, description: 'Export functionality' },
  { path: '.gitignore', minSize: 100, description: 'Git ignore rules' },
  { path: 'docs/architecture.md', minSize: 500, description: 'Architecture documentation' },
  { path: 'docs/workflow.md', minSize: 500, description: 'Workflow guide' },
  { path: 'tests/simple-test.js', minSize: 500, description: 'Test suite' },
];

// Required directories
const requiredDirs = [
  'src/js',
  'src/css',
  'docs',
  'tests',
  'tools',
  '.github',
  '.github/ISSUE_TEMPLATE',
  'scripts'
];

// Check if file exists and has minimum size
function checkFile(filePath, minSize, description, mustBeExecutable = false) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    return {
      status: 'missing',
      path: filePath,
      description: description,
      message: `File does not exist: ${filePath}`
    };
  }
  
  const stats = fs.statSync(fullPath);
  const size = stats.size;
  
  // Check if executable permission is set
  if (mustBeExecutable) {
    const isExecutable = (stats.mode & 0o111) !== 0;
    if (!isExecutable) {
      return {
        status: 'warning',
        path: filePath,
        description: description,
        message: `File exists but is not executable (chmod +x ${filePath})`
      };
    }
  }
  
  if (size < minSize) {
    return {
      status: 'error',
      path: filePath,
      description: description,
      message: `File too small: ${size} bytes (minimum: ${minSize} bytes)`
    };
  }
  
  // Check for empty/placeholder content
  const content = fs.readFileSync(fullPath, 'utf-8');
  const hasContent = content.trim().length > 0 && !content.includes('TODO') && !content.includes('PLACEHOLDER');
  
  if (!hasContent) {
    return {
      status: 'error',
      path: filePath,
      description: description,
      message: 'File appears to be empty or contains placeholder text'
    };
  }
  
  return {
    status: 'ok',
    path: filePath,
    description: description,
    size: size,
    message: `OK - ${size} bytes`
  };
}

// Check if directory exists
function checkDir(dirPath) {
  const fullPath = path.join(__dirname, '..', dirPath);
  
  if (!fs.existsSync(fullPath)) {
    return {
      status: 'missing',
      path: dirPath,
      message: `Directory does not exist: ${dirPath}`
    };
  }
  
  return {
    status: 'ok',
    path: dirPath,
    message: 'Directory exists'
  };
}

// Main verification
console.log('');
console.log(colors.bold + '═══════════════════════════════════════════════════════════' + colors.reset);
console.log(colors.bold + '  Astro Pixel Processing Workbench - Release Readiness Check' + colors.reset);
console.log(colors.bold + '═══════════════════════════════════════════════════════════');
console.log('');

const results = {
  files: [],
  directories: [],
  summary: {
    total: 0,
    ok: 0,
    warning: 0,
    error: 0,
    missing: 0
  }
};

// Check required files
console.log(colors.bold + '📁 Checking Required Files...' + colors.reset);
console.log('');

requiredFiles.forEach(file => {
  const result = checkFile(file.path, file.minSize, file.description, file.executable);
  results.files.push(result);
  results.summary.total++;
  
  switch (result.status) {
    case 'ok':
      results.summary.ok++;
      logSuccess(`${file.path}`);
      log(`    ${result.message}`, 'reset');
      break;
    case 'warning':
      results.summary.warning++;
      logWarning(`${file.path}`);
      log(`    ${result.message}`, 'reset');
      break;
    case 'error':
      results.summary.error++;
      logError(`${file.path}`);
      log(`    ${result.message}`, 'reset');
      break;
    case 'missing':
      results.summary.missing++;
      logError(`${file.path}`);
      log(`    ${result.message}`, 'reset');
      break;
  }
});

console.log('');
console.log(colors.bold + '📂 Checking Required Directories...' + colors.reset);
console.log('');

requiredDirs.forEach(dir => {
  const result = checkDir(dir);
  results.directories.push(result);
  results.summary.total++;
  
  if (result.status === 'ok') {
    logSuccess(`${dir}/`);
  } else {
    results.summary.missing++;
    logError(`${dir}/`);
    log(`    ${result.message}`, 'reset');
  }
});

console.log('');
console.log(colors.bold + '═══════════════════════════════════════════════════════════' + colors.reset);
console.log(colors.bold + '  Summary' + colors.reset);
console.log(colors.bold + '═══════════════════════════════════════════════════════════');
console.log('');

const total = results.summary.total;
const ok = results.summary.ok;
const warning = results.summary.warning;
const error = results.summary.error;
const missing = results.summary.missing;

console.log(`Total checks: ${total}`);
console.log('');
console.log(`${colors.green}✓ Passed:${colors.reset} ${ok}`);
console.log(`${colors.yellow}⚠ Warnings:${colors.reset} ${warning}`);
console.log(`${colors.red}✗ Errors:${colors.reset} ${error}`);
console.log(`${colors.red}✗ Missing:${colors.reset} ${missing}`);
console.log('');

// Git status check
console.log(colors.bold + '📊 Git Repository Status...' + colors.reset);
console.log('');

try {
  const { execSync } = require('child_process');
  const cwd = process.cwd();
  
  // Check if git repo
  let gitStatus;
  try {
    gitStatus = execSync('git rev-parse --git-dir', { cwd, encoding: 'utf-8' }).trim();
    logInfo('Git repository: Initialized');
  } catch (e) {
    logError('No git repository found');
    results.summary.error++;
  }
  
  // Check git log
  try {
    const logCount = parseInt(execSync('git rev-list --count HEAD', { cwd, encoding: 'utf-8' }).trim());
    logInfo(`Commits: ${logCount}`);
  } catch (e) {
    logWarning('Could not count commits');
  }
  
  // Check for uncommitted changes
  try {
    const status = execSync('git status --porcelain', { cwd, encoding: 'utf-8' }).trim();
    if (status) {
      const lines = status.split('\n').filter(l => l).length;
      logWarning(`Uncommitted changes: ${lines} file(s)`);
      console.log('');
      console.log('  Uncommitted files:');
      status.split('\n').filter(l => l).forEach(line => {
        console.log(`    ${line}`);
      });
    } else {
      logSuccess('Working tree clean - no uncommitted changes');
    }
  } catch (e) {
    logWarning('Could not check git status');
  }
  
  // Check remote
  try {
    const remotes = execSync('git remote -v', { cwd, encoding: 'utf-8' }).trim();
    if (remotes) {
      logInfo('Remote configured: Yes');
      console.log('');
      console.log('  Remotes:');
      remotes.split('\n').filter(l => l).forEach(line => {
        const parts = line.split(/\s+/);
        console.log(`    ${parts[0]}: ${parts[1]}`);
      });
    } else {
      logWarning('No remote configured - will need to add before push');
    }
  } catch (e) {
    logWarning('Could not check git remotes');
  }
  
  // Test GitHub token access (if GITHUB_TOKEN is set)
  const githubToken = process.env.GITHUB_TOKEN || null;
  
  if (githubToken && githubToken.startsWith('github_pat_')) {
    console.log('');
    console.log(colors.yellow + '⚠️  GitHub Token is Fine-Grained PAT (github_pat_)' + colors.reset);
    console.log('');
    console.log('  Fine-Grained PATs do NOT support Git operations over HTTPS!');
    console.log('  Only REST API and GraphQL API access is available.');
    console.log('');
    console.log('  Solution: Use one of these:');
    console.log('    1. Classic PAT (ghp_...) with "repo" scope');
    console.log('    2. gh auth login (browser-based session)');
    console.log('    3. SSH keys instead of HTTPS');
    console.log('');
    console.log('  See PUBLISH.md for detailed instructions.');
  } else if (githubToken) {
    console.log('');
    console.log(colors.bold + '🔑 Checking GitHub Token...' + colors.reset);
    console.log('');
    
    // Synchronous test using execSync
    try {
      const { execSync } = require('child_process');
      const username = 'kai1973i';
      const repo = 'astro-pixel-processing-workbench';
      
      const result = execSync(
        `curl -s -H "Authorization: token ${githubToken}" ` +
        `https://api.github.com/repos/${username}/${repo}`,
        { encoding: 'utf-8', timeout: 10000 }
      );
      
      const json = JSON.parse(result);
      
      if (json.name) {
        logSuccess('GitHub Token: API access OK');
        console.log(`  Repository: ${json.full_name}`);
        
        if (json.permissions) {
          console.log(`  Permissions: admin=${json.permissions.admin}, push=${json.permissions.push}`);
          
          if (json.permissions.push) {
            logSuccess('Token has push permission - Git operations should work');
          } else {
            logWarning('Token may not have Git push access');
            console.log('');
            console.log('  If Git push fails with 403, create a token with "repo" scope.');
            console.log('  See PUBLISH.md for instructions.');
          }
        }
      } else {
        logError('Could not verify repository access');
      }
    } catch (e) {
      logWarning('Could not test GitHub token: ' + e.message);
    }
  } else {
    console.log('');
    console.log(colors.bold + '🔑 GitHub Token Check...' + colors.reset);
    console.log('');
    logWarning('GITHUB_TOKEN environment variable not set');
    console.log('');
    console.log('  To enable automated token validation, set:');
    console.log('    export GITHUB_TOKEN=your_token_here');
    console.log('');
    console.log('  Or use gh auth login for browser-based authentication.');
  }
  
} catch (e) {
  logError('Git check failed: ' + e.message);
}

console.log('');
console.log(colors.bold + '═══════════════════════════════════════════════════════════' + colors.reset);

// Final verdict
const hasErrors = error > 0 || missing > 0;

if (hasErrors) {
  console.log(colors.red + '  RELEASE NOT READY' + colors.reset);
  console.log(colors.red + '═══════════════════════════════════════════════════════════' + colors.reset);
  console.log('');
  console.log('The following issues must be fixed before release:');
  console.log('');
  
  results.files.forEach(r => {
    if (r.status === 'error' || r.status === 'missing') {
      console.log(`  - ${r.path}: ${r.message}`);
    }
  });
  
  results.directories.forEach(r => {
    if (r.status === 'missing') {
      console.log(`  - ${r.path}/: ${r.message}`);
    }
  });
  
  console.log('');
  console.log('After fixing these issues, run this script again to verify.');
  process.exit(1);
  
} else if (warning > 0) {
  console.log(colors.yellow + '  RELEASE READY WITH WARNINGS' + colors.reset);
  console.log(colors.yellow + '═══════════════════════════════════════════════════════════' + colors.reset);
  console.log('');
  console.log('The project is ready for release, but there are some warnings:');
  console.log('');
  
  results.files.forEach(r => {
    if (r.status === 'warning') {
      console.log(`  - ${r.path}: ${r.message}`);
    }
  });
  
  console.log('');
  console.log('Consider addressing these warnings before publishing.');
  console.log('');
  console.log('To publish to GitHub:');
  console.log('  1. Authenticate with GitHub CLI: gh auth login');
  console.log('  2. Create and push repository: gh repo create astro-pixel-processing-workbench --public --source=. --remote=origin --push');
  console.log('  OR');
  console.log('  1. Create repository manually at https://github.com/new');
  console.log('  2. Add remote: git remote add origin https://github.com/USERNAME/astro-pixel-processing-workbench.git');
  console.log('  3. Push: git push -u origin main');
  
  process.exit(0);
  
} else {
  console.log(colors.green + '  ✅ RELEASE READY' + colors.reset);
  console.log(colors.green + '═══════════════════════════════════════════════════════════' + colors.reset);
  console.log('');
  console.log('All checks passed! The project is ready for GitHub release.');
  console.log('');
  console.log('To publish to GitHub:');
  console.log('');
  console.log('  Option 1 - GitHub CLI (recommended):');
  console.log('    gh auth login');
  console.log('    gh repo create astro-pixel-processing-workbench --public --source=. --remote=origin --push');
  console.log('');
  console.log('  Option 2 - Manual:');
  console.log('    1. Create repository at https://github.com/new');
  console.log('    2. Add remote: git remote add origin https://github.com/USERNAME/astro-pixel-processing-workbench.git');
  console.log('    3. Push: git push -u origin main');
  console.log('');
  console.log('  Option 3 - Deploy script:');
  console.log('    ./deploy-to-github.sh');
  console.log('');
  console.log('See PUBLISH.md for detailed instructions.');
  console.log('');
  console.log(colors.green + '═══════════════════════════════════════════════════════════' + colors.reset);
  console.log('');
  
  process.exit(0);
}
