import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // named import, fixed
import API_BASE_URL from "../config/api";
import "./EquipmentManagement.css";

const EquipmentManagement = () => {
  const [equipment, setEquipment] = useState([]);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
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
  const [currentUserId, setCurrentUserId] = useState(null);
  const token = localStorage.getItem("token");
  const [approvedEquipment, setApprovedEquipment] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    category: "",
    condition: "Good",
    quantity: 1,
    availability: "Available",
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: "",
    category: "",
    condition: "Good",
    quantity: 1,
    availability: "Available",
  });

  useEffect(() => {
    if (token) {
      const decoded = jwtDecode(token);
      setRole(decoded.role);
      setCurrentUserId(decoded.id || decoded.userId);
      console.log("Current user:", decoded);
    }
  }, [token]);

  const config = {
    headers: { 
      Authorization: `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true' // Required for ngrok tunnels
    },
  };

  // Fetch equipment
  const fetchEquipment = async () => {
    try {
      const url =
        role === "student"
          ? `${API_BASE_URL}/student/equipment`
          : `${API_BASE_URL}/staff/equipment`;
      console.log("Fetching equipment from:", url, "with config:", config);
      const res = await axios.get(url, config);
      console.log("Equipment response:", res.data);
      setEquipment(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching equipment:", err.response?.status, err.response?.data, err.message);
      setEquipment([]);
      setMessage("Failed to fetch equipment: " + (err.response?.data?.message || err.message));
    }
  };

  const fetchBorrowedItems = async () => {
  if (role === "admin") {
    try {
      console.log("Fetching borrowed items for admin user");
      console.log("API URL:", `${API_BASE_URL}/admin/lent-items`);
      console.log("Config:", config);
      
      const res = await axios.get(`${API_BASE_URL}/admin/lent-items`, config);
      console.log("Borrowed items response:", res.data);
      setBorrowedItems(Array.isArray(res.data) ? res.data : []);
      
      // Also try debug endpoint
      try {
        const debugRes = await axios.get(`${API_BASE_URL}/admin/all-requests`, config);
        console.log("Debug - ALL requests:", debugRes.data);
      } catch (debugErr) {
        console.error("Debug endpoint error:", debugErr);
      }
      
    } catch (err) {
      console.error("Error fetching borrowed items:", {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers
      });
      setBorrowedItems([]);
      setMessage("Failed to fetch borrowed items: " + (err.response?.data?.message || err.message));
    }
  } else {
    setBorrowedItems([]);
  }
};


  // Fetch student's own requests
const fetchMyRequests = async () => {
  if (role === "student") {
    try {
      const res = await axios.get(`${API_BASE_URL}/student/my-requests`, config);
      setMyRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching my requests:", err);
      setMyRequests([]);
      setMessage("Failed to fetch your requests");
    }
  } else {
    setMyRequests([]);
  }
};

  const fetchApprovedEquipment = async () => {
  if (role === "student") {
    try {
      const res = await axios.get(`${API_BASE_URL}/student/borrow/approved`, config);
      setApprovedEquipment(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching approved equipment:", err);
      setApprovedEquipment([]);
      setMessage("Failed to fetch approved equipment");
    }
  } else {
    setApprovedEquipment([]);
  }
};




  // Fetch users (admin only)
  const fetchUsers = async () => {
    if (role === "admin") {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/users`, config);
        setUsers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching users:", err);
        setUsers([]); // Ensure users is always an array
        setMessage("Failed to fetch users");
      }
    } else {
      setUsers([]); // Ensure users is always an array for non-admin users
    }
  };

  // Fetch equipment requests (admin only)
 // Fetch equipment requests (admin only)
