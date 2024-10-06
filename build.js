const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, 'js', 'script.js');
let content = fs.readFileSync(scriptPath, 'utf8');

content = content.replace('process.env.MY_API_KEY', `"${process.env.MY_API_KEY}"`);

fs.writeFileSync(scriptPath, content);

console.log('Build script completed.');