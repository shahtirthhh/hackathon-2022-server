const { DataTypes } = require("sequelize");
const sequelize = require("../../database");

const SlotDetails = require("./slot_details_model");
const ClerkAccount = require("../clerk/clerk_account_model");
const SlotsData = sequelize.define(
  "slots-data",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    clerk_id: {
      type: DataTypes.INTEGER,
      references: {
        model: ClerkAccount,
        key: "clerk_id",
      },
      allowNull: false,
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
  },
  {
    tableName: "slots-data",
    timestamps: false,
  }
);

module.exports = SlotsData;
