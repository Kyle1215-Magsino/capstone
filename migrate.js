
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
    
import { Sequelize } from "sequelize";
import { sequelize } from "./models/db.js";
import { User, Student, Event, Attendance } from "./models/associations.js";
import inquirer from "inquirer";
import bcrypt from "bcrypt";

// Server-level connection (no database selected)
const rootSequelize = new Sequelize("mysql://root:@localhost:3306/");

const { createDb } = await inquirer.prompt([
  {
    type: "confirm",
    name: "createDb",
    message: "Database 'capstone' may not exist. Create it?",
    default: true,
  },
]);

if (createDb) {
  await rootSequelize.query("CREATE DATABASE IF NOT EXISTS capstone;");
  console.log("✅ Database created (if it did not exist)");
}

try {
  await sequelize.authenticate();
  console.log("✅ Connected to MySQL database!");
  await sequelize.sync({ force: true }); // Drops and recreates tables
  console.log("✅ Tables created for all models!");

  // Seed default credentials
  const hashedAdmin = await bcrypt.hash("admin123", 10);
  const hashedOfficer = await bcrypt.hash("officer123", 10);

  await User.bulkCreate([
    {
      name: "Admin",
      email: "admin@minsu.edu.ph",
      password: hashedAdmin,
      role: "admin",
    },
    {
      name: "USG Officer",
      email: "officer@minsu.edu.ph",
      password: hashedOfficer,
      role: "officer",
    },
  ]);

  console.log("✅ Default credentials seeded!");
  console.log("──────────────────────────────────────");
  console.log("  Admin    → admin@minsu.edu.ph / admin123");
  console.log("  Officer  → officer@minsu.edu.ph / officer123");
  console.log("──────────────────────────────────────");
} catch (err) {
  console.error("❌ Migration failed:", err);
} finally {
  process.exit();
}

