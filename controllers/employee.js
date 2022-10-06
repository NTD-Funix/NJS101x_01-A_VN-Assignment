const Employee = require('../models/employee');

const fileHelper = require('../util/file');
const sortHelper = require('../util/sort');

exports.getHomePage = (req, res, next) => {     // Lấy thông tin trang chủ.
    res.render('homepage/homepage', {
        path: '/',
        pageTitle: 'Trang chủ'
    })
}

exports.getIndex = (req, res, next) => {
    const status = req.session.status;
    Employee.findById(req.employee._id)
        .then(employee => {
            res.render('employee/index', {
                path: '/check-in-out',
                status: status,
                employee: employee,
                pageTitle: 'Điểm danh'
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
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
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postCheckin = (req, res, next) => {         // Post thông tin checkin
    const workPlace = req.body.workPlace;           // Lấy thông tin nơi làm việc người dùng nhập từ form checkin
    const startTimeUTC = new Date(2022, 10, 04, 08, 00, 00);    // Giả lập thời gian checkin (Giờ UTC)
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
    req.employee
        .populate('managerId')
        .then(employee => {
            let monthsConfirmed;
            const emp = employee.managerId.employees.find(emp => {
                return emp.employeeId.toString() === employee._id.toString();
            })
            if (!emp) {
                monthsConfirmed = [];
            } else {
                monthsConfirmed = emp.monthConfirmed;
            }
            return monthsConfirmed;
        })
        .then(monthsConfirmed => {
            const monthOfWorking = startTime.toISOString().split('T')[0].slice(0, 7);
            const confirmed = monthsConfirmed.findIndex(monthConfirmed => monthConfirmed === monthOfWorking);
            if (confirmed >= 0) {
                req.session.monthOfWorking = monthOfWorking;
                req.session.workingInfo = null;
                req.session.status = 0;
            } else {
                req.session.workingInfo = { workPlace, startTime, endTime, totalTime };
                req.session.status = 1;
            }
            return req.session.save((err) => {
                res.redirect('/checkin-info');
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCheckinInfo = (req, res, next) => {      // Lấy thông tin điểm danh phiên làm việc.
    const workingInfo = req.session.workingInfo;
    const status = req.session.status;
    const monthOfWorking = req.session.monthOfWorking;
    Employee.findById(req.employee._id)
        .then(employee => {
            res.render('employee/checkin-info', {
                path: '',
                workingInfo: workingInfo,
                status: status,
                employee: employee,
                pageTitle: 'Thông tin điểm danh',
                monthOfWorking: monthOfWorking,
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postCheckOut = (req, res, next) => {       // Post thông tin kết thúc phiên làm việc
    const workingInfo = req.session.workingInfo;   // 
    const endTimeUTC = new Date(2022, 10, 04, 12, 00, 00); // Giả lập thời gian kết thúc (Thời gian UTC)
    // const endTimeUTC = new Date();       // Thời gian kết thúc lấy từ server (Thời gian UTC)
    workingInfo.endTime = new Date(         // Thời gian kết thúc phiên làm việc
        endTimeUTC.getFullYear(),
        endTimeUTC.getMonth(),
        endTimeUTC.getDate(),
        endTimeUTC.getHours() + 7,
        endTimeUTC.getMinutes(),
        endTimeUTC.getSeconds());
    workingInfo.totalTime = (workingInfo.endTime.getTime() - workingInfo.startTime.getTime()) / 3600000; // Tính số giờ làm việc của phiên.
    req.session.workingInfo = workingInfo;
    req.session.status = 0;
    req.session.save();
    Employee.findById(req.employee._id)
        .then((employee) => {
            return employee.addWorkingTime(workingInfo);       // Truyền thông tin phiên làm việc khi kết thúc vào phương thức endWork trong models.
        })
        .then(() => {
            return res.redirect('/checkout-info')
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCheckOutInfo = (req, res, next) => {     // Lấy thông tin các phiên làm việc trong ngày.
    Employee.findById(req.employee._id)
        .then(employee => {
            const todayWorkingIndex = employee.times.findIndex(item => {
                return item.dateTime === req.session.workingInfo.startTime.toISOString().split('T')[0];
            });   // Tìm index của ngày làm việc hiện tại.
            const todayWorkingInfo = employee.times[todayWorkingIndex]; // Thông tin làm việc trong ngày.
            const totalTimeArr = todayWorkingInfo.workingTimes.map(item => {
                return item.totalTime;
            });
            const totalTimeOfDay = totalTimeArr.reduce((total, value) => {
                return total + value;
            });
            const status = req.session.status;
            res.render('employee/checkout-info', {
                path: '',
                totalTimeOfDay: totalTimeOfDay,
                status: status,
                employee: employee,
                todayWorkingInfo: todayWorkingInfo,
                pageTitle: 'Thông tin phiên làm việc'
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

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
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
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
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postEditEmployeeInfo = (req, res, next) => {       // Post thông tin cá nhân đã chỉnh sửa
    const image = req.file;                                // Lấy file ra từ form.

    Employee.findById(req.employee._id)
        .then((employee) => {
            if (image) {
                if (employee.imageUrl !== '') {
                    fileHelper.deleteFile(employee.imageUrl);
                }
                imageUrl = image.path;
            }
            return employee.changeEmployeeInfo(imageUrl);   // Gọi phương thức save().
        })
        .then(() => {
            console.log('EMPLOYEE UPDATED!');
            return res.redirect('/employeeInformation')
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getWorkingInfo = (req, res, next) => {     // Lấy thông tin giờ làm việc
    req.employee
        .populate('managerId')
        .then((employee) => {
            return res.render('employee/working-info', {
                path: '/workingInformation',
                pageTitle: 'Tra cứu thông tin giờ làm và lương tháng',
                employee: employee,
            })
        })
        .catch(err => {
            return next(err);
        })
};

exports.getTimeInfo = (req, res, next) => {

    const sortValue = +req.query.sortValue || 1;
    const pagination = +req.query.pagination || 10;
    const timeWorks = req.session.timeWorks;

    let workingInfo;        // Thông tin lần làm việc cuối cùng khi chưa kết thúc.
    if (req.session.status === 1) {
        workingInfo = req.session.workingInfo;
    };
    Employee.findById(req.employee._id)
        .then((employee) => {
            if (workingInfo) {
                const dateTime = workingInfo.startTime.toISOString().split('T')[0];
                const workingItemIndex = timeWorks.findIndex(item => {
                    return item.dateTime === dateTime;
                })
                if (workingItemIndex >= 0) {
                    timeWorks[workingItemIndex].totalTimeOfDay = '--';
                    timeWorks[workingItemIndex].overTime = '--';
                    timeWorks[workingItemIndex].lessTime = '--';
                    timeWorks[workingItemIndex].workingTimes.push(workingInfo);
                } else {
                    timeWorks.push({
                        dateTime: dateTime,
                        totalTimeOfDay: '--',
                        annualLeaveOfDay: 0,
                        overTime: '--',
                        lessTime: '--',
                        workingTimes: workingInfo,
                    })
                }
            };
            sortHelper.sortByDate(timeWorks, sortValue);
            const totalItems = timeWorks.length;
            const ITEMS_PER_PAGE = pagination;
            const page = +req.query.page || 1;
            const ITEMS_SKIP = (page - 1) * ITEMS_PER_PAGE;
            const timesPerPage = timeWorks.slice(ITEMS_SKIP, ITEMS_SKIP + ITEMS_PER_PAGE);
            return res.render('employee/working-time-info', {
                path: '/workingInformation/working-time',
                employee: employee,
                timeWorks: timesPerPage,
                pageTitle: 'Thông tin giờ làm',
                sortValue: sortValue,
                pagination: pagination,
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getSalary = (req, res, next) => {
    const timeWorks = req.session.timeWorks;
    const salaryMonth = req.query.salaryMonth;
    let workingTimeItemsOfMonth;
    let totalOverTimeOfMonth = 0;
    let totalLessTimeOfMonth = 0
    if (!salaryMonth) {
        workingTimeItemsOfMonth = null;
    } else {
        workingTimeItemsOfMonth = timeWorks.filter(i => {
            return i.dateTime.includes(salaryMonth);
        });
        workingTimeItemsOfMonth.forEach(item => {
            totalOverTimeOfMonth += item.overTime;
            totalLessTimeOfMonth += item.lessTime;
        })
    };
    Employee.findById(req.employee._id)
        .then(employee => {
            if (!employee) {
                throw new Error('Employee Not Found.')
            }
            const salary = employee.salaryScale * 3000000 + (totalOverTimeOfMonth - totalLessTimeOfMonth) * 200000;
            return res.render('employee/salary-info', {
                path: '/workingInformation/salary-info',
                pageTitle: 'Thông tin lương tháng',
                employee: employee,
                salaryMonth: salaryMonth,
                workingTimeItemsOfMonth: workingTimeItemsOfMonth,
                totalOverTimeOfMonth: totalOverTimeOfMonth,
                totalLessTimeOfMonth: totalLessTimeOfMonth,
                salary: salary,
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        });
};

exports.postCaculSalary = (req, res, next) => {
    let findMonth = req.body.salaryMonth;
    const employeeId = req.employee._id;
    Employee.findByMonth(findMonth, employeeId)
        .then((result) => {
            console.log(result)
            res.redirect('/salaryInformation')
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getAnnualLeave = (req, res, next) => {      // Lấy form đăng ký nghỉ phép
    Employee.findById(req.employee._id)
        .then(employee => {
            res.render('employee/annualLeave', {
                path: '',
                employee: employee,
                pageTitle: 'Đăng ký nghỉ phép',
                monthOfRegistering: req.session.monthOfRegistering,
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postRegisterLeave = (req, res, next) => {   // Post thông tin nghỉ phép
    const dateOff = req.body.dateOff;               // Ngày nghỉ phép người dùng nhập lấy từ form đăng ký nghỉ phép.
    const reasonOff = req.body.reasonOff;           // Lý do nghỉ phép người dùng nhập lấy từ form đăng ký nghỉ phép.
    const leaveHour = parseInt(req.body.leaveHour, 10); // Số giờ nghỉ phép người dùng nhập lấy từ form đăng ký nghỉ phép.
    const registerLeaveData = { dateOff, reasonOff, leaveHour }; // Object thông tin nghỉ phép.
    req.employee
        .populate('managerId')
        .then(employee => {
            let monthsConfirmed;
            const emp = employee.managerId.employees.find(emp => {
                return emp.employeeId.toString() === employee._id.toString();
            })
            if (!emp) {
                monthsConfirmed = [];
            } else {
                monthsConfirmed = emp.monthConfirmed;
            }
            return monthsConfirmed;
        })
        .then(monthsConfirmed => {
            const monthOfRegistering = dateOff.slice(0, 7);
            const confirmed = monthsConfirmed.findIndex(monthConfirmed => monthConfirmed === monthOfRegistering);
            console.log(confirmed)
            if (confirmed >= 0) {
                req.session.monthOfRegistering = monthOfRegistering;
                return req.session.save(err => {
                    res.redirect('/annualLeave');
                });
            } else {
                req.session.monthOfRegistering = null;
                return req.session.save(err => {
                    Employee.findById(req.employee._id)
                        .then((employee) => {
                            return employee.addannualLeaveData(registerLeaveData); // Gọi phương thức registerAnnualLeave với object thông tin nghỉ phép được truyền vào
                        })
                        .then(() => {
                            res.redirect('/')
                        })
                        .catch(err => {
                            const error = new Error(err);
                            error.httpStatusCode = 500;
                            return next(error);
                        });
                });
            }
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCovidInfo = (req, res, next) => {    // Layer thông tin covid cá nhân
    Employee.findById(req.employee._id)
        .then((employee) => {
            res.render('employee/covid-info', {
                path: '/covidInformation',
                temps: employee.covidInfos.temps,
                vaccinations: employee.covidInfos.vaccines,
                positives: employee.covidInfos.positives,
                pageTitle: 'Thông tin covid',
                isManager: req.session.isManager,
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

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
        .then((employee) => {
            return employee.addTempInfo(temp);  // Gọi phương thức addTempInfo với object thông tin thân nhiệt được truyền vào.
        })
        .then(() => {
            res.redirect('/covidInformation');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
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
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postVaccination = (req, res, next) => { // Post thông tin đăng ký vaccine
    Employee.findById(req.employee._id)
        .then((employee) => {
            let times = employee.covidInfos.vaccines.length + 1; // Lần tiêm.
            let vaccineType = req.body.vaccineType; // Lấy thông tin loại vaccine từ form đăng ký thông tin tiêm vaccine người dùng nhập.
            let injectDate = req.body.injectDate; // Lấy thông ngày tiêm vaccine từ form đăng ký thông tin tiêm vaccine người dùng nhập.
            let vaccinationInfo = { times, vaccineType, injectDate }; // Object thông tin tiêm vaccine
            return employee.addVaccinationInfo(vaccinationInfo); // Gọi phương thức addVaccinationInfo(vaccinationInfo)
        })
        .then(() => {
            res.redirect('/covidInformation');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
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
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postPositive = (req, res, next) => {    // Post thông tin dương tính.
    Employee.findById(req.employee._id)
        .then((employee) => {
            let times = employee.covidInfos.positives.length + 1;   // Lần dương tính
            let positiveDate = req.body.positiveDate;   // Lấy thông tin ngày dương tính từ form đăng ký thông tin dương tính
            let positiveInfo = { times, positiveDate }; // Object thông tin dương tính.
            return employee.addPositiveInfo(positiveInfo);  // Gọi phương thức addPositiveInfo(positiveInfo)
        })
        .then(() => {
            res.redirect('/covidInformation')
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};