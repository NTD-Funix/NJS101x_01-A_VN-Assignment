const Employee = require('../models/employee');

// 
exports.getIndex = (req, res, next) => {            // Lấy thông tin trang chủ.
    Employee.findById(req.employee._id)
        .then(employee => {
            res.render('employee/index', {
                path: '/',
                employee: employee,
                pageTitle: 'Điểm danh'
            });
        })
};

exports.getCheckinForm = (req, res, next) => {      // Lấy form điền thông tin điểm danh
    Employee.findById(req.employee._id)
        .then((employee) => {
            res.render('employee/checkin-form', {
                path: '',
                employee: employee,
                pageTitle: 'Điểm danh'
            });
        })
};

exports.postCheckin = (req, res, next) => {         // Post thông tin checkin
    const workPlace = req.body.workPlace;           // Lấy thông tin nơi làm việc người dùng nhập từ form checkin
    const startTimeUTC = new Date(2022, 08, 08, 08, 00, 00);    // Giả lập thời gian checkin (Giờ UTC)
    // const startTimeUTC = new Date();             // Thời gian checkin theo giờ hiện tại (Giờ UTC lấy từ server)
    const startTime = new Date(                     // Thời gian bắt đầu làm việc
        startTimeUTC.getFullYear(),
        startTimeUTC.getMonth(),
        startTimeUTC.getDate(),
        startTimeUTC.getHours() + 7,
        startTimeUTC.getMinutes(),
        startTimeUTC.getSeconds());
    const endTime = '--';                          // Thời gian kết thúc phiên làm việc (khi chưa kết thúc là '--')
    const totalTime = 0;
    const workingTime = { workPlace, startTime, endTime, totalTime }; // Object thông tin phiên làm việc
    Employee.findById(req.employee._id)
        .then(() => {
            return req.employee.startWork(workingTime)  // Truyền thông tin phiên làm việc vào phương thức startWork trong models
        })
        .then(() => {
            res.redirect('/checkin-info');
        })
        .catch((err) => {
            console.log(err);
        })
};

exports.getCheckinInfo = (req, res, next) => {      // Lấy thông tin điểm danh phiên làm việc.
    Employee.findById(req.employee._id)
        .then(employee => {
            res.render('employee/checkin-info', {
                path: '',
                employee: employee,
                pageTitle: 'Thông tin điểm danh'
            })
        })
}

exports.postCheckOut = (req, res, next) => {       // Post thông tin kết thúc phiên làm việc
    const workingTime = req.employee.workingTime;   // 
    const endTimeUTC = new Date(2022, 08, 08, 11, 00, 00); // Giả lập thời gian kết thúc (Thời gian UTC)
    // const endTimeUTC = new Date();       // Thời gian kết thúc lấy từ server (Thời gian UTC)
    workingTime.endTime = new Date(         // Thời gian kết thúc phiên làm việc
        endTimeUTC.getFullYear(),
        endTimeUTC.getMonth(),
        endTimeUTC.getDate(),
        endTimeUTC.getHours() + 7,
        endTimeUTC.getMinutes(),
        endTimeUTC.getSeconds());
    workingTime.totalTime = (workingTime.endTime.getTime() - workingTime.startTime.getTime()) / 3600000; // Tính số giờ làm việc của phiên.
    Employee.findById(req.employee._id)
        .then(() => {
            return req.employee.endWork(workingTime);       // Truyền thông tin phiên làm việc khi kết thúc vào phương thức endWork trong models.
        })
        .then(() => {
            res.redirect('/checkout-info')
        })
        .catch(err => {
            console.log(err);
        })
};

exports.getCheckOutInfo = (req, res, next) => {     // Lấy thông tin các phiên làm việc trong ngày.
    Employee.findById(req.employee._id)
        .then(employee => {
            const todayWorkingIndex = employee.workingTimes.Items.findIndex(item => {
                return item.dateTime === employee.workingTime.startTime.toISOString().split('T')[0];
            });   // Tìm index của ngày làm việc hiện tại.
            const todayWorkingInfo = employee.workingTimes.Items[todayWorkingIndex]; // Thông tin làm việc trong ngày.
            res.render('employee/checkout-info', {
                path: '',
                employee: employee,
                todayWorkingInfo: todayWorkingInfo,
                pageTitle: 'Thông tin phiên làm việc'
            })
        })
}

