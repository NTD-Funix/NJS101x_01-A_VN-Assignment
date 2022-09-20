const path = require('path');   // Import path module.
const express = require('express'); // Import express module

const bodyParser = require('body-parser');  // Import body-parser module

const employeeRoutes = require('./routes/employee'); // Import Routes
const mongoConnect = require('./util/database').mongoConnect; // Import MongoConnect
const Employee = require('./models/employee'); // Import Employee

// Tạo app bằng express
const app = express();

// Sử dụng ejs template engine
app.set('view engine', 'ejs');
app.set('views', 'views');


app.use(bodyParser.urlencoded({ extended: false }));    // Middleware Phân tích cú pháp body 
app.use(express.static(path.join(__dirname, 'public'))); // Middleware Cung cấp các tệp tĩnh nằm trong public folder

app.use((req, res, next) => {       // Middleware lưu Employee Object vào req
    Employee.findById('62fe7d4761b232e53e3b3fc9')
        .then((employee) => {
            req.employee = new Employee(
                employee._id,
                employee.status,
                employee.name,
                employee.doB,
                employee.salaryScale,
                employee.startDate,
                employee.department,
                employee.annualLeave,
                employee.imageUrl,
                employee.tempInfo,
                employee.vaccinationInfo,
                employee.positiveInfo,
                employee.workingTimes,
                employee.registerLeaveDatas,
                employee.workingTime);
            next();
        })
        .catch(err => {
            console.log(err);
        })
});

app.use(employeeRoutes);    // Middleware thực thi mọi yêu cầu từ employeeRoutes

mongoConnect(() => {        // Kết nối server với MongoDB và lắng nghe 3001 port
    app.listen(3001);
});

