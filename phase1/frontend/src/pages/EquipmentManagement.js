import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // named import, fixed
import "./EquipmentManagement.css";

const EquipmentManagement = () => {
  const [equipment, setEquipment] = useState([]);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchCategory, setSearchCategory] = useState("");
  const [searchAvailability, setSearchAvailability] = useState("");
  const [myRequests, setMyRequests] = useState([]);
  const [borrowedItems, setBorrowedItems] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    condition: "Good",
    quantity: 1,
    availability: "Available",
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("");
  const token = localStorage.getItem("token");
  const [approvedEquipment, setApprovedEquipment] = useState([]);

  useEffect(() => {
    if (token) {
      const decoded = jwtDecode(token);
      setRole(decoded.role);
    }
  }, [token]);

  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // Fetch equipment
  const fetchEquipment = async () => {
    try {
      const url =
        role === "student"
          ? "http://localhost:5000/student/equipment"
          : "http://localhost:5000/staff/equipment";
      const res = await axios.get(url, config);
      setEquipment(res.data);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch equipment");
    }
  };

  const fetchBorrowedItems = async () => {
  if (role === "admin") {
    try {
      const res = await axios.get("http://localhost:5000/admin/lent-items", config);
      setBorrowedItems(res.data);
    } catch (err) {
      console.error("Error fetching borrowed items:", err);
    }
  }
};


  // Fetch student's own requests
const fetchMyRequests = async () => {
  if (role === "student") {
    try {
      const res = await axios.get("http://localhost:5000/student/my-requests", config);
      setMyRequests(res.data);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch your requests");
    }
  }
};

  const fetchApprovedEquipment = async () => {
  if (role === "student") {
    try {
      const res = await axios.get("http://localhost:5000/student/borrow/approved", config);
      setApprovedEquipment(res.data);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch approved equipment");
    }
  }
};




  // Fetch users (admin only)
  const fetchUsers = async () => {
    if (role === "admin") {
      try {
        const res = await axios.get("http://localhost:5000/admin/users", config);
        setUsers(res.data);
      } catch (err) {
        console.error(err);
        setMessage("Failed to fetch users");
      }
    }
  };

  // Fetch equipment requests (admin only)
 // Fetch equipment requests (admin only)
