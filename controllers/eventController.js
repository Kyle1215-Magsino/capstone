import { Event, Attendance, Student, User, sequelize } from "../models/associations.js";
import { Op } from "sequelize";

const requireAuth = (req, res) => {
  if (!req.session.userId) { res.redirect("/login"); return false; }
  return true;
};

// List all events
export const eventsPage = async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const statusFilter = req.query.status || "";
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const where = {};
    if (statusFilter) where.status = statusFilter;
    if (search) {
      where[Op.or] = [
        { eventName: { [Op.like]: `%${search}%` } },
        { venue: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Event.findAndCountAll({
      where,
      include: [{ model: User, as: "organizer", attributes: ["name"] }],
      order: [["eventDate", "DESC"]],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.render("events", {
      title: "Events",
      events: JSON.stringify(rows),
      totalEvents: count,
      currentPage: page,
      totalPages,
      search,
      statusFilter,
      userName: req.session.userName,
      userRole: req.session.userRole
    });
  } catch (err) {
    console.error("Events page error:", err);
    req.flash("error_msg", "Failed to load events.");
    res.redirect("/dashboard");
  }
};

// Add event page
export const addEventPage = (req, res) => {
  if (!requireAuth(req, res)) return;
  res.render("event-add", {
    title: "Create Event",
    userName: req.session.userName,
    userRole: req.session.userRole
  });
};

// Create event
export const createEvent = async (req, res) => {
  if (!requireAuth(req, res)) return;
  const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';
  try {
    const { eventName, description, eventDate, startTime, endTime, venue, venueLat, venueLng, venueRadius } = req.body;
    await Event.create({
      eventName,
      description,
      eventDate,
      startTime,
      endTime,
      venue,
      venueLat: venueLat ? parseFloat(venueLat) : null,
      venueLng: venueLng ? parseFloat(venueLng) : null,
      venueRadius: venueRadius ? parseInt(venueRadius) : 200,
      status: "upcoming",
      createdBy: req.session.userId
    });
    if (isAjax) return res.json({ success: true, message: `Event "${eventName}" created successfully!` });
    req.flash("success_msg", `Event "${eventName}" created successfully!`);
    res.redirect("/events");
  } catch (err) {
    console.error("Create event error:", err);
    if (isAjax) return res.status(500).json({ success: false, message: 'Failed to create event.' });
    req.flash("error_msg", "Failed to create event.");
    res.redirect("/events/add");
  }
};

// View single event with attendance
export const viewEvent = async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: User, as: "organizer", attributes: ["name"] },
        {
          model: Attendance, as: "attendances",
          include: [{ model: Student, as: "student" }]
        }
      ]
    });
    if (!event) {
      req.flash("error_msg", "Event not found.");
      return res.redirect("/events");
    }

    const totalRegistered = await Attendance.count({ where: { eventId: event.id } });
    const presentCount = await Attendance.count({ where: { eventId: event.id, status: "present" } });
    const lateCount = await Attendance.count({ where: { eventId: event.id, status: "late" } });

    res.render("event-view", {
      title: event.eventName,
      event: JSON.stringify(event),
      totalRegistered,
      presentCount,
      lateCount,
      userName: req.session.userName,
      userRole: req.session.userRole
    });
  } catch (err) {
    console.error("View event error:", err);
    res.redirect("/events");
  }
};

// Edit event page
export const editEventPage = async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      req.flash("error_msg", "Event not found.");
      return res.redirect("/events");
    }
    res.render("event-edit", {
      title: "Edit Event",
      event: JSON.stringify(event),
      userName: req.session.userName,
      userRole: req.session.userRole
    });
  } catch (err) {
    console.error("Edit event page error:", err);
    res.redirect("/events");
  }
};

// Update event
export const updateEvent = async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const { eventName, description, eventDate, startTime, endTime, venue, venueLat, venueLng, venueRadius, status } = req.body;
    await Event.update(
      {
        eventName, description, eventDate, startTime, endTime, venue,
        venueLat: venueLat ? parseFloat(venueLat) : null,
        venueLng: venueLng ? parseFloat(venueLng) : null,
        venueRadius: venueRadius ? parseInt(venueRadius) : 200,
        status
      },
      { where: { id: req.params.id } }
    );
    req.flash("success_msg", "Event updated successfully!");
    res.redirect("/events");
  } catch (err) {
    console.error("Update event error:", err);
    req.flash("error_msg", "Failed to update event.");
    res.redirect(`/events/${req.params.id}/edit`);
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    await Attendance.destroy({ where: { eventId: req.params.id } });
    await Event.destroy({ where: { id: req.params.id } });
    req.flash("success_msg", "Event deleted.");
    res.redirect("/events");
  } catch (err) {
    console.error("Delete event error:", err);
    req.flash("error_msg", "Failed to delete event.");
    res.redirect("/events");
  }
};
