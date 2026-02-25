
  /*
    MIT License
    
    Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
    Mindoro State University - Philippines

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
    */
    
import express from "express";
import { homePage } from "../controllers/homeController.js";
const router = express.Router();
router.get("/", homePage);

import { loginPage, registerPage, forgotPasswordPage, dashboardPage, loginUser, registerUser, logoutUser, registerStudentUser, studentDashboardPage, studentAttendancePage, studentEventsPage } from "../controllers/authController.js";

// Auth middleware: must be logged in
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect("/");
  next();
}
// Role guard: block students from officer/admin pages
function officerOnly(req, res, next) {
  if (!req.session.userId) return res.redirect("/");
  if (req.session.userRole === "student") return res.redirect("/student-dashboard");
  next();
}
// Role guard: only students
function studentOnly(req, res, next) {
  if (!req.session.userId) return res.redirect("/");
  if (req.session.userRole !== "student") return res.redirect("/dashboard");
  next();
}

// Role guard: admin only
function adminOnly(req, res, next) {
  if (!req.session.userId) return res.redirect("/");
  if (req.session.userRole !== "admin") return res.redirect("/dashboard");
  next();
}

router.get("/login", loginPage);
router.post("/login", loginUser);
router.get("/register", registerPage);
router.post("/register", adminOnly, registerUser);
router.post("/register-student", registerStudentUser);
router.get("/forgot-password", forgotPasswordPage);
router.get("/dashboard", officerOnly, dashboardPage);
router.get("/student-dashboard", studentOnly, studentDashboardPage);
router.get("/student-attendance", studentOnly, studentAttendancePage);
router.get("/student-events", studentOnly, studentEventsPage);
router.get("/logout", logoutUser);

// Student routes
import { studentsPage, addStudentPage, createStudent, viewStudent, editStudentPage, updateStudent, deleteStudent, searchStudentsAPI, saveFaceData, getFaceData } from "../controllers/studentController.js";

router.get("/students", officerOnly, studentsPage);
router.get("/students/add", officerOnly, addStudentPage);
router.post("/students/add", officerOnly, createStudent);
router.get("/students/:id", officerOnly, viewStudent);
router.get("/students/:id/edit", officerOnly, editStudentPage);
router.post("/students/:id/edit", officerOnly, updateStudent);
router.post("/students/:id/delete", officerOnly, deleteStudent);
router.get("/api/students/search", officerOnly, searchStudentsAPI);
router.post("/api/students/:id/face", officerOnly, saveFaceData);
router.get("/api/students/faces", requireAuth, getFaceData);

// Event routes
import { eventsPage, addEventPage, createEvent, viewEvent, editEventPage, updateEvent, deleteEvent, activeEventsAPI } from "../controllers/eventController.js";

router.get("/events", officerOnly, eventsPage);
router.get("/events/add", officerOnly, addEventPage);
router.post("/events/add", officerOnly, createEvent);
router.get("/events/:id", officerOnly, viewEvent);
router.get("/events/:id/edit", officerOnly, editEventPage);
router.post("/events/:id/edit", officerOnly, updateEvent);
router.post("/events/:id/delete", officerOnly, deleteEvent);
router.get("/api/events/active", requireAuth, activeEventsAPI);

// Attendance routes
import { checkinPage, processCheckin, liveAttendance, attendanceLogsPage, reportsPage, faceEnrollmentPage } from "../controllers/attendanceController.js";

router.get("/checkin", officerOnly, checkinPage);
router.get("/face-enrollment", officerOnly, faceEnrollmentPage);
router.post("/api/checkin", officerOnly, processCheckin);
router.get("/api/attendance/live/:eventId", officerOnly, liveAttendance);
router.get("/attendance", officerOnly, attendanceLogsPage);
router.get("/reports", officerOnly, reportsPage);

export default router;
