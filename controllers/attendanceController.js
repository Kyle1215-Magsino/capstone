import { Attendance, Student, Event, sequelize } from "../models/associations.js";
import { Op } from "sequelize";

const requireAuth = (req, res) => {
  if (!req.session.userId) { res.redirect("/login"); return false; }
  return true;
};

// Attendance check-in page (live scanning page)
export const checkinPage = async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const events = await Event.findAll({
      where: { status: { [Op.in]: ["upcoming", "ongoing"] } },
      order: [["eventDate", "ASC"]]
    });
    res.render("checkin", {
      title: "Check-In",
      events: JSON.stringify(events),
      userName: req.session.userName,
      userRole: req.session.userRole
    });
  } catch (err) {
    console.error("Checkin page error:", err);
    res.redirect("/dashboard");
  }
};

// Face enrollment page
export const faceEnrollmentPage = async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const students = await Student.findAll({
      where: { status: "active" },
      order: [["lastName", "ASC"], ["firstName", "ASC"]]
    });
    res.render("faceenroll", {
      title: "Face Enrollment",
      userName: req.session.userName,
      userRole: req.session.userRole,
      students: JSON.stringify(students)
    });
  } catch (err) {
    console.error("Face enrollment page error:", err);
    res.redirect("/dashboard");
  }
};

// Process check-in (RFID or manual)
export const processCheckin = async (req, res) => {
  try {
    const { studentIdentifier, eventId, verificationMethod, locationLat, locationLng } = req.body;

    // Find student by ID number or RFID
    let student;
    if (verificationMethod === "rfid") {
      student = await Student.findOne({ where: { rfidTag: studentIdentifier } });
    } else {
      student = await Student.findOne({
        where: {
          [Op.or]: [
            { studentId: studentIdentifier },
            { rfidTag: studentIdentifier }
          ]
        }
      });
    }

    if (!student) {
      return res.json({ success: false, message: "Student not found. Check the ID or RFID tag." });
    }

    if (student.status !== "active") {
      return res.json({ success: false, message: "Student account is inactive." });
    }

    // Check for duplicate check-in
    const existingAttendance = await Attendance.findOne({
      where: { studentId: student.id, eventId: parseInt(eventId) }
    });
    if (existingAttendance) {
      return res.json({
        success: false,
        message: `${student.firstName} ${student.lastName} is already checked in.`,
        student: { name: `${student.firstName} ${student.lastName}`, course: student.course }
      });
    }

    // Get event to check timing
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.json({ success: false, message: "Event not found." });
    }

    // Determine if late
    let status = "present";
    const now = new Date();
    const eventStartStr = `${event.eventDate}T${event.startTime}`;
    const eventStart = new Date(eventStartStr);
    if (now > eventStart) {
      status = "late";
    }

    // Location verification
    let locationVerified = false;
    if (locationLat && locationLng && event.venueLat && event.venueLng) {
      const distance = getDistanceMeters(
        parseFloat(locationLat), parseFloat(locationLng),
        event.venueLat, event.venueLng
      );
      locationVerified = distance <= (event.venueRadius || 200);
    }

    // Record attendance
    const attendance = await Attendance.create({
      studentId: student.id,
      eventId: parseInt(eventId),
      checkInTime: now,
      verificationMethod: verificationMethod || "manual",
      locationLat: locationLat ? parseFloat(locationLat) : null,
      locationLng: locationLng ? parseFloat(locationLng) : null,
      locationVerified,
      status
    });

    // Update event status to ongoing if it was upcoming
    if (event.status === "upcoming") {
      await Event.update({ status: "ongoing" }, { where: { id: eventId } });
    }

    res.json({
      success: true,
      message: `${student.firstName} ${student.lastName} checked in successfully!`,
      student: {
        name: `${student.firstName} ${student.lastName}`,
        studentId: student.studentId,
        course: student.course,
        yearLevel: student.yearLevel
      },
      attendance: {
        status,
        verificationMethod: attendance.verificationMethod,
        locationVerified,
        checkInTime: attendance.checkInTime
      }
    });
  } catch (err) {
    console.error("Checkin error:", err);
    res.json({ success: false, message: "Check-in failed. Server error." });
  }
};

