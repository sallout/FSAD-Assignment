import express from "express";
import pool from "./db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authenticateToken, authorizeRoles } from "./auth.js";
import cors from "cors";

const app = express();
const PORT = 5000;



// CORS configuration
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

// Middleware
app.use(express.json());

// JWT secret
const JWT_SECRET = "your_secret_key"; // Replace with a strong secret



// ---------------- SIGNUP ----------------
app.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, hashedPassword, role]
    );

    res.status(201).json({ message: "User created", user: newUser.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- LOGIN ----------------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- TEST ROUTE ----------------
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.send(`PostgreSQL connected! Server time: ${result.rows[0].now}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database connection error");
  }
});

// ---------------- EQUIPMENT MANAGEMENT ----------------
// Student: view equipment
app.get("/student/equipment", authenticateToken, authorizeRoles("student"), async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM equipment ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Staff/Admin: add equipment
app.post("/staff/equipment", authenticateToken, authorizeRoles("staff", "admin"), async (req, res) => {
  const { name, category, condition, quantity, availability } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO equipment (name, category, condition, quantity, availability)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, category, condition || "Good", quantity, availability || "Available"]
    );

    res.status(201).json({ message: "Equipment added", equipment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Staff/Admin: update equipment
app.put("/staff/equipment/:id", authenticateToken, authorizeRoles("staff", "admin"), async (req, res) => {
  const { id } = req.params;
  const { name, category, condition, quantity, availability } = req.body;

  try {
    const result = await pool.query(
      `UPDATE equipment
       SET name=$1, category=$2, condition=$3, quantity=$4, availability=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [name, category, condition, quantity, availability, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: "Equipment not found" });

    res.json({ message: "Equipment updated", equipment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Staff/Admin: delete equipment
app.delete("/staff/equipment/:id", authenticateToken, authorizeRoles("staff", "admin"), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM equipment WHERE id=$1 RETURNING *", [id]);

    if (result.rows.length === 0) return res.status(404).json({ message: "Equipment not found" });

    res.json({ message: "Equipment deleted", equipment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- ADMIN USER MANAGEMENT ----------------
app.get("/admin/users", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const users = await pool.query("SELECT id, name, email, role FROM users ORDER BY id ASC");
    res.json(users.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- BORROWING WORKFLOW ----------------
// Student: request equipment
app.post("/student/borrow", authenticateToken, authorizeRoles("student"), async (req, res) => {
  const { equipment_id, quantity } = req.body;
  const student_id = req.user.id;

  try {
    const equipment = await pool.query("SELECT * FROM equipment WHERE id=$1", [equipment_id]);
    if (equipment.rows.length === 0) return res.status(404).json({ message: "Equipment not found" });
    if (equipment.rows[0].quantity < quantity) return res.status(400).json({ message: "Not enough quantity available" });

    const result = await pool.query(
      "INSERT INTO borrow_requests (equipment_id, student_id, quantity) VALUES ($1, $2, $3) RETURNING *",
      [equipment_id, student_id, quantity]
    );

    res.status(201).json({ message: "Borrow request created", request: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Staff/Admin: view all requests
app.get("/staff/requests", authenticateToken, authorizeRoles("staff", "admin"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT br.id, br.status, br.quantity, br.requested_at, br.approved_at, br.returned_at,
              u.name AS student_name, e.name AS equipment_name
       FROM borrow_requests br
       JOIN users u ON br.student_id=u.id
       JOIN equipment e ON br.equipment_id=e.id
       ORDER BY br.requested_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Staff/Admin: approve request
app.post("/staff/requests/:id/approve", authenticateToken, authorizeRoles("staff", "admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const request = await pool.query("SELECT * FROM borrow_requests WHERE id=$1", [id]);
    if (request.rows.length === 0) return res.status(404).json({ message: "Request not found" });
    if (request.rows[0].status !== "Pending") return res.status(400).json({ message: "Request already processed" });

    const equipment = await pool.query("SELECT * FROM equipment WHERE id=$1", [request.rows[0].equipment_id]);
    if (equipment.rows[0].quantity < request.rows[0].quantity) return res.status(400).json({ message: "Not enough equipment available" });

    await pool.query(
      "UPDATE borrow_requests SET status='Approved', approved_at=NOW() WHERE id=$1",
      [id]
    );

    await pool.query(
      "UPDATE equipment SET quantity=quantity-$1 WHERE id=$2",
      [request.rows[0].quantity, request.rows[0].equipment_id]
    );

    res.json({ message: "Request approved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Staff/Admin: reject request
app.post("/staff/requests/:id/reject", authenticateToken, authorizeRoles("staff", "admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const request = await pool.query("SELECT * FROM borrow_requests WHERE id=$1", [id]);
    if (request.rows.length === 0) return res.status(404).json({ message: "Request not found" });
    if (request.rows[0].status !== "Pending") return res.status(400).json({ message: "Request already processed" });

    await pool.query(
      "UPDATE borrow_requests SET status='Rejected', approved_at=NOW() WHERE id=$1",
      [id]
    );

    res.json({ message: "Request rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Staff/Admin: mark returned
app.post("/staff/requests/:id/return", authenticateToken, authorizeRoles("staff", "admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const request = await pool.query("SELECT * FROM borrow_requests WHERE id=$1", [id]);
    if (request.rows.length === 0) return res.status(404).json({ message: "Request not found" });
    if (request.rows[0].status !== "Approved") return res.status(400).json({ message: "Only approved requests can be returned" });

    await pool.query(
      "UPDATE borrow_requests SET status='Returned', returned_at=NOW() WHERE id=$1",
      [id]
    );

    await pool.query(
      "UPDATE equipment SET quantity=quantity+$1 WHERE id=$2",
      [request.rows[0].quantity, request.rows[0].equipment_id]
    );

    res.json({ message: "Equipment marked as returned" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Student: view their borrowed/approved equipment
app.get("/student/borrowed", authenticateToken, authorizeRoles("student"), async (req, res) => {
  const student_id = req.user.id;

  try {
    const result = await pool.query(
      `SELECT br.id AS request_id, br.status, br.quantity, br.requested_at, br.approved_at, br.returned_at,
              e.id AS equipment_id, e.name AS equipment_name, e.category
       FROM borrow_requests br
       JOIN equipment e ON br.equipment_id = e.id
       WHERE br.student_id=$1
       ORDER BY br.requested_at DESC`,
      [student_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Student: request return of equipment
app.post("/student/borrowed/:id/return", authenticateToken, authorizeRoles("student"), async (req, res) => {
  const { id } = req.params; // borrow_request id
  const student_id = req.user.id;

  try {
    const request = await pool.query(
      "SELECT * FROM borrow_requests WHERE id=$1 AND student_id=$2",
      [id, student_id]
    );

    if (request.rows.length === 0) return res.status(404).json({ message: "Request not found" });
    if (request.rows[0].status !== "Approved") return res.status(400).json({ message: "Only approved borrow can be returned" });

    await pool.query(
      "UPDATE borrow_requests SET status='Return Requested' WHERE id=$1",
      [id]
    );

    res.json({ message: "Return requested. Admin approval needed." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// Staff/Admin: approve return request
app.post("/staff/requests/:id/return", authenticateToken, authorizeRoles("staff", "admin"), async (req, res) => {
  const { id } = req.params;

  try {
    const request = await pool.query("SELECT * FROM borrow_requests WHERE id=$1", [id]);
    if (request.rows.length === 0) return res.status(404).json({ message: "Request not found" });
    if (!["Return Requested", "Approved"].includes(request.rows[0].status))
      return res.status(400).json({ message: "Return not applicable for this request" });

    await pool.query(
      "UPDATE borrow_requests SET status='Returned', returned_at=NOW() WHERE id=$1",
      [id]
    );

    await pool.query(
      "UPDATE equipment SET quantity=quantity+$1 WHERE id=$2",
      [request.rows[0].quantity, request.rows[0].equipment_id]
    );

    res.json({ message: "Return approved and equipment quantity updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


  // Staff/Admin: get all equipment
app.get("/staff/equipment", authenticateToken, authorizeRoles("staff", "admin"), async (req, res) => {
  const result = await pool.query("SELECT * FROM equipment ORDER BY id ASC");
  res.json(result.rows);
});


// Student: view their approved borrowed equipment
app.get("/student/borrow/approved", authenticateToken, authorizeRoles("student"), async (req, res) => {
  const student_id = req.user.id;
  try {
    const result = await pool.query(
      `SELECT br.id, br.quantity, br.status, br.requested_at, br.approved_at, br.returned_at,
              e.name AS equipment_name, e.category, e.condition
       FROM borrow_requests br
       JOIN equipment e ON br.equipment_id = e.id
       WHERE br.student_id=$1 AND br.status='Approved'
       ORDER BY br.approved_at DESC`,
      [student_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- STAFF RETURN APPROVAL ----------------
// Approve a return request submitted by a student
app.post("/staff/requests/:id/approve-return", authenticateToken, authorizeRoles("staff", "admin"), async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the borrow request
    const request = await pool.query("SELECT * FROM borrow_requests WHERE id=$1", [id]);
    if (request.rows.length === 0) return res.status(404).json({ message: "Request not found" });

    // Only allow if student has requested return
    if (request.rows[0].status !== "Return Requested")
      return res.status(400).json({ message: "Only return requested borrow can be approved" });

    // Update request status to Returned
    await pool.query(
      "UPDATE borrow_requests SET status='Returned', returned_at=NOW() WHERE id=$1",
      [id]
    );

    // Update equipment quantity
    await pool.query(
      "UPDATE equipment SET quantity=quantity+$1 WHERE id=$2",
      [request.rows[0].quantity, request.rows[0].equipment_id]
    );

    res.json({ message: "Return approved and equipment quantity updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- STUDENT: VIEW ALL REQUESTS (Pending, Approved, Rejected, Returned) ----------------
app.get("/student/my-requests", authenticateToken, authorizeRoles("student"), async (req, res) => {
  const student_id = req.user.id;

  try {
    const result = await pool.query(
      `SELECT 
          br.id,
          e.name AS equipment_name,
          br.quantity,
          br.status,
          br.requested_at
       FROM borrow_requests br
       JOIN equipment e ON e.id = br.equipment_id
       WHERE br.student_id = $1
       ORDER BY br.requested_at DESC`,
      [student_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching student requests:", err);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});

// Get all borrowed equipment with student info
app.get("/borrowed-items", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        br.id AS request_id,
        u.name AS student_name,
        e.name AS equipment_name,
        e.category,
        br.quantity,
        br.status,
        br.requested_at,
        br.return_date
      FROM borrow_requests br
      JOIN users u ON u.id = br.student_id
      JOIN equipment e ON e.id = br.equipment_id
      ORDER BY br.requested_at DESC
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching borrowed items:", error);
    res.status(500).json({ message: "Server error" });
  }
});



// Start server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
