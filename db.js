const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "",        // XAMPP default empty
  database: "fleetflow",
  decimalNumbers: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
pool.getConnection()
  .then(connection => {
    console.log("Connected to MySQL Database Pool (fleetflow)");
    connection.release();
  })
  .catch(err => {
    console.error("Database connection failed:", err);
  });

module.exports = pool;
