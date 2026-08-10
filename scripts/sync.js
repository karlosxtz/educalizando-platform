const { execSync } = require('child_process');

try {
  console.log('Adding files...');
  execSync('git add .', { stdio: 'inherit' });
  console.log('Committing changes...');
  execSync('git commit -m "feat/fix: auto sync update"', { stdio: 'inherit' });
  console.log('Pushing to origin main...');
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('Git sync completed successfully!');
} catch (error) {
  console.error('Git sync error:', error.message);
}