// Live attendance feed for an event (API)
export const liveAttendance = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const attendances = await Attendance.findAll({
      where: { eventId },
      include: [{ model: Student, as: "student" }],
      order: [["checkInTime", "DESC"]]
    });

    const total = attendances.length;
    const present = attendances.filter(a => a.status === "present").length;
    const late = attendances.filter(a => a.status === "late").length;
    const verified = attendances.filter(a => a.locationVerified).length;

    res.json({
      success: true,
      total,
      present,
      late,
      verified,
      attendances
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch attendance" });
  }
};

// Attendance logs page
export const attendanceLogsPage = async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const { count, rows } = await Attendance.findAndCountAll({
      include: [
        { model: Student, as: "student" },
        { model: Event, as: "event" }
      ],
      order: [["checkInTime", "DESC"]]
    });

    const events = await Event.findAll({ order: [["eventDate", "DESC"]] });

    res.render("attendance-logs", {
      title: "Attendance Logs",
      logs: JSON.stringify(rows),
      events: JSON.stringify(events),
      totalLogs: count,
      userName: req.session.userName,
      userRole: req.session.userRole
    });
  } catch (err) {
    console.error("Attendance logs error:", err);
    req.flash("error_msg", "Failed to load attendance logs.");
    res.redirect("/dashboard");
  }
};

// Reports page
export const reportsPage = async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const events = await Event.findAll({ order: [["eventDate", "DESC"]] });

    // Overall stats
    const totalStudents = await Student.count();
    const totalEvents = await Event.count();
    const totalCheckins = await Attendance.count();
    const presentCount = await Attendance.count({ where: { status: "present" } });
    const lateCount = await Attendance.count({ where: { status: "late" } });

    // Per-event summary
    const eventSummary = await Event.findAll({
      attributes: [
        "id", "eventName", "eventDate", "venue",
        [sequelize.fn("COUNT", sequelize.col("attendances.id")), "attendeeCount"]
      ],
      include: [{
        model: Attendance, as: "attendances", attributes: []
      }],
      group: ["Event.id"],
      order: [["eventDate", "DESC"]],
      raw: true,
      subQuery: false
    });

    // Attendance by course
    const byCourse = await Attendance.findAll({
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("Attendance.id")), "count"]
      ],
      include: [{
        model: Student, as: "student", attributes: ["course"]
      }],
      group: ["student.course"],
      raw: true
    });

    // Monthly trend
    const monthlyTrend = await Attendance.findAll({
      attributes: [
        [sequelize.fn("MONTH", sequelize.col("checkInTime")), "month"],
        [sequelize.fn("YEAR", sequelize.col("checkInTime")), "year"],
        [sequelize.fn("COUNT", sequelize.col("Attendance.id")), "count"]
      ],
      group: [
        sequelize.fn("YEAR", sequelize.col("checkInTime")),
        sequelize.fn("MONTH", sequelize.col("checkInTime"))
      ],
      order: [
        [sequelize.fn("YEAR", sequelize.col("checkInTime")), "ASC"],
        [sequelize.fn("MONTH", sequelize.col("checkInTime")), "ASC"]
      ],
      raw: true
    });

    res.render("reports", {
      title: "Reports & Analytics",
      events: JSON.stringify(events),
      totalStudents,
      totalEvents,
      totalCheckins,
      presentCount,
      lateCount,
      eventSummary: JSON.stringify(eventSummary),
      byCourse: JSON.stringify(byCourse),
      monthlyTrend: JSON.stringify(monthlyTrend),
      userName: req.session.userName,
      userRole: req.session.userRole
    });
  } catch (err) {
    console.error("Reports page error:", err);
    req.flash("error_msg", "Failed to load reports.");
    res.redirect("/dashboard");
  }
};

// Helper: Haversine distance in meters
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
