require("dotenv").config();

const { DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD } = process.env;

module.exports = {
  development: {
    storage: "dev.sqlite",
    dialect: "sqlite",
    logQueryParameters: true,
    benchmark: true,
  },
  test: {
    username: "root",
    password: null,
    database: "database_test",
    host: "127.0.0.1",
    dialect: "mysql",
  },
  production: {
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    host: DB_HOST,
    dialect: "postgres",
    logQueryParameters: false,
    benchmark: false,
  },
};
