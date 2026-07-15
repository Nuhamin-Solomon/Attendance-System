const express = require("express");
const router = express.Router();

const pool = require("../config/db");



router.get("/",async(req,res)=>{


try{


const result = req.user.role === "employee"
  ? await pool.query(`
SELECT employees.id, employees.full_name, employees.card_id, employees.department
FROM employees JOIN users ON users.employee_id = employees.id
WHERE users.id = $1
`, [req.user.id])
  : await pool.query(`

SELECT

id,
full_name,
card_id,
department

FROM employees

ORDER BY id

`);



res.json(result.rows);



}catch(error){


console.log(error);


res.status(500).json({

error:error.message

});


}


});



module.exports = router;
