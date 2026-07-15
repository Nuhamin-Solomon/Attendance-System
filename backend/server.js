const express = require("express");
const cors = require("cors");
require("dotenv").config();


const employeeRoutes = require("./src/routes/employee.routes");
const attendanceRoutes = require("./src/routes/attendance.routes");
const syncRoutes = require("./src/routes/sync.routes");
const biotimeRoutes = require("./src/routes/biotime.routes");
const authRoutes = require("./src/routes/auth.routes");
const usersRoutes = require("./src/routes/users.routes");
const { requireAuth, allowRoles } = require("./src/middleware/auth");
const { ensureUsersTable } = require("./src/services/userSetup");


const app = express();


app.use(cors());
app.use(express.json());

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required. Add it to backend/.env before starting the server.");
}

app.use("/api/auth", authRoutes);
app.use(requireAuth);


// APIs

app.use("/api/employees", employeeRoutes);

app.use("/api/attendance", attendanceRoutes);

app.use("/api/sync", allowRoles("super_admin", "admin"), syncRoutes);

app.use("/api/users", usersRoutes);

app.use("/api/biotime", biotimeRoutes);



app.get("/",(req,res)=>{

    res.json({
        success:true,
        message:"Attendance Backend Running"
    });

});



const PORT = process.env.PORT || 5000;


ensureUsersTable().then(() => app.listen(PORT,()=>{

    console.log(
        `Server running on port ${PORT}`
    );

})).catch((error) => {
    console.error("Unable to prepare the users table:", error.message);
    process.exit(1);
});