const fetchRequests = async () => {
  if (role === "admin") {
    try {
      const res = await axios.get(`${API_BASE_URL}/staff/requests`, config);
      // Include both borrow pending and return requested
      const relevantRequests = Array.isArray(res.data) ? res.data.filter(
        (req) => req.status === "Pending" || req.status === "Return Requested"
      ) : [];
      setRequests(relevantRequests);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setRequests([]);
      setMessage("Failed to fetch requests");
    }
  } else {
    setRequests([]);
  }
};

  // Fetch all requests for admin panel with complete details
  const fetchAllRequests = async () => {
    if (role === "admin" || role === "staff") {
      try {
        // Use the same endpoint as the working Pending & Return Requests section
        const res = await axios.get(`${API_BASE_URL}/staff/requests`, config);
        console.log("Fetched all requests:", res.data);
        
        // Don't filter - get ALL requests (unlike fetchRequests which filters)
        setAllRequests(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch all requests:", err);
        setAllRequests([]);
        setMessage("Failed to fetch all requests");
      }
    } else {
      setAllRequests([]);
    }
  };

  useEffect(() => {
    if (role && token) {
      console.log("Fetching data for role:", role, "with token:", token ? "present" : "missing");
      fetchEquipment();
      fetchUsers();
      fetchRequests();
      fetchAllRequests();
      fetchApprovedEquipment();
      fetchMyRequests(); 
      fetchBorrowedItems();
    }
  }, [role, token]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Staff/Admin add or update equipment
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = editingId
        ? await axios.put(`${API_BASE_URL}/staff/equipment/${editingId}`, formData, config)
        : await axios.post(`${API_BASE_URL}/staff/equipment`, formData, config);

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
    setEditFormData({
      name: item.name,
      category: item.category,
      condition: item.condition,
      quantity: item.quantity,
      availability: item.availability,
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        `${API_BASE_URL}/staff/equipment/${editingId}`,
        editFormData,
        config
      );
      setMessage(res.data.message);
      setShowEditModal(false);
      setEditingId(null);
      fetchEquipment();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Update failed");
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingId(null);
    setEditFormData({
      name: "",
      category: "",
      condition: "Good",
      quantity: 1,
      availability: "Available",
    });
  };

  const handleAddFormChange = (e) => {
    setAddFormData({
      ...addFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_BASE_URL}/staff/equipment`,
        addFormData,
        config
      );
      setMessage(res.data.message);
      setShowAddModal(false);
      setAddFormData({
        name: "",
        category: "",
        condition: "Good",
        quantity: 1,
        availability: "Available",
      });
      fetchEquipment();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Failed to add equipment");
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddFormData({
      name: "",
      category: "",
      condition: "Good",
      quantity: 1,
      availability: "Available",
    });
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/staff/equipment/${id}`, config);
      setMessage(res.data.message);
      fetchEquipment();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Delete failed");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      console.log("Attempting to delete user with ID:", userId);
      
      const res = await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, config);
      console.log("Delete response:", res.data);
      
      setMessage(res.data.message);
      fetchUsers(); // Refresh users list
    } catch (err) {
      console.error("Delete user failed:", err);
      
      const errorMsg = err.response?.data?.message || 
                      err.response?.statusText || 
                      "Failed to delete user";
      setMessage(errorMsg);
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
      `${API_BASE_URL}/student/borrow`,
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
        `${API_BASE_URL}/staff/requests/${requestId}/approve`,
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
        `${API_BASE_URL}/staff/requests/${requestId}/reject`,
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
    <div className="equipment-page">
      <div className="equipment-container">
        <div className="equipment-header">
          <h2 className="page-title">Equipment Management</h2>
          <button onClick={handleSignOut} className="signout-btn">Sign Out</button>
        </div>
        {message && <div className="message-alert">{message}</div>}

      {/* Admin: view users */}
      {role === "admin" && users.length > 0 && (
        <div className="section">
          <h3 className="section-title">All Users</h3>
          <table className="equipment-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(users) && users.map((user) => (
                <tr key={user.id}>
                  <td data-label="ID">{user.id}</td>
                  <td data-label="Name">{user.name}</td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Role">
                    <span className={`status-badge ${user.role === 'admin' ? 'status-admin' : user.role === 'staff' ? 'status-staff' : 'status-student'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td data-label="Actions">
                    {user.id === currentUserId ? (
                      <button className="btn btn-secondary" disabled title="Cannot delete yourself">
                        Cannot Delete Self
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          console.log("Attempting to delete user:", user);
                          if (window.confirm(
                            `Are you sure you want to delete user "${user.name}" (${user.email})?\n\nThis action cannot be undone!`
                          )) {
                            handleDeleteUser(user.id);
                          }
                        }}
                        className="btn btn-danger"
                        title={`Delete user ${user.name}`}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin: Borrowed/Lent Items Section */}
      {role === "admin" && (
        <div className="section">
          <h3 className="section-title">Currently Borrowed Items</h3>
          {!Array.isArray(borrowedItems) || borrowedItems.length === 0 ? (
            <p>No items currently borrowed.</p>
          ) : (
            <table className="equipment-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Student</th>
                  <th>Equipment</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Borrowed Date</th>
                </tr>
              </thead>
              <tbody>
                {borrowedItems.map((item) => (
                  <tr key={item.request_id}>
                    <td data-label="Request ID">{item.request_id}</td>
                    <td data-label="Student">{item.student_name}</td>
                    <td data-label="Equipment">{item.equipment_name}</td>
                    <td data-label="Category">{item.category}</td>
                    <td data-label="Quantity">{item.quantity}</td>
                    <td data-label="Status">
                      <span className={`status-badge ${
                        item.status === 'Approved' ? 'status-approved' : 
                        item.status === 'Return Requested' ? 'status-return-requested' : 
                        'status-pending'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td data-label="Borrowed Date">
                      {item.requested_at ? new Date(item.requested_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* All Equipment Requests Section for Admin */}
      {(role === "admin" || role === "staff") && (
        <div className="section">
          <h3 className="section-title">All Equipment Requests</h3>
          <table className="equipment-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Student Name</th>
                <th>Equipment</th>
                <th>Quantity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!Array.isArray(allRequests) || allRequests.length === 0 ? (
                <tr>
                  <td colSpan="5">No requests found</td>
                </tr>
              ) : (
                allRequests.map((request) => (
                  <tr key={request.id}>
                    <td data-label="Request ID">{request.id}</td>
                    <td data-label="Student Name">{request.student_name || 'Unknown Student'}</td>
                    <td data-label="Equipment">{request.equipment_name || 'Unknown Equipment'}</td>
                    <td data-label="Quantity">{request.quantity}</td>
                    <td data-label="Status">
                      <span className={`status-badge ${
                        request.status === 'Approved' ? 'status-approved' : 
                        request.status === 'Pending' ? 'status-pending' : 
                        request.status === 'Return Requested' ? 'status-return' :
                        request.status === 'Rejected' ? 'status-rejected' :
                        'status-pending'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin/Staff Equipment Management Section */}
      {(role === "admin" || role === "staff") && (
        <div className="section">
          <div className="section-header">
            <h3 className="section-title">Equipment Management (CRUD Operations)</h3>
            <button 
              onClick={() => setShowAddModal(true)} 
              className="btn btn-primary add-product-btn"
            >
              + Add Product
            </button>
          </div>
          <table className="equipment-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Condition</th>
                <th>Quantity</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!Array.isArray(equipment) || equipment.length === 0 ? (
                <tr>
                  <td colSpan="7">No equipment found</td>
                </tr>
              ) : (
                equipment.map((item) => (
                  <tr key={item.id}>
                    <td data-label="ID">{item.id}</td>
                    <td data-label="Name">{item.name}</td>
                    <td data-label="Category">{item.category}</td>
                    <td data-label="Condition">{item.condition}</td>
                    <td data-label="Quantity">{item.quantity}</td>
                    <td data-label="Availability">
                      <span className={`status-badge ${item.availability === 'Available' ? 'status-available' : 'status-unavailable'}`}>
                        {item.availability}
                      </span>
                    </td>
                    <td data-label="Actions">
                      <button
                        onClick={() => handleEdit(item)}
                        className="btn btn-primary"
                        style={{ marginRight: '8px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
                            handleDelete(item.id);
                          }
                        }}
                        className="btn btn-danger"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
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
    <h3 className="section-title">Available Equipment</h3>
    <table className="equipment-table">
      <thead>
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
              <td data-label="Name">{item.name}</td>
              <td data-label="Category">{item.category}</td>
              <td data-label="Condition">{item.condition}</td>
              <td data-label="Quantity">{item.quantity}</td>
              <td data-label="Availability">{item.availability}</td>
              <td data-label="Action">
                <button
                  disabled={item.quantity < 1 || item.availability !== "Available"}
                  onClick={() => handleRequest(item.id, 1)}
                  className={`btn ${item.quantity < 1 || item.availability !== "Available" ? "" : "btn-success"}`}
                >
                  Request
                </button>
              </td>
            </tr>
          ))}
      </tbody>
    </table>

    {/* ✅ My Borrowed Equipment Table */}
    <h3 className="section-title">My Borrowed Equipment</h3>
    <table className="equipment-table">
      <thead>
        <tr>
          <th>Equipment</th>
          <th>Quantity</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {!Array.isArray(approvedEquipment) || approvedEquipment.length === 0 ? (
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
                        `${API_BASE_URL}/student/borrowed/${item.id}/return`,
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
        {!Array.isArray(myRequests) || myRequests.length === 0 ? (
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
  <div className="section">
    <h3 className="section-title">Pending & Return Requests</h3>
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
          {!Array.isArray(requests) || requests.length === 0 ? (
            <tr>
              <td colSpan="6">No requests found</td>
            </tr>
          ) : (
            requests.map((req) => (
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
                            `${API_BASE_URL}/staff/requests/${req.id}/approve`,
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
                            `${API_BASE_URL}/staff/requests/${req.id}/reject`,
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
                          `${API_BASE_URL}/staff/requests/${req.id}/approve-return`,
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
          )))}
        </tbody>
      </table>
    )}
  </div>
)}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Equipment</h2>
              <button className="modal-close" onClick={closeEditModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="edit-name">Equipment Name</label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditFormChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-category">Category</label>
                <select
                  id="edit-category"
                  name="category"
                  value={editFormData.category}
                  onChange={handleEditFormChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Sports Kits">Sports Kits</option>
                  <option value="Lab Equipment">Lab Equipment</option>
                  <option value="Cameras">Cameras</option>
                  <option value="Musical Instruments">Musical Instruments</option>
                  <option value="Technology">Technology</option>
                  <option value="Classroom">Classroom</option>
                  <option value="Library">Library</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-condition">Condition</label>
                  <select
                    id="edit-condition"
                    name="condition"
                    value={editFormData.condition}
                    onChange={handleEditFormChange}
                    className="form-select"
                    required
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Needs Repair">Needs Repair</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-quantity">Quantity</label>
                  <input
                    type="number"
                    id="edit-quantity"
                    name="quantity"
                    value={editFormData.quantity}
                    onChange={handleEditFormChange}
                    className="form-input"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-availability">Availability</label>
                <select
                  id="edit-availability"
                  name="availability"
                  value={editFormData.availability}
                  onChange={handleEditFormChange}
                  className="form-select"
                  required
                >
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeEditModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Update Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Product</h2>
              <button className="modal-close" onClick={closeAddModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="add-name">Product Name</label>
                <input
                  type="text"
                  id="add-name"
                  name="name"
                  value={addFormData.name}
                  onChange={handleAddFormChange}
                  className="form-input"
                  placeholder="Enter product name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="add-category">Category</label>
                <select
                  id="add-category"
                  name="category"
                  value={addFormData.category}
                  onChange={handleAddFormChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Sports Kits">Sports Kits</option>
                  <option value="Lab Equipment">Lab Equipment</option>
                  <option value="Cameras">Cameras</option>
                  <option value="Musical Instruments">Musical Instruments</option>
                  <option value="Technology">Technology</option>
                  <option value="Classroom">Classroom</option>
                  <option value="Library">Library</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="add-condition">Condition</label>
                  <select
                    id="add-condition"
                    name="condition"
                    value={addFormData.condition}
                    onChange={handleAddFormChange}
                    className="form-select"
                    required
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Needs Repair">Needs Repair</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="add-quantity">Quantity</label>
                  <input
                    type="number"
                    id="add-quantity"
                    name="quantity"
                    value={addFormData.quantity}
                    onChange={handleAddFormChange}
                    className="form-input"
                    min="1"
                    placeholder="Enter quantity"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="add-availability">Availability</label>
                <select
                  id="add-availability"
                  name="availability"
                  value={addFormData.availability}
                  onChange={handleAddFormChange}
                  className="form-select"
                  required
                >
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeAddModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentManagement;
