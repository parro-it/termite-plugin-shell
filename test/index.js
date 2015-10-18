const test = require('tape-async');
const termitePluginShell = require('..');

test('add details files', function *(t) {
  const result = yield termitePluginShell();
  t.equal(result, 42);
});
