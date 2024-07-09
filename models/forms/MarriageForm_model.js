const { DataTypes } = require("sequelize");
const sequelize = require("../../database");
const CitizenAccount = require("../citizen/citizen_account_model");
const CitizenApplications = require("../citizen/citizen_applications_model");
const Aadhar = require("../aadhar_model");

const MarriageForm = sequelize.define(
  "marriage-forms",
  {
    marriage_form_id: {
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
    application_id: {
      type: DataTypes.INTEGER,
      references: {
        model: CitizenApplications,
        key: "application_id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    placeOfMarriage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dateOfMarriage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // ------------------ Groom's details
    groomAadhar: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Aadhar,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    groomReligion: {
      type: DataTypes.ENUM(
        "Hindu",
        "Chirstian",
        "Buddhist",
        "Muslim",
        "Jain",
        "Sikh",
        "Others"
      ),
      allowNull: false,
    },
    groomDOB: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    groomOccupation: {
      type: DataTypes.ENUM(
        "Unemployed",
        "Govt. servant",
        "Private employee",
        "Self-employed"
      ),
      allowNull: false,
    },
    groomSignature: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // ------------------ bride's details
    brideAadhar: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Aadhar,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    brideReligion: {
      type: DataTypes.ENUM(
        "Hindu",
        "Chirstian",
        "Buddhist",
        "Muslim",
        "Jain",
        "Sikh",
        "Others"
      ),
      allowNull: false,
    },
    brideDOB: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    brideOccupation: {
      type: DataTypes.ENUM(
        "Unemployed",
        "Govt. servant",
        "Private employee",
        "Self-employed"
      ),
      allowNull: false,
    },
    brideSignature: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // ------------------ bride's details
    witnessID: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    witnessSignature: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // ------------------ Documents
    priestSignature: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    marriagePhoto1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    marriagePhoto2: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    certificate: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "marriage-forms",
    timestamps: false,
  }
);

module.exports = MarriageForm;
