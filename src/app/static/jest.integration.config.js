var config = require('./jest.config');

config.testRegex = "(/__tests__/.*|(\\.|/)(itest))\\.[jt]sx?$";
config.globals = {...config.globals, "appUrl": "http://localhost:8080/"};
config.coverageDirectory = "./coverage/integration/";
config.testTimeout = 6000;
config.setupFiles.push("./src/tests/setup.integration.ts");
module.exports = config;
