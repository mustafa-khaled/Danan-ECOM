module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.e2e-spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  testEnvironment: "node",
  testTimeout: 60000,
  setupFiles: ["<rootDir>/e2e-setup.ts"],
  moduleNameMapper: {
    "^@dadan/db$": "<rootDir>/../../../packages/db/src/index.ts",
    "^@dadan/types$": "<rootDir>/../../../packages/types/src/index.ts",
    "^@dadan/utils$": "<rootDir>/../../../packages/utils/src/index.ts",
    "^@dadan/storage$": "<rootDir>/../../../packages/storage/src/index.ts",
  },
};
