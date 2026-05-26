const { spawn } = require('child_process');
const child = spawn('npx', ['medusa', 'plugin:develop'], { stdio: 'inherit', shell: true });
child.on('exit', code => process.exit(code));
