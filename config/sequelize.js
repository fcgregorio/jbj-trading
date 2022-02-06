const dotenv = require("dotenv");

const dotenvResult = dotenv.config();
if (dotenvResult.error) {
  throw dotenvResult.error;
}

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    storage: process.env.DB_STORAGE,
    dialect: process.env.DB_DIALECT,
    logQueryParameters: process.env.DB_LOG_QUERY_PARAMETERS,
    benchmark: process.env.DB_BENCHMARK,
  },
  test: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    storage: process.env.DB_STORAGE,
    dialect: process.env.DB_DIALECT,
    logQueryParameters: process.env.DB_LOG_QUERY_PARAMETERS,
    benchmark: process.env.DB_BENCHMARK,
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    storage: process.env.DB_STORAGE,
    dialect: process.env.DB_DIALECT,
    logQueryParameters: process.env.DB_LOG_QUERY_PARAMETERS,
    benchmark: process.env.DB_BENCHMARK,
  },
};
