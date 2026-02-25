import { Student, Attendance, sequelize } from "../models/associations.js";
import { Op } from "sequelize";

// Auth middleware helper
const requireAuth = (req, res) => {
  if (!req.session.userId) { res.redirect("/login"); return false; }
  return true;
};

// List all students
export const studentsPage = async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const students = await Student.findAll({
      where: { archived: false },
      order: [["lastName", "ASC"]]
    });
    res.render("students", {
      title: "Students",
      students: JSON.stringify(students),
      totalStudents: students.length,
      userName: req.session.userName,
      userRole: req.session.userRole
    });
  } catch (err) {
    console.error("Students page error:", err);
    req.flash("error_msg", "Failed to load students.");
    res.redirect("/dashboard");
  }
};

// Add student page
export const addStudentPage = (req, res) => {
  if (!requireAuth(req, res)) return;
  res.render("student-add", {
    title: "Add Student",
    userName: req.session.userName,
    userRole: req.session.userRole
  });
};

// Create student
export const createStudent = async (req, res) => {
  if (!requireAuth(req, res)) return;
  const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';
  try {
    const { studentId, firstName, lastName, email, course, yearLevel, rfidTag } = req.body;
    const existing = await Student.findOne({ where: { [Op.or]: [{ studentId }, { email }] } });
    if (existing) {
      if (isAjax) return res.json({ success: false, message: 'Student ID or email already exists.' });
      req.flash("error_msg", "Student ID or email already exists.");
      return res.redirect("/students/add");
    }
    await Student.create({ studentId, firstName, lastName, email, course, yearLevel: parseInt(yearLevel), rfidTag: rfidTag || null });
    if (isAjax) return res.json({ success: true, message: `Student ${firstName} ${lastName} added successfully!` });
    req.flash("success_msg", `Student ${firstName} ${lastName} added successfully!`);
    res.redirect("/students");
  } catch (err) {
    console.error("Create student error:", err);
    if (isAjax) return res.status(500).json({ success: false, message: 'Failed to add student.' });
    req.flash("error_msg", "Failed to add student.");
    res.redirect("/students/add");
  }
};

// View single student
export const viewStudent = async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    // Fetch student regardless of archived status
    const student = await Student.findOne({
      where: { id: req.params.id },
      include: [{ model: Attendance, as: "attendances", include: ["event"] }]
    });
    if (!student) {
      req.flash("error_msg", "Student not found.");
      // Redirect to archived or active list based on referrer
      const ref = req.get('Referrer') || '';
      if (ref.includes('/students/archived')) {
        return res.redirect('/students/archived');
      }
      return res.redirect('/students');
    }
    res.render("student-view", {
      title: `${student.firstName} ${student.lastName}`,
      student: JSON.stringify(student),
      userName: req.session.userName,
      userRole: req.session.userRole
    });
  } catch (err) {
    console.error("View student error:", err);
    res.redirect("/students");
  }
};

// Edit student page
export const editStudentPage = async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    // Fetch student regardless of archived status
    const student = await Student.findOne({ where: { id: req.params.id } });
    if (!student) {
      req.flash("error_msg", "Student not found.");
      // Redirect to archived or active list based on referrer
      const ref = req.get('Referrer') || '';
      if (ref.includes('/students/archived')) {
        return res.redirect('/students/archived');
      }
      return res.redirect('/students');
    }
    res.render("student-edit", {
      title: "Edit Student",
      student: JSON.stringify(student),
      userName: req.session.userName,
      userRole: req.session.userRole
    });
  } catch (err) {
    console.error("Edit student page error:", err);
    res.redirect("/students");
  }
};

// Update student
export const updateStudent = async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const { firstName, lastName, email, course, yearLevel, rfidTag, status } = req.body;
    await Student.update(
      { firstName, lastName, email, course, yearLevel: parseInt(yearLevel), rfidTag: rfidTag || null, status },
      { where: { id: req.params.id } }
    );
    req.flash("success_msg", "Student updated successfully!");
    res.redirect("/students");
  } catch (err) {
    console.error("Update student error:", err);
    req.flash("error_msg", "Failed to update student.");
    res.redirect(`/students/${req.params.id}/edit`);
  }
};

// Delete student
export const archiveStudent = async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    await Student.update({ archived: true }, { where: { id: req.params.id } });
    req.flash("success_msg", "Student archived.");
    res.redirect("/students");
  } catch (err) {
    console.error("Archive student error:", err);
    req.flash("error_msg", "Failed to archive student.");
    res.redirect("/students");
  }
};

// API: Search students (for AJAX)
export const searchStudentsAPI = async (req, res) => {
  try {
    const q = req.query.q || "";
    const students = await Student.findAll({
      where: {
        [Op.or]: [
          { studentId: { [Op.like]: `%${q}%` } },
          { firstName: { [Op.like]: `%${q}%` } },
          { lastName: { [Op.like]: `%${q}%` } }
        ],
        status: "active"
      },
      limit: 10
    });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
};

// API: Save face descriptor for a student (or remove if faceData is null)
export const saveFaceData = async (req, res) => {
  try {
    const { id } = req.params;
    const { faceData } = req.body;
    const student = await Student.findByPk(id);
    if (!student) return res.json({ success: false, message: "Student not found." });

    if (faceData === null || faceData === undefined || faceData === '') {
      await Student.update({ faceData: null }, { where: { id } });
      return res.json({ success: true, message: `Face enrollment removed for ${student.firstName} ${student.lastName}.` });
    }

    await Student.update({ faceData }, { where: { id } });
    res.json({ success: true, message: `Face enrolled for ${student.firstName} ${student.lastName}.` });
  } catch (err) {
    console.error("Save face data error:", err);
    res.status(500).json({ success: false, message: "Failed to save face data." });
  }
};

// API: Get all students with face data (for matching)
export const getFaceData = async (req, res) => {
  try {
    const students = await Student.findAll({
      where: { faceData: { [Op.not]: null }, status: "active" },
      attributes: ["id", "studentId", "firstName", "lastName", "course", "yearLevel", "faceData"]
    });
    res.json({ success: true, students });
  } catch (err) {
    console.error("Get face data error:", err);
    res.status(500).json({ success: false, message: "Failed to load face data." });
  }
};
