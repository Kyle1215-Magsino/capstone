import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Attendance = sequelize.define("Attendance", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  checkInTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  checkOutTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  verificationMethod: {
    type: DataTypes.ENUM("rfid", "facial", "manual"),
    allowNull: false,
    defaultValue: "manual"
  },
  locationLat: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  locationLng: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  locationVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM("present", "late", "absent"),
    defaultValue: "present"
  }
});
