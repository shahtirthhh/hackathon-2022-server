const { DataTypes } = require("sequelize");
const sequelize = require("../../database");
const country_data = require("../../data/data");
const SlotDetails = sequelize.define(
  "slot-details",
  {
    slot_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    max: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "slot-details",
    timestamps: false,
  }
);

module.exports = SlotDetails;
