const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'packages/activity-engine/src/activity-engine.ts');
const content = fs.readFileSync(filePath, 'utf8');
const fixedContent = content.replace(/\\n/g, '\n');
fs.writeFileSync(filePath, fixedContent);
console.log('Fixed newlines in activity-engine.ts');
