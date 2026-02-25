import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Student = sequelize.define("Student", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  course: {
    type: DataTypes.STRING,
    allowNull: false
  },
  yearLevel: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  rfidTag: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  faceData: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  profileImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM("active", "inactive"),
    defaultValue: "active"
  },
  archived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});
