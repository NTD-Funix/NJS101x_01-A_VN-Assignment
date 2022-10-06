const path = require('path');   // Import path module.
const express = require('express'); // Import express module
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const bodyParser = require('body-parser');  // Import body-parser module
const flash = require('connect-flash');
const multer = require('multer');

const employeeRoutes = require('./routes/employee'); // Import Routes
const authRoutes = require('./routes/auth');
const managerRoutes = require('./routes/manager');
const errorController = require('./controllers/error');

const Employee = require('./models/employee'); // Import Employee
const Manager = require('./models/manager');

const MONGODB_URI = 'mongodb+srv://DaiNguyen:1234567890@cluster0.nlnvzjj.mongodb.net/staff?retryWrites=true&w=majority';

// Tạo app bằng express
const app = express();

// Create Store to stored session.
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collections: 'sessions',
});
// Session

app.use(session({
    secret: 'My secret',
    resave: false,
    saveUninitialized: false,
    store: store
}));

app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.isManager = req.session.isManager;
    next();
});

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, Math.random().toString().split('.')[1] + '_' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png', file.mimetype === 'image/jpg', file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    };
};

// Sử dụng ejs template engine
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));    // Middleware Phân tích cú pháp body 
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));

app.use(express.static(path.join(__dirname, 'public'))); // Middleware Cung cấp các tệp tĩnh nằm trong public folder
app.use('/images', express.static(path.join(__dirname, 'images'))); // Middleware cung cấp các tệp tĩnh nằm trong thư mục images

app.use((req, res, next) => {
    // throw new Error('Sync Dummy')
    if (!req.session.user) {
        return next();
    } else if (!req.session.isManager) {
        Employee.findOne({ userId: req.session.user._id })
            .then(employee => {
                if (!employee) {
                    return next();
                }
                const timeWorks = employee.times.map(time => {
                    let annualLeaveOfDay;           // Thông tin nghỉ phép đã đăng ký theo ngày
                    if (!time.annualLeaveData) {
                        annualLeaveOfDay = 0;
                    } else {
                        annualLeaveOfDay = time.annualLeaveData.leaveHour
                    }
                    let totalTimeOfDay = time.workingTimes.map(workingTime => {
                        return workingTime.totalTime;
                    }).reduce((total, value) => {
                        return total + value;
                    }, 0);
                    let overTime, lessTime;
                    if (totalTimeOfDay + annualLeaveOfDay - 8 > 0) {
                        overTime = (totalTimeOfDay + annualLeaveOfDay) - 8;
                        lessTime = 0;
                    } else {
                        lessTime = 8 - (totalTimeOfDay + annualLeaveOfDay);
                        overTime = 0;
                    };
                    let workingTimes = time.workingTimes;
                    return {
                        dateTime: time.dateTime,            // Ngày làm việc.
                        workingTimes: workingTimes,    // Các phiên làm việc trong ngày.
                        totalTimeOfDay: totalTimeOfDay,     // Tổng thời gian làm việc của ngày.
                        annualLeaveOfDay: annualLeaveOfDay, // Thời gian nghỉ phép đã đăng ký.
                        overTime: overTime,                 // Thời gian làm thêm trong ngày.
                        lessTime: lessTime,                 // Thời gian làm thiếu trong ngày.
                    }
                });
                req.session.timeWorks = timeWorks;
                req.session.save();
                req.employee = employee;
                next();
            })
            .catch(err => {
                next(new Error(err));
            })
    } else {
        Manager.findOne({ userId: req.session.user._id })
            .then(manager => {
                if (!manager) {
                    return next();
                }
                req.manager = manager;
                next();
            })
            .catch(err => {
                next(new Error(err));
            })
    }
})

app.use(employeeRoutes);    // Middleware thực thi mọi yêu cầu từ employeeRoutes
app.use(managerRoutes);
app.use(authRoutes);

app.use(errorController.get404);

app.use((error, req, res, next) => {
    console.log(error)
    res.status(500).render('500', {
        pageTitle: 'Error',
        path: '/500',
    });
});


mongoose.connect(MONGODB_URI)
    .then(result => {
        app.listen(process.env.PORT || 8080, '0.0.0.0', () => {
            console.log('Server is running.')
        });
    })
    .catch(err => { console.log(err) });

