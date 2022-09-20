const express = require('express'); // Import express

const employeeController = require('../controllers/employee'); // Import controllers

const router = express.Router(); // Gọi hàm Router() trong express

// Middleware xử lý yêu cầu GET đến đường dẫn '/'
router.get('/', employeeController.getIndex);

// Middleware xử lý yêu cầu GET đến đường dẫn '/checkin-form'
router.get('/checkin-form', employeeController.getCheckinForm);

// Middleware xử lý yêu cầu POST đến đường dẫn '/checkin-success'
router.post('/checkin-success', employeeController.postCheckin);

// Middleware xử lý yêu cầu GET đến đường dẫn '/checkin-info'
router.get('/checkin-info', employeeController.getCheckinInfo);

// Middleware xử lý yêu cầu POST đến đường dẫn '/check-out'
router.post('/check-out', employeeController.postCheckOut);

// Middleware xử lý yêu cầu GET đến đường dẫn '/checkout-info'
router.get('/checkout-info', employeeController.getCheckOutInfo);

// Middleware xử lý yêu cầu GET đến đường dẫn '/employeeInformation'
router.get('/employeeInformation', employeeController.getEmployeeInfo);

// Middleware xử lý yêu cầu GET đến đường dẫn '/edit-employee-info/:employeeId'
router.get('/edit-employee-info/:employeeId', employeeController.getEditEmployeeInfo);

// Middleware xử lý yêu cầu POST đến đường dẫn '/edit-employee-info'
router.post('/edit-employee-info', employeeController.postEditEmployeeInfo);

// Middleware xử lý yêu cầu GET đến đường dẫn '/workingInformation'
router.get('/workingInformation', employeeController.getWorkingInfo);

// Middleware xử lý yêu cầu GET đến đường dẫn '/covidInformation'
router.get('/covidInformation', employeeController.getCovidInfo);

// Middleware xử lý yêu cầu GET đến đường dẫn '/annualLeave'
router.get('/annualLeave', employeeController.getAnnualLeave);

// Middleware xử lý yêu cầu POST đến đường dẫn '/post-register-leave'
router.post('/post-register-leave', employeeController.postRegisterLeave);

// Middleware xử lý yêu cầu GET đến đường dẫn '/registerTemp'
router.get('/registerTemp', employeeController.getTemp);

// Middleware xử lý yêu cầu POST đến đường dẫn '/post-temp'
router.post('/post-temp', employeeController.postTemp);

// Middleware xử lý yêu cầu GET đến đường dẫn '/registerVaccination'
router.get('/registerVaccination', employeeController.getVaccination);

// Middleware xử lý yêu cầu POST đến đường dẫn '/post-vaccination'
router.post('/post-vaccination', employeeController.postVaccination);

// Middleware xử lý yêu cầu GET đến đường dẫn '/registerPositive'
router.get('/registerPositive', employeeController.getPositive);

// Middleware xử lý yêu cầu POST đến đường dẫn '/post-positive'
router.post('/post-positive', employeeController.postPositive);

// router.get('/caculSalary?salaryMonth=2022-09')

// Middleware xử lý yêu cầu POST đến đường dẫn '/caculSalary'.
// router.post('/caculSalary', employeeController.postCaculSalary);

module.exports = router;