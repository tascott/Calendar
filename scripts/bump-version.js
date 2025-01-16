const fs = require('fs');
const path = require('path');

// Read the current version from package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const package = require(packagePath);
const currentVersion = package.version;

// Split version into major, minor, patch
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Increment patch version
const newVersion = `${major}.${minor}.${patch + 1}`;

// Update package.json
package.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(package, null, 2) + '\n');

// Update version.js with a constant
const versionPath = path.join(__dirname, '..', 'src', 'version.js');
const versionContent = `// This file is automatically updated by bump-version.js
export const VERSION = '${newVersion}';\n`;
fs.writeFileSync(versionPath, versionContent);

console.log(`Version bumped to ${newVersion}`);