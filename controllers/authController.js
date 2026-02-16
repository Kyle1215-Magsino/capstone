
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
    
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { User, Student, Event, Attendance, sequelize } from "../models/associations.js";

try {
  await sequelize.sync();
} catch (err) {
  console.error("⚠️ Database sync failed (is MySQL running?):", err.message);
}

export const loginPage = (req, res) => res.render("login", { title: "Login" });
export const registerPage = (req, res) => res.render("register", { title: "Register" });
export const forgotPasswordPage = (req, res) => res.render("forgotpassword", { title: "Forgot Password" });

export const dashboardPage = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  try {
    const user = await User.findByPk(req.session.userId);
    const totalStudents = await Student.count();
    const totalEvents = await Event.count();
    const totalAttendance = await Attendance.count();
    const ongoingEvents = await Event.count({ where: { status: "ongoing" } });
    const upcomingEvents = await Event.count({ where: { status: "upcoming" } });

    // Recent attendance records
    const recentAttendance = await Attendance.findAll({
      include: [
        { model: Student, as: "student" },
        { model: Event, as: "event" }
      ],
      order: [["checkInTime", "DESC"]],
      limit: 10
    });

    // Upcoming events
    const upcomingEventsList = await Event.findAll({
      where: { status: "upcoming" },
      order: [["eventDate", "ASC"]],
      limit: 5
    });

    // Monthly attendance data for chart (last 6 months) — fill gaps
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyData = await Attendance.findAll({
      attributes: [
        [sequelize.fn("MONTH", sequelize.col("checkInTime")), "month"],
        [sequelize.fn("YEAR", sequelize.col("checkInTime")), "year"],
        [sequelize.fn("COUNT", sequelize.col("Attendance.id")), "count"]
      ],
      where: { checkInTime: { [Op.gte]: sixMonthsAgo } },
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

    // Also get on-time vs late per month
    const monthlyLate = await Attendance.findAll({
      attributes: [
        [sequelize.fn("MONTH", sequelize.col("checkInTime")), "month"],
        [sequelize.fn("YEAR", sequelize.col("checkInTime")), "year"],
        [sequelize.fn("COUNT", sequelize.col("Attendance.id")), "count"]
      ],
      where: {
        checkInTime: { [Op.gte]: sixMonthsAgo },
        status: "late"
      },
      group: [
        sequelize.fn("YEAR", sequelize.col("checkInTime")),
        sequelize.fn("MONTH", sequelize.col("checkInTime"))
      ],
      raw: true
    });

    // Build full 6-month series with no gaps
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const chartLabels = [];
    const chartValues = [];
    const chartLateValues = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      chartLabels.push(monthNames[m - 1] + " " + y);
      const found = monthlyData.find(r => Number(r.month) === m && Number(r.year) === y);
      chartValues.push(found ? Number(found.count) : 0);
      const foundLate = monthlyLate.find(r => Number(r.month) === m && Number(r.year) === y);
      chartLateValues.push(foundLate ? Number(foundLate.count) : 0);
    }

    // Daily trend for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const dailyData = await Attendance.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("checkInTime")), "date"],
        [sequelize.fn("COUNT", sequelize.col("Attendance.id")), "count"]
      ],
      where: { checkInTime: { [Op.gte]: sevenDaysAgo } },
      group: [sequelize.fn("DATE", sequelize.col("checkInTime"))],
      order: [[sequelize.fn("DATE", sequelize.col("checkInTime")), "ASC"]],
      raw: true
    });
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dailyLabels = [];
    const dailyValues = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      dailyLabels.push(dayNames[d.getDay()] + " " + d.getDate());
      const found = dailyData.find(r => String(r.date) === ds);
      dailyValues.push(found ? Number(found.count) : 0);
    }

    res.render("dashboard", {
      title: "Dashboard",
      userName: user ? user.name : "Officer",
      userRole: user ? user.role : "officer",
      totalStudents,
      totalEvents,
      totalAttendance,
      ongoingEvents,
      upcomingEvents,
      recentAttendance: JSON.stringify(recentAttendance),
      upcomingEventsList: JSON.stringify(upcomingEventsList),
      chartLabels: JSON.stringify(chartLabels),
      chartValues: JSON.stringify(chartValues),
      chartLateValues: JSON.stringify(chartLateValues),
      dailyLabels: JSON.stringify(dailyLabels),
      dailyValues: JSON.stringify(dailyValues)
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.render("dashboard", { title: "Dashboard", userName: "Officer" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password, remember } = req.body;
  const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      if (isAjax) return res.json({ success: false, message: "User not found. Please check your email." });
      req.flash("error_msg", "User not found. Please check your email.");
      return res.redirect("/login");
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      if (isAjax) return res.json({ success: false, message: "Incorrect password." });
      req.flash("error_msg", "Incorrect password.");
      return res.redirect("/login");
    }

    // If "Remember me" is checked, extend session to 30 days
    if (remember === 'true' || remember === true) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    } else {
      req.session.cookie.expires = false; // Session cookie — expires when browser closes
    }

    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userRole = user.role;
    if (isAjax) return res.json({ success: true, message: "Welcome back, " + user.name + "!", redirect: "/dashboard" });
    req.flash("success_msg", "Welcome back, " + user.name + "!");
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Login error:", err);
    if (isAjax) return res.json({ success: false, message: "Login failed. Try again." });
    req.flash("error_msg", "Login failed. Try again.");
    res.redirect("/login");
  }
};

export const registerUser = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';
  if (password !== confirmPassword) {
    if (isAjax) return res.json({ success: false, message: "Passwords do not match." });
    req.flash("error_msg", "Passwords do not match.");
    return res.redirect("/register");
  }
  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      if (isAjax) return res.json({ success: false, message: "Email already registered." });
      req.flash("error_msg", "Email already registered.");
      return res.redirect("/register");
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: "officer" });
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.userRole = user.role;
    if (isAjax) return res.json({ success: true, message: "Account created successfully!", redirect: "/dashboard" });
    req.flash("success_msg", "Account created successfully!");
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Register error:", err);
    if (isAjax) return res.json({ success: false, message: "Registration failed. Try again." });
    req.flash("error_msg", "Registration failed. Try again.");
    res.redirect("/register");
  }
};

export const logoutUser = (req, res) => {
  req.session.destroy();
  res.redirect("/");
};
