const express = require('express'); // Import express
const { body } = require('express-validator');

const employeeController = require('../controllers/employee'); // Import controllers
const isAuthMiddleWare = require('../middleware/is-auth');

const router = express.Router(); // Gọi hàm Router() trong express

router.get('/', employeeController.getHomePage);

// Middleware xử lý yêu cầu GET đến đường dẫn '/'
router.get('/check-in-out', isAuthMiddleWare.isLoggedIn, isAuthMiddleWare.isStaff, employeeController.getIndex);

// Middleware xử lý yêu cầu GET đến đường dẫn '/checkin-form'
router.get('/checkin-form', isAuthMiddleWare.isLoggedIn, isAuthMiddleWare.isStaff, employeeController.getCheckinForm);

// Middleware xử lý yêu cầu POST đến đường dẫn '/checkin-success'
router.post('/checkin-success', isAuthMiddleWare.isLoggedIn, isAuthMiddleWare.isStaff, employeeController.postCheckin);

// Middleware xử lý yêu cầu GET đến đường dẫn '/checkin-info'
router.get('/checkin-info', isAuthMiddleWare.isLoggedIn, isAuthMiddleWare.isStaff, employeeController.getCheckinInfo);

// Middleware xử lý yêu cầu POST đến đường dẫn '/check-out'
router.post('/check-out', isAuthMiddleWare.isLoggedIn, isAuthMiddleWare.isStaff, employeeController.postCheckOut);

// Middleware xử lý yêu cầu GET đến đường dẫn '/checkout-info'
router.get('/checkout-info', isAuthMiddleWare.isLoggedIn, isAuthMiddleWare.isStaff, employeeController.getCheckOutInfo);

// Middleware xử lý yêu cầu GET đến đường dẫn '/employeeInformation'
router.get('/employeeInformation', isAuthMiddleWare.isLoggedIn, isAuthMiddleWare.isStaff, employeeController.getEmployeeInfo);

// Middleware xử lý yêu cầu GET đến đường dẫn '/edit-employee-info/:employeeId'
router.get('/edit-employee-info/:employeeId', isAuthMiddleWare.isLoggedIn, employeeController.getEditEmployeeInfo);

// Middleware xử lý yêu cầu POST đến đường dẫn '/edit-employee-info'
router.post('/edit-employee-info', isAuthMiddleWare.isLoggedIn, isAuthMiddleWare.isStaff, employeeController.postEditEmployeeInfo);

// Middleware xử lý yêu cầu GET đến đường dẫn '/workingInformation'
router.get('/workingInformation', isAuthMiddleWare.isLoggedIn, isAuthMiddleWare.isStaff, employeeController.getWorkingInfo);

router.get('/workingInformation/time-info', isAuthMiddleWare.isLoggedIn, isAuthMiddleWare.isStaff, employeeController.getTimeInfo);

router.get('/workingInformation/salary-info', isAuthMiddleWare.isLoggedIn, isAuthMiddleWare.isStaff, employeeController.getSalary);

// Middleware xử lý yêu cầu GET đến đường dẫn '/covidInformation'
router.get('/covidInformation', isAuthMiddleWare.isLoggedIn, isAuthMiddleWare.isStaff, employeeController.getCovidInfo);

// Middleware xử lý yêu cầu GET đến đường dẫn '/annualLeave'
router.get('/annualLeave', isAuthMiddleWare.isLoggedIn, isAuthMiddleWare.isStaff, employeeController.getAnnualLeave);

// Middleware xử lý yêu cầu POST đến đường dẫn '/post-register-leave'
router.post('/post-register-leave',
    [
        body('dateOff')
            .isDate()
            .withMessage('Please enter the date for the leave.'),
        body('reasonOff')
            .isEmpty()
            .withMessage('Please enter the reason for the leave.')
    ],
    isAuthMiddleWare.isLoggedIn,
    isAuthMiddleWare.isStaff,
    employeeController.postRegisterLeave);

// Middleware xử lý yêu cầu GET đến đường dẫn '/registerTemp'
router.get('/registerTemp', isAuthMiddleWare.isLoggedIn, employeeController.getTemp);

// Middleware xử lý yêu cầu POST đến đường dẫn '/post-temp'
router.post('/post-temp', isAuthMiddleWare.isLoggedIn, employeeController.postTemp);

// Middleware xử lý yêu cầu GET đến đường dẫn '/registerVaccination'
router.get('/registerVaccination', isAuthMiddleWare.isLoggedIn, employeeController.getVaccination);

// Middleware xử lý yêu cầu POST đến đường dẫn '/post-vaccination'
router.post('/post-vaccination', isAuthMiddleWare.isLoggedIn, employeeController.postVaccination);

// Middleware xử lý yêu cầu GET đến đường dẫn '/registerPositive'
router.get('/registerPositive', isAuthMiddleWare.isLoggedIn, employeeController.getPositive);

// Middleware xử lý yêu cầu POST đến đường dẫn '/post-positive'
router.post('/post-positive', isAuthMiddleWare.isLoggedIn, employeeController.postPositive);

// router.get('/caculSalary?salaryMonth=2022-09')

// Middleware xử lý yêu cầu POST đến đường dẫn '/caculSalary'.
// router.post('/caculSalary', employeeController.postCaculSalary);

module.exports = router;