import { User } from "./userModel.js";
import { Student } from "./studentModel.js";
import { Event } from "./eventModel.js";
import { Attendance } from "./attendanceModel.js";
import { sequelize } from "./db.js";

// User-Student link (student role users linked to Student record)
User.belongsTo(Student, { foreignKey: "studentRecordId", as: "studentRecord" });
Student.hasOne(User, { foreignKey: "studentRecordId", as: "userAccount" });

// Event created by a User (USG officer)
Event.belongsTo(User, { foreignKey: "createdBy", as: "organizer" });
User.hasMany(Event, { foreignKey: "createdBy", as: "events" });

// Attendance belongs to Student and Event
Attendance.belongsTo(Student, { foreignKey: "studentId", as: "student" });
Attendance.belongsTo(Event, { foreignKey: "eventId", as: "event" });

Student.hasMany(Attendance, { foreignKey: "studentId", as: "attendances" });
Event.hasMany(Attendance, { foreignKey: "eventId", as: "attendances" });

export { User, Student, Event, Attendance, sequelize };
