const { DataTypes } = require("sequelize");
const sequelize = require("../../database");

const CitizenAccount = sequelize.define(
  "citizen-accounts",
  {
    citizen_id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "citizen-accounts",
    timestamps: false,
  }
);

module.exports = CitizenAccount;
