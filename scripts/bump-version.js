#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const bumpType = process.argv[2];

if (!['major', 'minor', 'patch'].includes(bumpType)) {
  console.error('❌ Usage: node bump-version.js [major|minor|patch]');
  process.exit(1);
}

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const envFiles = [
  path.join(__dirname, '..', 'src', 'environments', 'environment.ts'),
  path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts'),
  path.join(__dirname, '..', 'src', 'environments', 'environment.stg.ts')
];

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

const [major, minor, patch] = currentVersion.split('.').map(Number);

let newVersion;
switch (bumpType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

envFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('appVersion:')) {
    content = content.replace(
      /appVersion:\s*['"].*?['"]/,
      `appVersion: '${newVersion}'`
    );
  } else {
    content = content.replace(
      /(environmentName:\s*['"].*?['"],)/,
      `$1\n  appVersion: '${newVersion}',`
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log(`✅ Version bumped: ${currentVersion} → ${newVersion}`);
console.log('Updated files:');
console.log('  - package.json');
envFiles.forEach(file => console.log(`  - ${path.relative(process.cwd(), file)}`));
