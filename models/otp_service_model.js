const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const OtpService = sequelize.define(
  "otp-service",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    createdAt: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    aadhar: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^[0-9]{12}$/, // Validate 12 digits for Aadhar number
      },
    },
  },
  {
    tableName: "otp-service",
    timestamps: false,
  }
);

module.exports = OtpService;
