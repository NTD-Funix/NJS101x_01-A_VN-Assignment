const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit-table');
// const PDFTable = require('pdfkit-table');

const mongoose = require('mongoose');

const Employee = require('../models/employee');
const sortHelper = require('../util/sort');

exports.saffList = (req, res, next) => {
    const path = req.url;
    const pageTitle = path === '/confirm' ? 'Xác nhận giờ làm' : 'Thông tin Covid-19';
    Employee.find({ managerId: req.manager._id })
        .then(employees => {
            res.render('manager/staff-list', {
                path: path,
                pageTitle: pageTitle,
                employees: employees,
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getViewCovidInfo = (req, res, next) => {
    const viewId = req.params.viewId;
    Employee.findById(viewId)
        .then(employee => {
            if (!employee) {
                throw new Error('No employee found.');
            }
            if (employee.managerId.toString() !== req.manager._id.toString()) {
                throw new Error('Unauthorized');
            }
            res.render('employee/covid-info', {
                path: '/view-covid-info',
                employee: employee,
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

exports.getConfirm = (req, res, next) => {
    const employeeViewId = req.params.employeeViewId;
    const monthView = req.query.monthView;
    const confirmData = req.manager.employees.find(i => {
        return i.employeeId.toString() === employeeViewId;
    });
    let confirmMonthData;
    if (!confirmData) {
        confirmMonthData = [];
    } else {
        confirmMonthData = confirmData.monthConfirmed;
    }
    const confirmed = confirmMonthData.findIndex(i => i === monthView);
    Employee.findById(employeeViewId)
        .then(employee => {
            if (!employee) {
                throw new Error('No employee found.');
            }
            if (employee.managerId.toString() !== req.manager._id.toString()) {
                throw new Error('Unauthorized');
            }
            req.session.employee = employee;
            req.session.save();
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
            const timeWorksOfMonth = timeWorks.filter(i => {
                if (monthView) {
                    return i.dateTime.includes(monthView);
                } else {
                    return i;
                }
            })
            sortHelper.sortByDate(timeWorksOfMonth, 1);
            res.render('manager/confirm-time', {
                path: '/confirm',
                pageTitle: 'Thông tin giờ làm',
                timeWorks: timeWorksOfMonth.filter(item => item.totalTimeOfDay > 0),
                employee: employee,
                employeeViewId: employeeViewId,
                monthView: monthView,
                confirmed: confirmed,  // Cờ đã xác nhận hay chưa. Nếu =-1 là chưa xác nhận, >=0 là tháng đó đã xác nhận rồi.
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postDeleteWorkItem = (req, res, next) => {
    const employeeId = req.body.employeeId;
    const dateOfItem = req.body.dateOfItem;
    const workItemId = req.body.workItemId;
    const monthDelete = req.body.monthDelete;

    const updateEmployee = req.session.employee;
    const updateTimes = [...updateEmployee.times];
    const updateTimeItemIndex = updateTimes.findIndex(i => {
        return i.dateTime === dateOfItem;
    });
    const updateTimeItem = updateTimes[updateTimeItemIndex];
    const updateWorkingTimes = [...updateTimeItem.workingTimes];
    const deleteWorkingIndex = updateWorkingTimes.findIndex(i => {
        return i._id.toString() === workItemId;
    });
    updateWorkingTimes.splice(deleteWorkingIndex, 1);
    updateTimeItem.workingTimes = updateWorkingTimes;

    Employee.findOneAndUpdate({ _id: mongoose.Types.ObjectId(employeeId) }, { "times": updateTimes })
        .then(result => {
            res.redirect(`/confirm/view/${employeeId}?monthView=${monthDelete}`);
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postConfirmed = (req, res, next) => {
    const monthCofirmed = req.body.monthCofirmed;
    const employeeId = req.body.employeeId;
    const updateConfirmed = [...req.manager.employees]
    const updateConfirmedIndex = updateConfirmed.findIndex(item => {
        return item.employeeId.toString() === mongoose.Types.ObjectId(employeeId).toString();
    });
    if (updateConfirmedIndex < 0) {
        updateConfirmed.push({
            employeeId: employeeId,
            monthConfirmed: [monthCofirmed],
        })
    } else {
        updateConfirmed[updateConfirmedIndex].monthConfirmed.push(monthCofirmed);
    }
    req.manager.employees = updateConfirmed;
    return req.manager.save(err => {
        res.redirect(`/confirm/view/${employeeId}?monthView=${monthCofirmed}`)
    });
};

exports.getFileCovidInfo = (req, res, next) => {
    const printId = req.params.printId;
    Employee.findById(printId)
        .then(employee => {
            if (!employee) {
                throw new Error('No employee found.');
            }
            if (employee.managerId.toString() !== req.manager._id.toString()) {
                throw new Error('Unauthorized');
            }
            const covidInfoName = 'covid-info-' + printId + '.pdf';
            const covidInfoPath = path.join('data', 'covid-info', covidInfoName);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; fileName="' + covidInfoName + '"');
            const PDFDoc = new PDFDocument({ margin: 30, size: 'A4' });
            PDFDoc.pipe(fs.createWriteStream(covidInfoPath))
            PDFDoc.pipe(res);
            PDFDoc
                .fontSize(26)
                .text('Personal Covid information', {
                    align: 'center'
                })
            PDFDoc
                .text('-------------------------------------------', {
                    align: 'center'
                })
            PDFDoc
                .fontSize(14)
                .text(`Name: ${employee.name}`, {
                    align: 'center'
                })
            PDFDoc
                .text(`ID: ${employee._id}`, {
                    align: 'center'
                })
            PDFDoc
                .text('--------------------------------------------------------------------------------------',
                    {
                        align: 'center'
                    })

            // Temperatures Info Table
            const tempDatas = employee.covidInfos.temps.length > 0 ?
                employee.covidInfos.temps.map(data => data) :
                [{ tempDate: 'No Data Yet', tempValue: 'No Data Yet' }];

            const tempsTable = {
                title: "Temperature information",
                headers: [
                    {
                        label: "Registration date/time",
                        property: "tempDate",
                        align: 'center',
                        columnColor: '#5a9bfd',
                        columnOpacity: 0.5
                    },
                    {
                        label: "Temperature (Celsius)",
                        property: "tempValue",
                        align: 'center',
                        columnColor: '#8bf3c4',
                        columnOpacity: 0.5
                    }
                ],
                datas: tempDatas
            };
            PDFDoc.table(tempsTable);
            PDFDoc.text('  ');

            // Vaccination Info Table
            const vaccineDatas = employee.covidInfos.vaccines.length > 0 ?
                employee.covidInfos.vaccines.map(data => data) :
                [{
                    times: 'No Data Yet',
                    vaccineType: 'No Data Yet',
                    injectDate: 'No Data Yet'
                }];

            const vaccinesTable = {
                title: "Vaccine Information",
                headers: [
                    {
                        label: "Times",
                        property: "times",
                        align: 'center',
                        columnColor: '#5a9bfd',
                        columnOpacity: 0.5
                    },
                    {
                        label: "Vaccine Type",
                        property: "vaccineType",
                        align: 'center',
                        columnColor: '#8bf3c4',
                        columnOpacity: 0.5
                    },
                    {
                        label: "Inject Date",
                        property: "injectDate",
                        align: 'center',
                        columnColor: '#f99fa8',
                        columnOpacity: 0.5
                    }
                ],
                datas: vaccineDatas,
            };
            PDFDoc.table(vaccinesTable);
            PDFDoc.text('  ');

            // Positive Info Table
            const positiveDatas = employee.covidInfos.positives.length > 0 ?
                employee.covidInfos.positives.map(data => data) :
                [{
                    times: 'No Data Yet',
                    positiveDate: 'No Data Yet'
                }];

            const positivesTable = {
                title: "Positive information",
                headers: [
                    {
                        label: "Times",
                        property: "times",
                        align: 'center',
                        columnColor: '#5a9bfd',
                        columnOpacity: 0.5
                    },
                    {
                        label: "Positive Date",
                        property: "positiveDate",
                        align: 'center',
                        columnColor: '#8bf3c4',
                        columnOpacity: 0.5
                    }
                ],
                datas: positiveDatas
            };
            PDFDoc.table(positivesTable);
            // done!
            PDFDoc.end();
        })
        .catch(err => next(err));
}