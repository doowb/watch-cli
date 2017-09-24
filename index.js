const log = require('verbalize');
const gaze = require('gaze');
const path = require('path');
const process = require('process');
const _ = require('lodash');

const exec = require('child_process').exec;
const supportsColor = require('supports-color');
const childEnv = _.assign({
  FORCE_COLOR: supportsColor ? 1 : undefined
}, process.env)

var strip = function (str) {
  var re = /^=(.*)$/;
  if (re.test(str)) {
    var matches = str.match(re);
    return matches[1];
  }
  return str;
};

var watch = function (options) {
  options = _.defaults(options, {
    pattern: ['*.js'],
    command: ''
  });

  var captureOutput = function(child, output) {
    child.pipe(output);
  };

  var runCmd = function(cmd, filepath, event, cb) {
    log.write('Running ' + cmd);
    var env = childEnv;
    env.ABSOLUTE_FILENAME = filepath;
    env.FILENAME = path.relative(process.cwd(), filepath);
    env.EVENT = event;
    var cp = exec(cmd, { env: env }, function(err, stdout, stderr) {
      if(err) {
        cb(err);
      } else {
        cb();
      }
    });

    captureOutput(cp.stdout, process.stdout);
    captureOutput(cp.stderr, process.stderr);
  };

  gaze(strip(options.pattern), function (err, watcher) {
    log.write('Watching started');

    var lastEvent = new Date();
    var running = false;
    this.on('all', function (event, filepath) {
      var now = new Date();
      if (!running && (now - lastEvent) > 400) {
        running = true;
        log.write(filepath + ' ' + event);

        var command = strip(options.command);
        if (_.isEmpty(command)) {
          log.write('No command found.');
          running = false;
          lastEvent = now;
          return;
        }
        runCmd(command, filepath, event, function (err) {
          running = false;
          log.write('Finished ' + command);
          log.write('Watching started');
        });
        lastEvent = now;
      }
    });
  });
};


module.exports = watch;