exports.getEmployeeInfo = (req, res, next) => {     // Lấy thông tin cá nhân của nhân viên
    Employee.findById(req.employee._id)
        .then(employee => {
            res.render('employee/employee-info', {
                path: '/employeeInformation',
                employee: employee,
                pageTitle: 'Thông tin nhân viên'
            });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.getEditEmployeeInfo = (req, res, next) => {     // Lấy form chỉnh sửa thông tin cá nhân.
    employeeId = req.params.employeeId;                 // ID nhân viên cần chỉnh sửa
    Employee.findById(employeeId)
        .then(employee => {
            if (!employee) {
                return res.redirect('/');
            }
            res.render('employee/edit-employee-info', {
                employee: employee,
                path: '',
                pageTitle: 'Chỉnh sửa thông tin cá nhân'
            });
        });
};

exports.postEditEmployeeInfo = (req, res, next) => {       // Post thông tin cá nhân đã chỉnh sửa

    Employee.findById(req.employee._id)
        .then((employee) => {
            return employeeUpdate = new Employee(   // Sử dụng class Employee để tạo 1 object employee với thông tin đã được cập nhật.
                employee._id,
                employee.status,
                employee.name,
                employee.doB,
                employee.salaryScale,
                employee.startDate,
                employee.department,
                employee.annualLeave,
                req.body.imageUrl,
                employee.tempInfo,
                employee.vaccinationInfo,
                employee.positiveInfo,
                employee.workingTimes,
                employee.registerLeaveDatas,
                employee.workingTime
            )
        })
        .then((employeeUpdate) => {
            return employeeUpdate.save();   // Gọi phương thức save().
        })
        .then(() => {
            console.log('EMPLOYEE UPDATED!');
            res.redirect('/employeeInformation')
        })
};

exports.getWorkingInfo = (req, res, next) => {     // Lấy thông tin giờ làm việc
    const salaryMonth = req.query.salaryMonth;
    Employee.findById(req.employee._id)
        .then((employee) => {
            let workingTimeItemsOfMonth;
            let totalOverTimeOfMonth = 0;
            let totalLessTimeOfMonth = 0
            if (!salaryMonth) {
                workingTimeItemsOfMonth = null;
            } else {
                const workingTimeItems = employee.workingTimes.Items;
                workingTimeItemsOfMonth = workingTimeItems.filter(i => {
                    return i.dateTime.includes(salaryMonth);
                });
                workingTimeItemsOfMonth.forEach(item => {
                    totalOverTimeOfMonth += item.overTime;
                    totalLessTimeOfMonth += item.lessTime;
                })
            }
            const salary = employee.salaryScale * 3000000 + (totalOverTimeOfMonth - totalLessTimeOfMonth) * 200000;
            res.render('employee/working-info', {
                path: '/workingInformation',
                employee: employee,
                workingTimeItemsOfMonth: workingTimeItemsOfMonth,
                totalOverTimeOfMonth,
                totalLessTimeOfMonth,
                salaryMonth: salaryMonth,
                salary: salary,
                pageTitle: 'Thông tin giờ làm'
            });
        })
};

exports.getCovidInfo = (req, res, next) => {    // Layer thông tin covid cá nhân
    Employee.findById(req.employee._id)
        .then((employee) => {
            res.render('employee/covid-info', {
                path: '/covidInformation',
                temps: employee.tempInfo,
                vaccinations: employee.vaccinationInfo,
                positives: employee.positiveInfo,
                pageTitle: 'Thông tin covid'
            });
        })
};

exports.getAnnualLeave = (req, res, next) => {      // Lấy form đăng ký nghỉ phép
    Employee.findById(req.employee._id)
        .then(employee => {
            res.render('employee/annualLeave', {
                path: '',
                employee: employee,
                pageTitle: 'Đăng ký nghỉ phép'
            });
        })
};

exports.postRegisterLeave = (req, res, next) => {   // Post thông tin nghỉ phép
    const dateOff = req.body.dateOff;               // Ngày nghỉ phép người dùng nhập lấy từ form đăng ký nghỉ phép.
    const reasonOff = req.body.reasonOff;           // Lý do nghỉ phép người dùng nhập lấy từ form đăng ký nghỉ phép.
    const leaveHour = parseInt(req.body.leaveHour, 10); // Số giờ nghỉ phép người dùng nhập lấy từ form đăng ký nghỉ phép.
    const registerLeaveData = { dateOff, reasonOff, leaveHour }; // Object thông tin nghỉ phép.
    Employee.findById(req.employee._id)
        .then(() => {
            return req.employee.registerAnnualLeave(registerLeaveData); // Gọi phương thức registerAnnualLeave với object thông tin nghỉ phép được truyền vào
        })
        .then(() => {
            res.redirect('/')
        })
        .catch(err => {
            console.log(err);
        })
}

exports.getTemp = (req, res, next) => {     // Lấy form điền thông tin đăng ký thân nhiệt.
    res.render('employee/temp-form', {
        path: '',
        pageTitle: 'Thông tin thân nhiệt'
    });
};

exports.postTemp = (req, res, next) => {    // Post thông tin đăng ký thân nhiệt.
    let fullTime = new Date();              // Thời gian đăng ký thân nhiệt đầy đủ lấy từ server (2022-09-08T07:22:42.237Z)
    let tempDate = fullTime.getFullYear() + '-' // Ngày giờ đăng ký thân nhiệt lấy từ server (2022-09-08 / 07:22:42)
        + (fullTime.getMonth() + 1) + '-'
        + fullTime.getDate() + ' / '
        + fullTime.getHours() + ':'
        + fullTime.getMinutes() + ':'
        + fullTime.getSeconds();
    let tempValue = req.body.tempValue; // Thông tin nhiệt độ lấy từ form đăng ký thân nhiệt người dùng nhập
    let temp = { tempDate, tempValue }; // Object thông tin thân nhiệt
    Employee.findById(req.employee._id)
        .then(() => {
            return req.employee.addTempInfo(temp);  // Gọi phương thức addTempInfo với object thông tin thân nhiệt được truyền vào.
        })
        .then(() => {
            res.redirect('/covidInformation');
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.getVaccination = (req, res, next) => {  // Lấy form đăng ký thông tin tiêm Vaccine
    Employee.findById(req.employee._id)
        .then((employee) => {
            res.render('employee/vaccination-form', {
                path: '',
                employee: employee,
                pageTitle: 'Thông tin vaccine'
            });
        })
};

exports.postVaccination = (req, res, next) => { // Post thông tin đăng ký vaccine
    Employee.findById(req.employee._id)
        .then((employee) => {
            let vaccinationTimes = employee.vaccinationInfo.length + 1; // Lần tiêm.
            let vaccineType = req.body.vaccineType; // Lấy thông tin loại vaccine từ form đăng ký thông tin tiêm vaccine người dùng nhập.
            let vaccinationDate = req.body.vaccinationDate; // Lấy thông ngày tiêm vaccine từ form đăng ký thông tin tiêm vaccine người dùng nhập.
            let vaccinationInfo = { vaccinationTimes, vaccineType, vaccinationDate }; // Object thông tin tiêm vaccine
            return req.employee.addVaccinationInfo(vaccinationInfo); // Gọi phương thức addVaccinationInfo(vaccinationInfo)
        })
        .then(() => {
            res.redirect('/covidInformation');
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.getPositive = (req, res, next) => { // Lấy form đăng ký thông tin dương tính
    Employee.findById(req.employee._id)
        .then((employee) => {
            res.render('employee/covid-positive-form', {
                path: '',
                employee: employee,
                pageTitle: 'Thông tin dương tính'
            });
        })
};

exports.postPositive = (req, res, next) => {    // Post thông tin dương tính.
    Employee.findById(req.employee._id)
        .then((employee) => {
            let positiveTimes = employee.positiveInfo.length + 1;   // Lần dương tính
            let positiveDate = req.body.positiveDate;   // Lấy thông tin ngày dương tính từ form đăng ký thông tin dương tính
            let positiveInfo = { positiveTimes, positiveDate }; // Object thông tin dương tính.
            return req.employee.addPositiveInfo(positiveInfo);  // Gọi phương thức addPositiveInfo(positiveInfo)
        })
        .then(() => {
            res.redirect('/covidInformation')
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.getSalaryInfo = (req, res, next) => {      //

}

exports.postCaculSalary = (req, res, next) => {
    let findMonth = req.body.salaryMonth;
    const employeeId = req.employee._id;
    Employee.findByMonth(findMonth, employeeId)
        .then((result) => {
            console.log(result)
            res.redirect('/salaryInformation')
        })
}