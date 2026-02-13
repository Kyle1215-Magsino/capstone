
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

import { loginPage, registerPage, forgotPasswordPage, dashboardPage, loginUser, registerUser, logoutUser } from "../controllers/authController.js";

router.get("/login", loginPage);
router.post("/login", loginUser);
router.get("/register", registerPage);
router.post("/register", registerUser);
router.get("/forgot-password", forgotPasswordPage);
router.get("/dashboard", dashboardPage);
router.get("/logout", logoutUser);

// Student routes
import { studentsPage, addStudentPage, createStudent, viewStudent, editStudentPage, updateStudent, deleteStudent, searchStudentsAPI, saveFaceData, getFaceData } from "../controllers/studentController.js";

router.get("/students", studentsPage);
router.get("/students/add", addStudentPage);
router.post("/students/add", createStudent);
router.get("/students/:id", viewStudent);
router.get("/students/:id/edit", editStudentPage);
router.post("/students/:id/edit", updateStudent);
router.post("/students/:id/delete", deleteStudent);
router.get("/api/students/search", searchStudentsAPI);
router.post("/api/students/:id/face", saveFaceData);
router.get("/api/students/faces", getFaceData);

// Event routes
import { eventsPage, addEventPage, createEvent, viewEvent, editEventPage, updateEvent, deleteEvent } from "../controllers/eventController.js";

router.get("/events", eventsPage);
router.get("/events/add", addEventPage);
router.post("/events/add", createEvent);
router.get("/events/:id", viewEvent);
router.get("/events/:id/edit", editEventPage);
router.post("/events/:id/edit", updateEvent);
router.post("/events/:id/delete", deleteEvent);

// Attendance routes
import { checkinPage, processCheckin, liveAttendance, attendanceLogsPage, reportsPage, faceEnrollmentPage } from "../controllers/attendanceController.js";

router.get("/checkin", checkinPage);
router.get("/face-enrollment", faceEnrollmentPage);
router.post("/api/checkin", processCheckin);
router.get("/api/attendance/live/:eventId", liveAttendance);
router.get("/attendance", attendanceLogsPage);
router.get("/reports", reportsPage);

export default router;
