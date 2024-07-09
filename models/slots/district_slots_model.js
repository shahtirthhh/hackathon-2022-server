const { DataTypes } = require("sequelize");
const sequelize = require("../../database");
const country_data = require("../../data/data");

const SlotDetails = require("./slot_details_model");

const DistrictSlots = sequelize.define(
  "district-slots",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    slot_id: {
      type: DataTypes.INTEGER,
      references: {
        model: SlotDetails,
        key: "slot_id",
      },
      allowNull: false,
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
  },
  {
    tableName: "district-slots",
    timestamps: false,
  }
);

module.exports = DistrictSlots;
