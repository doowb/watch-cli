const log = require('verbalize');
const gaze = require('gaze');
const _ = require('lodash');

const exec = require('child_process').exec;

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

  var runCmd = function(cmd, cb) {
    log.write('Running ' + cmd);
    var cp = exec(cmd, {}, function(err, stdout, stderr) {
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
        runCmd(command, function (err) {
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