const fetchRequests = async () => {
  if (role === "admin") {
    try {
      const res = await axios.get("http://localhost:5000/staff/requests", config);
      // Include both borrow pending and return requested
      const relevantRequests = res.data.filter(
        (req) => req.status === "Pending" || req.status === "Return Requested"
      );
      setRequests(relevantRequests);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch requests");
    }
  }
};


  useEffect(() => {
    if (role) {
      fetchEquipment();
      fetchUsers();
      fetchRequests();
       fetchApprovedEquipment();
      fetchMyRequests(); 
      fetchBorrowedItems(); // ✅ added
    }
  }, [role]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Staff/Admin add or update equipment
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = editingId
        ? await axios.put(`http://localhost:5000/staff/equipment/${editingId}`, formData, config)
        : await axios.post("http://localhost:5000/staff/equipment", formData, config);

      setMessage(res.data.message);
      setEditingId(null);
      setFormData({ name: "", category: "", condition: "Good", quantity: 1, availability: "Available" });
      fetchEquipment();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData(item);
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`http://localhost:5000/staff/equipment/${id}`, config);
      setMessage(res.data.message);
      fetchEquipment();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Delete failed");
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  // Student requests equipment
// Student requests equipment
const handleRequest = async (equipmentId, quantity) => {
  try {
    const item = equipment.find((eq) => eq.id === equipmentId); // find product name
    const res = await axios.post(
      "http://localhost:5000/student/borrow",
      { equipment_id: equipmentId, quantity },
      config
    );
    setMessage(res.data.message);
    alert(`✅ You requested for "${item?.name}"`);
    fetchEquipment();
  } catch (err) {
    console.error(err);
    setMessage(err.response?.data?.message || "Request failed");
  }
};


  // Admin approves request
  const handleApprove = async (requestId) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/staff/requests/${requestId}/approve`,
        {},
        config
      );
      setMessage(res.data.message);
      fetchEquipment();
      fetchRequests();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Approval failed");
    }
  };

  // Admin rejects request
  const handleReject = async (requestId) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/staff/requests/${requestId}/reject`,
        {},
        config
      );
      setMessage(res.data.message);
      fetchRequests();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Reject failed");
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Equipment Management</h2>
        <button onClick={handleSignOut} style={{ padding: "5px 10px" }}>Sign Out</button>
      </div>
      {message && <p>{message}</p>}

      {/* Admin: view users */}
      {role === "admin" && users.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <h3>All Users</h3>
          <table border="1" width="100%" cellPadding="5" style={{ marginBottom: "20px" }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

     {/* Student equipment request */}
<h3>Equipment List</h3>
{/* Student Dashboard */}
{role === "student" && (
  <div style={{ marginTop: "30px" }}>
    {/* Search Bar */}
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: "10px",
        marginBottom: "20px",
      }}
    >
      <input
        type="text"
        placeholder="Search by category..."
        value={searchCategory}
        onChange={(e) => setSearchCategory(e.target.value)}
        style={{
          padding: "8px",
          width: "220px",
          borderRadius: "5px",
          border: "1px solid #ccc",
        }}
      />

      <select
        value={searchAvailability}
        onChange={(e) => setSearchAvailability(e.target.value)}
        style={{
          padding: "8px",
          borderRadius: "5px",
          border: "1px solid #ccc",
        }}
      >
        <option value="">All Availability</option>
        <option value="Available">Available</option>
        <option value="Unavailable">Unavailable</option>
      </select>
    </div>

    {/* Equipment Table */}
    <h3 style={{ marginBottom: "10px" }}>Available Equipment</h3>
    <table
      border="1"
      width="100%"
      cellPadding="8"
      style={{
        borderCollapse: "collapse",
        textAlign: "center",
        marginBottom: "30px",
      }}
    >
      <thead style={{ backgroundColor: "#f5f5f5" }}>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th>Condition</th>
          <th>Quantity</th>
          <th>Availability</th>
          <th>Request</th>
        </tr>
      </thead>
      <tbody>
        {equipment
          .filter((item) => {
            const matchCategory = searchCategory
              ? item.category.toLowerCase().includes(searchCategory.toLowerCase())
              : true;
            const matchAvailability = searchAvailability
              ? item.availability === searchAvailability
              : true;
            return matchCategory && matchAvailability;
          })
          .map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td>{item.condition}</td>
              <td>{item.quantity}</td>
              <td>{item.availability}</td>
              <td>
                <button
                  disabled={item.quantity < 1 || item.availability !== "Available"}
                  onClick={() => handleRequest(item.id, 1)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "5px",
                    backgroundColor:
                      item.quantity < 1 || item.availability !== "Available"
                        ? "#ccc"
                        : "#4CAF50",
                    color: "white",
                    border: "none",
                    cursor:
                      item.quantity < 1 || item.availability !== "Available"
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  Request
                </button>
              </td>
            </tr>
          ))}
      </tbody>
    </table>

    {/* ✅ My Borrowed Equipment Table */}
    <h3 style={{ marginTop: "40px", marginBottom: "10px" }}>My Borrowed Equipment</h3>
    <table
      border="1"
      width="100%"
      cellPadding="8"
      style={{
        borderCollapse: "collapse",
        textAlign: "center",
        marginBottom: "30px",
      }}
    >
      <thead style={{ backgroundColor: "#f5f5f5" }}>
        <tr>
          <th>Equipment</th>
          <th>Quantity</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {approvedEquipment.length === 0 ? (
          <tr>
            <td colSpan="4">No borrowed equipment</td>
          </tr>
        ) : (
          approvedEquipment.map((item) => (
            <tr key={item.id}>
              <td>{item.equipment_name}</td>
              <td>{item.quantity}</td>
              <td>{item.status}</td>
              <td>
                <button
                  onClick={async () => {
                    try {
                      const res = await axios.post(
                        `http://localhost:5000/student/borrowed/${item.id}/return`,
                        {},
                        config
                      );
                      setMessage(res.data.message);
                      alert("Return request sent successfully");
                      fetchApprovedEquipment();
                      fetchMyRequests();
                    } catch (err) {
                      console.error(err);
                      alert(err.response?.data?.message || "Failed to return equipment");
                    }
                  }}
                  disabled={item.status !== "Approved"}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "5px",
                    backgroundColor:
                      item.status === "Approved" ? "#FF9800" : "#ccc",
                    color: "white",
                    border: "none",
                    cursor:
                      item.status === "Approved" ? "pointer" : "not-allowed",
                  }}
                >
                  Return
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>

    {/* My Requests Table */}
    <h3 style={{ marginTop: "40px", marginBottom: "10px" }}>My Requests</h3>
    <table
      border="1"
      width="100%"
      cellPadding="8"
      style={{
        borderCollapse: "collapse",
        textAlign: "center",
        marginBottom: "30px",
      }}
    >
      <thead style={{ backgroundColor: "#f5f5f5" }}>
        <tr>
          <th>Request ID</th>
          <th>Equipment</th>
          <th>Quantity</th>
          <th>Status</th>
          <th>Requested At</th>
        </tr>
      </thead>
      <tbody>
        {myRequests.length === 0 ? (
          <tr>
            <td colSpan="5">No requests found</td>
          </tr>
        ) : (
          myRequests.map((req) => (
            <tr key={req.id}>
              <td>{req.id}</td>
              <td>{req.equipment_name}</td>
              <td>{req.quantity}</td>
              <td
                style={{
                  color:
                    req.status === "Approved"
                      ? "green"
                      : req.status === "Rejected"
                      ? "red"
                      : req.status === "Returned"
                      ? "gray"
                      : "orange",
                  fontWeight: "bold",
                }}
              >
                {req.status}
              </td>
              <td>{new Date(req.requested_at).toLocaleString()}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)}


{/* Admin: View Pending & Return Requests */}
{role === "admin" && (
  <div style={{ marginTop: "30px" }}>
    <h3>Pending & Return Requests</h3>
    {requests.length === 0 ? (
      <p>No pending or return requests.</p>
    ) : (
      <table
        border="1"
        width="100%"
        cellPadding="8"
        style={{
          borderCollapse: "collapse",
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        <thead style={{ backgroundColor: "#f5f5f5" }}>
          <tr>
            <th>ID</th>
            <th>Student</th>
            <th>Equipment</th>
            <th>Quantity</th>
            <th>Status</th>
            <th>Requested At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.id}>
              <td>{req.id}</td>
              <td>{req.student_name}</td>
              <td>{req.equipment_name}</td>
              <td>{req.quantity}</td>
              <td
                style={{
                  color:
                    req.status === "Approved"
                      ? "green"
                      : req.status === "Rejected"
                      ? "red"
                      : req.status === "Returned"
                      ? "gray"
                      : "orange",
                  fontWeight: "bold",
                }}
              >
                {req.status}
              </td>
              <td>{new Date(req.requested_at).toLocaleString()}</td>
              <td>
                {/* Borrow Requests */}
                {req.status === "Pending" && (
                  <>
                    <button
                      onClick={async () => {
                        if (!window.confirm("Approve this borrow request?")) return;
                        try {
                          const res = await axios.post(
                            `http://localhost:5000/staff/requests/${req.id}/approve`,
                            {},
                            config
                          );
                          setMessage(res.data.message);
                          await Promise.all([
                            fetchEquipment(),
                            fetchRequests(),
                            fetchBorrowedItems(), // refresh borrowed items for admin
                          ]);
                        } catch (err) {
                          console.error("Approve Error:", err);
                          setMessage(
                            err.response?.data?.message || "Approval failed"
                          );
                        }
                      }}
                      style={{
                        marginRight: "8px",
                        padding: "5px 10px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm("Reject this borrow request?")) return;
                        try {
                          const res = await axios.post(
                            `http://localhost:5000/staff/requests/${req.id}/reject`,
                            {},
                            config
                          );
                          setMessage(res.data.message);
                          await fetchRequests();
                        } catch (err) {
                          console.error("Reject Error:", err);
                          setMessage(
                            err.response?.data?.message || "Reject failed"
                          );
                        }
                      }}
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      Reject
                    </button>
                  </>
                )}

                {/* Return Requests */}
                {req.status === "Return Requested" && (
                  <button
                    onClick={async () => {
                      if (!window.confirm("Approve return for this equipment?"))
                        return;
                      try {
                        const res = await axios.post(
                          `http://localhost:5000/staff/requests/${req.id}/approve-return`,
                          {},
                          config
                        );
                        setMessage(res.data.message);
                        await Promise.all([
                          fetchEquipment(),
                          fetchRequests(),
                          fetchBorrowedItems(),
                        ]);
                      } catch (err) {
                        console.error("Approve Return Error:", err);
                        setMessage(
                          err.response?.data?.message || "Return approval failed"
                        );
                      }
                    }}
                    style={{
                      padding: "5px 10px",
                      backgroundColor: "#2196F3",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Approve Return
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}



      {/* Staff/Admin add/edit form */}
      {(role === "staff" || role === "admin") && (
        <form onSubmit={handleSubmit} style={{ marginBottom: "20px", marginTop: "30px" }}>
          <h3>{editingId ? "Update" : "Add"} Equipment</h3>
          <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
          <input type="text" name="category" placeholder="Category" value={formData.category} onChange={handleChange} required />
          <input type="text" name="condition" placeholder="Condition" value={formData.condition} onChange={handleChange} />
          <input type="number" name="quantity" placeholder="Quantity" value={formData.quantity} onChange={handleChange} min={1} />
          <input type="text" name="availability" placeholder="Availability" value={formData.availability} onChange={handleChange} />
          <button type="submit">{editingId ? "Update" : "Add"} Equipment</button>
        </form>
      )}
    </div>
  );
};

export default EquipmentManagement;
