// Integration tests against a real Postgres: `npm run test:int`.
//
// Same module mapping as the unit suite (package.json "jest"), but only
// `*.int-spec.ts` files, run in-band against one throwaway database built by
// test/db/global-setup.ts. Needs TEST_DATABASE_URL.
const unit = require('../package.json').jest;

module.exports = {
  ...unit,
  rootDir: '..',
  testRegex: '.*\\.int-spec\\.ts$',
  globalSetup: '<rootDir>/test/db/global-setup.ts',
  globalTeardown: '<rootDir>/test/db/global-teardown.ts',
  maxWorkers: 1,
  testTimeout: 30_000,
};
