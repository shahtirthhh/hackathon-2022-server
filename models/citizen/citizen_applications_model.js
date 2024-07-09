const { DataTypes } = require("sequelize");
const sequelize = require("../../database");
const country_data = require("../../data/data");

const CitizenAccount = require("../citizen/citizen_account_model");
const ClerkAccount = require("../clerk/clerk_account_model");
const SlotsData = require("../slots/slots_data_model");

const CitizenApplications = sequelize.define(
  "citizen-applications",
  {
    application_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    citizen_id: {
      type: DataTypes.STRING,
      references: {
        model: CitizenAccount,
        key: "citizen_id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    slot: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      references: {
        model: SlotsData,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    form_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    form_type: {
      type: DataTypes.ENUM("DEATH", "MARRIAGE", "BIRTH"),
      allowNull: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    issued: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    holder1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    holder2: {
      type: DataTypes.STRING,
      defaultValue: null,
    },
    holder3: {
      type: DataTypes.STRING,
      defaultValue: null,
    },
    joined_online: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    rejection_reason: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    clerk_id: {
      type: DataTypes.INTEGER,
      references: {
        model: ClerkAccount,
        key: "clerk_id",
      },
      allowNull: true,
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
  },
  {
    tableName: "citizen-applications",
  }
);

module.exports = CitizenApplications;
