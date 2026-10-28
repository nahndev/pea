/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  testRegex: 'src/.*\\.spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    '^.+\\.ts$': ['ts-jest', { diagnostics: { ignoreCodes: [151002] } }],
  },
  testEnvironment: 'node',
};
