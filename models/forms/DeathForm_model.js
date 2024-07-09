const { DataTypes } = require("sequelize");
const sequelize = require("../../database");
const country_data = require("../../data/data");
const CitizenAccount = require("../citizen/citizen_account_model");
const CitizenApplications = require("../citizen/citizen_applications_model");
const Aadhar = require("../aadhar_model");

const DeathForm = sequelize.define(
  "death-forms",
  {
    death_form_id: {
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
    dateOfDeath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    placeOfDeath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deceasedAadhar: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Aadhar,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    deathReason: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [country_data.death_reasons],
          msg: "Reason is not valid!",
        },
      },
    },
    // ------------------ Filler's details
    fillerAadhar: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Aadhar,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    fillerRelation: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [country_data.relations],
          msg: "Relation is not valid!",
        },
      },
    },
    // ------------------ Documents
    crematoriumDeclaration: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    hospitalDeclaration: {
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
    tableName: "death-forms",
    timestamps: false,
  }
);

module.exports = DeathForm;
