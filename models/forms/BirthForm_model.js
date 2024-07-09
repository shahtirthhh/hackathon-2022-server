const { DataTypes } = require("sequelize");
const sequelize = require("../../database");
const country_data = require("../../data/data");
const CitizenAccount = require("../citizen/citizen_account_model");
const CitizenApplications = require("../citizen/citizen_applications_model");
const Aadhar = require("../aadhar_model");

const BirthForm = sequelize.define(
  "birth-forms",
  {
    birth_form_id: {
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
    childBirthDate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    childGender: {
      type: DataTypes.ENUM("male", "female", "others"),
      allowNull: false,
    },
    childFirstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    childMiddleName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    childLastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    placeOfBirth: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [country_data.Gujarat], // Validate district from country_data.Gujarat
          msg: "District is not valid!",
        },
      },
    },
    // ------------------ Mother's details
    motherAadhar: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Aadhar,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    motherReligion: {
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
    motherLiteracy: {
      type: DataTypes.ENUM(
        "Unliterate",
        "Below 10th",
        "Below 12th",
        "Graduate",
        "Post-graduate",
        "PHD",
        "Post-doc"
      ),
      allowNull: false,
    },
    motherAgeAtBirth: {
      type: DataTypes.INTEGER,

      validate: {
        max: 100,
        min: 18,
      },
    },
    motherOccupation: {
      type: DataTypes.ENUM(
        "Unemployed",
        "Govt. servant",
        "Private employee",
        "Self-employed"
      ),
      allowNull: false,
    },
    // ------------------ Father's details
    fatherAadhar: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Aadhar,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    fatherReligion: {
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
    fatherLiteracy: {
      type: DataTypes.ENUM(
        "Unliterate",
        "Below 10th",
        "Below 12th",
        "Graduate",
        "Post-graduate",
        "PHD",
        "Post-doc"
      ),
      allowNull: false,
    },
    fatherOccupation: {
      type: DataTypes.ENUM(
        "Unemployed",
        "Govt. servant",
        "Private employee",
        "Self-employed"
      ),
      allowNull: false,
    },
    // ------------------ Documents
    permanentAddProofDOC: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    marriageCertificateDOC: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    proofOfBirthDOC: {
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
    tableName: "birth-forms",
    timestamps: false,
  }
);

module.exports = BirthForm;
