/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  // isolatedModules: node16 module resolution (see tsconfig) is "hybrid"; ts-jest requires this flag.
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json', isolatedModules: true }] },
  testEnvironment: 'node',
};
