import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Event = sequelize.define("Event", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  eventName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  eventDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  venue: {
    type: DataTypes.STRING,
    allowNull: false
  },
  venueLat: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  venueLng: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  venueRadius: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 200
  },
  status: {
    type: DataTypes.ENUM("upcoming", "ongoing", "completed", "cancelled"),
    defaultValue: "upcoming"
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});
