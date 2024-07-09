const { DataTypes } = require("sequelize");
const sequelize = require("../../database");
const country_data = require("../../data/data");

const ClerkAccount = sequelize.define(
  "clerk-accounts",
  {
    clerk_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: this.true,
      allowNull: false,
    },
    district: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [country_data.Gujarat], // Validate district from country_data.Gujarat
          msg: "District is not valid!",
        },
      },
    },
    department: {
      type: DataTypes.ENUM("BIRTH", "MARRIAGE", "DEATH"),
      allowNull: false,
    },
    socket: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "clerk-accounts",
  }
);

module.exports = ClerkAccount;
