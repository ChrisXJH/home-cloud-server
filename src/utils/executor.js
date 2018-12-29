const CommandExecutor = (() => {
  const exec = require('child_process').exec;
  const config = require('../config.js');

  const scriptsPath = config.scriptsPath;
  let processes = [];

  function execute(cmd) {
    return new Promise((resolve, reject) => {
      const proc = exec(cmd, (stderr, stdout) => {
        if (stderr) {
          reject(stderr);
          return;
        }
        resolve(stdout);
        processes = processes.filter(p => proc.pid !== p.pid);
      });
      processes.push(proc);
    });
  }

  function executeScript(script, args) {
    const argsStr = args ? args.reduce((acc, curr) => acc + ' ' + curr) : '';
    const cmd = 'sh ' + scriptsPath + '/' + script + ' ' + argsStr;
    return execute(cmd);
  }

  return { execute, executeScript };
})();

module.exports = { CommandExecutor };
