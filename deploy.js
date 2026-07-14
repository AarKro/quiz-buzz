import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

const distPath = join(process.cwd(), 'dist');

console.log('⚡ Starting deployment to gh-pages branch...');

try {
  // 1. Clean previous build if any
  if (existsSync(distPath)) {
    console.log('🧹 Cleaning previous dist folder...');
    rmSync(distPath, { recursive: true, force: true });
  }

  // 2. Build the project
  console.log('📦 Compiling TypeScript and building Vite production bundle...');
  execSync('npm run build', { stdio: 'inherit' });

  // 3. Initialize git inside dist
  console.log('🔧 Initializing git repository in dist folder...');
  execSync('git init', { cwd: distPath, stdio: 'inherit' });
  execSync('git checkout -b gh-pages', { cwd: distPath, stdio: 'inherit' });

  // 4. Get current remote URL
  console.log('📡 Getting remote origin URL...');
  const remoteUrl = execSync('git remote get-url origin').toString().trim();
  execSync(`git remote add origin ${remoteUrl}`, { cwd: distPath, stdio: 'inherit' });

  // 5. Add, commit and force push to gh-pages branch
  console.log('🚀 Staging and committing build...');
  execSync('git add -A', { cwd: distPath, stdio: 'inherit' });
  execSync('git commit -m "deploy: publish production build to gh-pages [skip ci]"', { cwd: distPath, stdio: 'inherit' });

  console.log('📤 Pushing assets to remote gh-pages branch...');
  execSync('git push -f origin gh-pages', { cwd: distPath, stdio: 'inherit' });

  console.log('🎉 Successfully deployed to GitHub Pages!');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
