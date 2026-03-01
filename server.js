const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

const generateId = (prefix) => `${prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

// Root logging middleware to debug incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.send("FleetFlow API is running!");
});

// DB health check - visit http://127.0.0.1:5000/api/health to diagnose DB issues
app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await db.query("SHOW TABLES");
    const tables = rows.map(r => Object.values(r)[0]);
    res.json({ status: "ok", database: "connected", tables });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message, code: err.code });
  }
});

const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// ==================== AUTHENTICATION ====================
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required." });
    }
    const id = generateId('U');
    const avatarInitials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    await db.query(
      "INSERT INTO users (id, full_name, email, password, role, avatar_initials) VALUES (?, ?, ?, ?, ?, ?)",
      [id, name, email, password, role || "dispatcher", avatarInitials]
    );
    res.status(201).json({ id, name, email, role: role || "dispatcher", avatar: avatarInitials });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Email already exists." });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const [rows] = await db.query(
      "SELECT id, full_name as name, email, password, role, avatar_initials as avatar FROM users WHERE email = ?",
      [email]
    );
    if (rows.length === 0 || rows[0].password !== password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const { password: _, ...user } = rows[0];
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== VEHICLES ====================
app.get("/api/vehicles", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, type, license_plate as licensePlate, max_capacity as maxCapacity,
       odometer, status, region, acquisition_cost as acquisitionCost, year_acquired as yearAcquired
       FROM vehicles ORDER BY name ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/vehicles", async (req, res) => {
  try {
    const { name, type, licensePlate, maxCapacity, odometer, status, region, acquisitionCost, yearAcquired } = req.body;
    const id = generateId('V');
    await db.query(
      "INSERT INTO vehicles (id, name, type, license_plate, max_capacity, odometer, status, region, acquisition_cost, year_acquired) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, name, type, licensePlate, maxCapacity || 0, odometer || 0, status || "Available", region, acquisitionCost || 0, yearAcquired || new Date().getFullYear()]
    );
    res.status(201).json({ id, name, type, licensePlate, maxCapacity, odometer, status, region, acquisitionCost, yearAcquired });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/vehicles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const mapping = {
      name: "name", type: "type", licensePlate: "license_plate",
      maxCapacity: "max_capacity", odometer: "odometer", status: "status",
      region: "region", acquisitionCost: "acquisition_cost", yearAcquired: "year_acquired"
    };
    const setClause = [], values = [];
    for (const [key, value] of Object.entries(req.body)) {
      if (mapping[key]) { setClause.push(`${mapping[key]} = ?`); values.push(value); }
    }
    if (setClause.length === 0) return res.json({ success: true });
    values.push(id);
    await db.query(`UPDATE vehicles SET ${setClause.join(", ")} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/vehicles/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM vehicles WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== DRIVERS ====================
