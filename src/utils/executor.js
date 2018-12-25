const CommandExecutor = (() => {
  'use strict';

  const exec = require('child_process').exec;
  const config = require('../config.js');

  const scriptsPath = config.scriptsPath;
  let processes = [];

  function executeScript(script, args) {
    const argsStr = args ? args.reduce((acc, curr) => acc + ' ' + curr) : '';
    const proc = exec(
      'sh ' + scriptsPath + '/' + script + ' ' + argsStr,
      (stderr, stdout) => {
        if (stderr) {
          console.error(stderr);
        }
        console.log(stdout);
        processes = processes.filter(p => proc.pid !== p.pid);
      }
    );
    processes.push(proc);
    return proc;
  }

  return { executeScript };
})();

module.exports = { CommandExecutor };
