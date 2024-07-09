const { DataTypes } = require("sequelize");
const sequelize = require("../database");
const country_data = require("../data/data");

const Aadhar = sequelize.define(
  "aadhar-data",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      validate: {
        is: /^[0-9]{12}$/, // Validate 12 digits for Aadhar number
      },
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    middleName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM("male", "female", "others"),
      allowNull: false,
    },
    DOB: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    addressLine: {
      type: DataTypes.STRING,
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
    state: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [Object.keys(country_data)],
          msg: "State is not valid!",
        },
      },
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^[0-9]{10}$/, // Validate 10 digits for mobile number
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
  },
  {
    tableName: "aadhar-data",
    timestamps: false,
  }
);

module.exports = Aadhar;
