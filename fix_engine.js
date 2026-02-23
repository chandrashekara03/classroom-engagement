import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'packages/activity-engine/src/activity-engine.ts');
const content = fs.readFileSync(filePath, 'utf8');
const fixedContent = content.replace(/\\n/g, '\n');
fs.writeFileSync(filePath, fixedContent);
console.log('Fixed newlines in activity-engine.ts');
