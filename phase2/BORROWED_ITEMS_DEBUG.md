# 🔍 BORROWED ITEMS DEBUG GUIDE

## 🚨 **Issue**: "Failed to fetch borrowed items" but other data works

## 📋 **DEBUGGING STEPS:**

### **Step 1: Manual Backend Test**

Open a new PowerShell terminal and test the endpoint directly:

```powershell
# Test if endpoint exists (should return 401 without token)
curl http://localhost:5000/admin/lent-items
```

### **Step 2: Check Database Records**

Connect to your database and run:

```sql
-- Check what's in borrow_requests table
SELECT * FROM borrow_requests;

-- Check the specific query our endpoint uses
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
WHERE br.status IN ('Approved', 'Return Requested')
ORDER BY br.requested_at DESC;
```

### **Step 3: Check User Role**

Make sure you're logged in as an **admin** user. The endpoint requires admin role.

### **Step 4: Test with All Records**

I added a debug endpoint. When you login, check the browser console for:
- "Fetching borrowed items for admin user"
- "Debug - ALL requests:" (this will show all borrow_requests regardless of status)

### **Step 5: Fix Based on Results**

#### **If database shows records but endpoint returns empty:**
- The JOIN might be failing (missing foreign key relationships)
- Status filter might be too restrictive

#### **If you see 401/403 errors:**
- User is not admin
- Token authentication failing

#### **If you see 500 errors:**
- Database connection or SQL syntax issues

## 🔧 **QUICK FIXES TO TRY:**

### **Fix 1: Remove Status Filter (Temporary)**

Change the backend query to show ALL records:

```javascript
// Remove the WHERE clause temporarily
WHERE br.status IN ('Approved', 'Return Requested')
// becomes: (remove this line entirely)
```

### **Fix 2: Check Foreign Keys**

Make sure your borrow_requests table has proper foreign key references:
- `student_id` references `users.id`
- `equipment_id` references `equipment.id`

### **Fix 3: Simple Test Query**

Try this simpler query first:

```sql
SELECT * FROM borrow_requests LIMIT 10;
```

## 📱 **MANUAL TESTING:**

1. **Start Backend**: `node "C:\Users\levono\OneDrive\Desktop\School_Managment\phase2\backend\index.js"`

2. **Open Frontend**: Go to `http://localhost:3000`

3. **Login as Admin**: Use an admin account

4. **Check Console**: Open browser dev tools and look for debug messages

5. **Report Results**: Check what errors/data you see in console

## 🎯 **EXPECTED DEBUG OUTPUT:**

If working correctly, you should see in console:
```
Fetching borrowed items for admin user
API URL: http://localhost:5000/admin/lent-items
Config: {headers: {Authorization: "Bearer ...", ngrok-skip-browser-warning: "true"}}
Borrowed items response: [array of items]
Debug - ALL requests: [array of all requests]
```

Let me know what you see in the browser console and I'll provide the exact fix!