app.get("/api/drivers", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.id, d.name, d.email, d.phone, d.license_number as licenseNumber,
       d.license_expiry as licenseExpiry, d.status, d.safety_score as safetyScore,
       d.trips_completed as tripsCompleted, d.avatar_initials as avatar
       FROM drivers d ORDER BY d.name ASC`
    );
    const drivers = await Promise.all(rows.map(async (driver) => {
      const [cats] = await db.query("SELECT category FROM driver_license_categories WHERE driver_id = ?", [driver.id]);
      return { ...driver, licenseCategories: cats.map(c => c.category) };
    }));
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/drivers", async (req, res) => {
  try {
    const { name, email, phone, licenseNumber, licenseExpiry, licenseCategories, status, safetyScore } = req.body;
    const id = generateId('D');
    const avatarInitials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    await db.query(
      "INSERT INTO drivers (id, name, email, phone, license_number, license_expiry, status, safety_score, trips_completed, avatar_initials) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, name, email, phone, licenseNumber, licenseExpiry, status || "Off Duty", safetyScore || 100, 0, avatarInitials]
    );
    if (licenseCategories && licenseCategories.length > 0) {
      for (const cat of licenseCategories) {
        await db.query("INSERT INTO driver_license_categories (driver_id, category) VALUES (?, ?)", [id, cat]);
      }
    }
    res.status(201).json({ id, name, email, phone, licenseNumber, licenseExpiry, licenseCategories: licenseCategories || [], status, safetyScore, tripsCompleted: 0, avatar: avatarInitials });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/drivers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { licenseCategories, ...rest } = req.body;
    const mapping = {
      name: "name", email: "email", phone: "phone",
      licenseNumber: "license_number", licenseExpiry: "license_expiry",
      status: "status", safetyScore: "safety_score", tripsCompleted: "trips_completed"
    };
    const setClause = [], values = [];
    for (const [key, value] of Object.entries(rest)) {
      if (mapping[key]) { setClause.push(`${mapping[key]} = ?`); values.push(value); }
    }
    if (setClause.length > 0) {
      values.push(id);
      await db.query(`UPDATE drivers SET ${setClause.join(", ")} WHERE id = ?`, values);
    }
    if (licenseCategories !== undefined) {
      await db.query("DELETE FROM driver_license_categories WHERE driver_id = ?", [id]);
      for (const cat of licenseCategories) {
        await db.query("INSERT INTO driver_license_categories (driver_id, category) VALUES (?, ?)", [id, cat]);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/drivers/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM driver_license_categories WHERE driver_id = ?", [req.params.id]);
    await db.query("DELETE FROM drivers WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== TRIPS ====================
app.get("/api/trips", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, vehicle_id as vehicleId, driver_id as driverId, origin, destination,
       cargo_weight as cargoWeight, cargo_description as cargoDescription, status,
       created_at as createdAt, dispatched_at as dispatchedAt, completed_at as completedAt,
       start_odometer as startOdometer, end_odometer as endOdometer,
       estimated_fuel_cost as estimatedFuelCost, actual_fuel_cost as actualFuelCost,
       liters_filled as litersFilled, final_odometer as finalOdometer
       FROM trips ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/trips", async (req, res) => {
  try {
    const { vehicleId, driverId, origin, destination, cargoWeight, cargoDescription, status, startOdometer, estimatedFuelCost } = req.body;
    const id = generateId('T');
    const createdAt = new Date().toISOString();
    await db.query(
      `INSERT INTO trips (id, vehicle_id, driver_id, origin, destination, cargo_weight, cargo_description, status, created_at, start_odometer, estimated_fuel_cost)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, vehicleId, driverId, origin, destination, cargoWeight || 0, cargoDescription || "", status || "Draft", createdAt, startOdometer || 0, estimatedFuelCost || 0]
    );
    if (status === "Dispatched") {
      await db.query("UPDATE vehicles SET status = 'On Trip' WHERE id = ?", [vehicleId]);
      await db.query("UPDATE drivers SET status = 'On Duty' WHERE id = ?", [driverId]);
    }
    res.status(201).json({ id, vehicleId, driverId, origin, destination, cargoWeight, cargoDescription, status: status || "Draft", createdAt, startOdometer, estimatedFuelCost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/trips/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, endOdometer } = req.body;
    const [tripRows] = await db.query("SELECT vehicle_id, driver_id FROM trips WHERE id = ?", [id]);
    if (tripRows.length === 0) return res.status(404).json({ error: "Trip not found." });
    const { vehicle_id, driver_id } = tripRows[0];

    const updates = { status };
    if (status === "Dispatched") {
      updates.dispatched_at = new Date().toISOString();
      await db.query("UPDATE vehicles SET status = 'On Trip' WHERE id = ?", [vehicle_id]);
      await db.query("UPDATE drivers SET status = 'On Duty' WHERE id = ?", [driver_id]);
    } else if (status === "Completed") {
      updates.completed_at = new Date().toISOString();
      if (endOdometer) updates.end_odometer = endOdometer;
      await db.query("UPDATE vehicles SET status = 'Available', odometer = ? WHERE id = ?", [endOdometer || 0, vehicle_id]);
      await db.query("UPDATE drivers SET status = 'Off Duty', trips_completed = trips_completed + 1 WHERE id = ?", [driver_id]);
    } else if (status === "Cancelled") {
      await db.query("UPDATE vehicles SET status = 'Available' WHERE id = ?", [vehicle_id]);
      await db.query("UPDATE drivers SET status = 'Off Duty' WHERE id = ?", [driver_id]);
    }

    let setClause = "status = ?";
    const vals = [status];
    if (updates.dispatched_at) { setClause += ", dispatched_at = ?"; vals.push(updates.dispatched_at); }
    if (updates.completed_at) { setClause += ", completed_at = ?"; vals.push(updates.completed_at); }
    if (updates.end_odometer) { setClause += ", end_odometer = ?"; vals.push(updates.end_odometer); }
    vals.push(id);
    await db.query(`UPDATE trips SET ${setClause} WHERE id = ?`, vals);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/trips/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const mapping = {
      vehicleId: "vehicle_id", driverId: "driver_id", origin: "origin",
      destination: "destination", cargoWeight: "cargo_weight", cargoDescription: "cargo_description",
      status: "status", startOdometer: "start_odometer", endOdometer: "end_odometer",
      estimatedFuelCost: "estimated_fuel_cost", actualFuelCost: "actual_fuel_cost",
      litersFilled: "liters_filled", finalOdometer: "final_odometer"
    };
    const setClause = [], values = [];
    for (const [key, value] of Object.entries(req.body)) {
      if (mapping[key]) { setClause.push(`${mapping[key]} = ?`); values.push(value); }
    }
    if (setClause.length === 0) return res.json({ success: true });
    values.push(id);
    await db.query(`UPDATE trips SET ${setClause.join(", ")} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/trips/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM trips WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== MAINTENANCE ====================
app.get("/api/maintenance", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, vehicle_id as vehicleId, service_type as type, description, cost, service_date as date, status FROM maintenance_logs ORDER BY service_date DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/maintenance", async (req, res) => {
  try {
    const { vehicleId, type, description, cost, date, status } = req.body;
    const id = generateId('M');
    await db.query(
      "INSERT INTO maintenance_logs (id, vehicle_id, service_type, description, cost, service_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, vehicleId, type, description, cost || 0, date, status || "Scheduled"]
    );
    if (status === "In Progress") {
      await db.query("UPDATE vehicles SET status = 'In Shop' WHERE id = ?", [vehicleId]);
    } else if (status === "Completed") {
      await db.query("UPDATE vehicles SET status = 'Available' WHERE id = ?", [vehicleId]);
    }
    res.status(201).json({ id, vehicleId, type, description, cost, date, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/maintenance/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const mapping = {
      vehicleId: "vehicle_id", type: "service_type", description: "description",
      cost: "cost", date: "service_date", status: "status"
    };
    const setClause = [], values = [];
    for (const [key, value] of Object.entries(req.body)) {
      if (mapping[key]) { setClause.push(`${mapping[key]} = ?`); values.push(value); }
    }
    if (setClause.length === 0) return res.json({ success: true });
    values.push(id);
    await db.query(`UPDATE maintenance_logs SET ${setClause.join(", ")} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/maintenance/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM maintenance_logs WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== FUEL LOGS ====================
app.get("/api/fuel", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, vehicle_id as vehicleId, trip_id as tripId, liters, cost,
       log_date as date, odometer_reading as odometer
       FROM fuel_logs ORDER BY log_date DESC, id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/fuel", async (req, res) => {
  try {
    const { vehicleId, tripId, liters, cost, date, odometer } = req.body;
    const id = generateId("F");
    await db.query(
      "INSERT INTO fuel_logs (id, vehicle_id, trip_id, liters, cost, log_date, odometer_reading) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, vehicleId, tripId || null, liters || 0, cost || 0, date, odometer || 0]
    );
    res.status(201).json({
      id,
      vehicleId,
      tripId: tripId || null,
      liters: liters || 0,
      cost: cost || 0,
      date,
      odometer: odometer || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on http://127.0.0.1:5000");
});
