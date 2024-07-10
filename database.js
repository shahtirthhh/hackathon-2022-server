require("dotenv/config");
const mysql2 = require("mysql2");
const { Sequelize } = require("sequelize");
const sequelize = new Sequelize(
  process.env.DB,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    dialectModule: mysql2,
    dialectOptions: {
      connectTimeout: 60000,
    },
  }
);

module.exports = sequelize;
