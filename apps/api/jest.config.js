module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: ["src/**/*.(t|j)s"],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@dadan/db$": "<rootDir>/../../packages/db/src/index.ts",
    "^@dadan/types$": "<rootDir>/../../packages/types/src/index.ts",
    "^@dadan/utils$": "<rootDir>/../../packages/utils/src/index.ts",
    "^@dadan/storage$": "<rootDir>/test/__mocks__/@dadan/storage.ts",
  },
};
