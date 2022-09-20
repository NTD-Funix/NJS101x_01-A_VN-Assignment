const mongodb = require('mongodb'); // Import mongodb
const getDb = require('../util/database').getDb; // Import getDb

class Employee {            // Tạo class Employee
    constructor(
        id, status, name, doB,
        salaryScale, startDate, department,
        annualLeave, imageUrl,
        tempInfo, vaccinationInfo, positiveInfo,
        workingTimes, registerLeaveDatas,
        workingTime
    ) {
        this._id = id ? new mongodb.ObjectId(id) : null;
        this.status = status;
        this.name = name;
        this.doB = doB;
        this.salaryScale = salaryScale;
        this.startDate = startDate;
        this.department = department;
        this.annualLeave = annualLeave;
        this.imageUrl = imageUrl;
        this.tempInfo = tempInfo;
        this.vaccinationInfo = vaccinationInfo;
        this.positiveInfo = positiveInfo;
        this.workingTimes = workingTimes;
        this.registerLeaveDatas = registerLeaveDatas;
        this.workingTime = workingTime;
    }

    save() {                    // Phương thức save() - Lưu object employee vào database
        const db = getDb();
        let dbOp;
        if (this._id) {
            dbOp = db.collection('employees').updateOne({ _id: this._id }, { $set: this });
        } else {
            dbOp = db.collection('employees').insertOne(this);
        }
        return dbOp
            .then(result => {
                console.log(result);
            })
            .catch(err => {
                console.log(err);
            });
    };

    addTempInfo(tempInfo) {     // Phương thức thêm thông tin thân nhiệt vào database
        const db = getDb();
        const updateTempItems = [...this.tempInfo];
        updateTempItems.push(tempInfo);
        return db
            .collection('employees')
            .updateOne({ _id: this._id }, { $set: { tempInfo: updateTempItems } })
    };

    addVaccinationInfo(vaccinationInfo) {   // Phương thức thêm thông tin tiêm vaccine vào database
        const db = getDb();
        const updateVaccinationItems = [...this.vaccinationInfo];
        updateVaccinationItems.push(vaccinationInfo);
        return db
            .collection('employees')
            .updateOne({ _id: this._id }, { $set: { vaccinationInfo: updateVaccinationItems } })
    };


    addPositiveInfo(positiveInfo) {     // Phương thức thêm thông tin dương tính vào database
        const db = getDb();
        const updatePositiveItems = [...this.positiveInfo];
        updatePositiveItems.push(positiveInfo);
        return db
            .collection('employees')
            .updateOne({ _id: this._id }, { $set: { positiveInfo: updatePositiveItems } })
    };

    startWork(workInfo) {               // Phương thức thêm thông tin bắt đầu làm việc vào database
        const db = getDb();
        if (!this.workingTimes.Items) {
            this.workingTimes.Items = [];
        }
        const workingTimesItems = [...this.workingTimes.Items];
        const dateTime = workInfo.startTime.toISOString().split('T')[0];
        const itemFindIndex = workingTimesItems.findIndex(item => item.dateTime === dateTime);
        if (itemFindIndex < 0) {
            const updateWorkingTimeItem = {};
            updateWorkingTimeItem.dateTime = dateTime;
            updateWorkingTimeItem.annualLeaveRegisted = 0;
            updateWorkingTimeItem.reasonLeave = '';
            updateWorkingTimeItem.totalTimeWorking = 0;
            updateWorkingTimeItem.overTime = 0;
            updateWorkingTimeItem.lessTime = 8;
            const updateDetailsTime = [];
            updateDetailsTime.push(workInfo);
            updateWorkingTimeItem.detailsTime = updateDetailsTime;
            workingTimesItems.push(updateWorkingTimeItem);
        } else {
            const updateWorkingTimeItem = workingTimesItems[itemFindIndex];
            const updateDetailsTime = updateWorkingTimeItem.detailsTime;
            updateDetailsTime.push(workInfo);
        }
        return db
            .collection('employees')
            .updateMany({ _id: this._id }, {
                $set: {
                    status: 1,
                    workingTimes: { Items: workingTimesItems },
                    workingTime: workInfo,
                }
            });
    };

    endWork(workInfo) {     // Phương thức thêm thông tin kết thúc phiên làm việc vào database
        const db = getDb();
        const workingTimesItems = [...this.workingTimes.Items];
        const thisWorking = this.workingTime;
        const thisTimeWorking = thisWorking.startTime.toISOString().split('T')[0];
        const itemFindIndex = workingTimesItems.findIndex(item => item.dateTime === thisTimeWorking);
        const updateWorkingTimeItem = workingTimesItems[itemFindIndex];
        const updateDetailsTime = updateWorkingTimeItem.detailsTime;
        const lastTimeWorkingIndex = updateDetailsTime.length - 1;
        updateDetailsTime[lastTimeWorkingIndex] = workInfo;
        const totalTimeArr = updateDetailsTime.map((item) => {
            return item.totalTime;
        });
        const annualLeaveTimeOfDay = updateWorkingTimeItem.annualLeaveRegisted;
        let updateTotalTimeWorking = totalTimeArr.reduce((total, totalTime) => {
            return total + totalTime;
        });
        let totalTimeOfDay = updateTotalTimeWorking + annualLeaveTimeOfDay;
        let updateOverTime, updateLessTime;
        if (totalTimeOfDay - 8 > 0) {
            updateOverTime = totalTimeOfDay - 8;
            updateLessTime = 0;
        } else {
            updateOverTime = 0;
            updateLessTime = Math.abs(totalTimeOfDay - 8);
        }
        updateWorkingTimeItem.overTime = updateOverTime;
        updateWorkingTimeItem.lessTime = updateLessTime;
        updateWorkingTimeItem.totalTimeWorking = updateTotalTimeWorking;
        return db
            .collection('employees')
            .updateMany(
                { _id: this._id },
                {
                    $set: {
                        workingTime: workInfo,
                        workingTimes: { Items: workingTimesItems },
                        status: 0
                    }
                });
    };

    registerAnnualLeave(registerLeaveData) {    // Phương thức thêm thông tin đăng ký nghỉ phép vào database
        const db = getDb();
        const workingTimesItems = [...this.workingTimes.Items];
        const itemFindIndex = workingTimesItems.findIndex(item => {
            return item.dateTime === registerLeaveData.dateOff;
        });
        if (itemFindIndex >= 0) {   //
            const updateWorkingTimeItem = workingTimesItems[itemFindIndex];
            let totalTimeWorking, updateOverTime, updateLessTime;
            totalTimeWorking = updateWorkingTimeItem.totalTimeWorking;
            let updateAnnualLeaveRegisted = registerLeaveData.leaveHour;
            let totalTimeOfDay = totalTimeWorking + updateAnnualLeaveRegisted;
            if (totalTimeOfDay - 8 > 0) {
                updateOverTime = totalTimeOfDay - 8;
                updateLessTime = 0;
            } else {
                updateOverTime = 0;
                updateLessTime = 8 - totalTimeOfDay;
            };
            updateWorkingTimeItem.overTime = updateOverTime;
            updateWorkingTimeItem.lessTime = updateLessTime;
            updateWorkingTimeItem.reasonLeave = registerLeaveData.reasonOff;
            updateWorkingTimeItem.annualLeaveRegisted = updateAnnualLeaveRegisted;
        } else {
            const dateTime = registerLeaveData.dateOff;
            const annualLeaveRegisted = registerLeaveData.leaveHour;
            const reasonLeave = registerLeaveData.reasonOff;
            const totalTimeWorking = 0;
            const overTime = 0;
            const lessTime = 8 - annualLeaveRegisted;
            const detailsTime = [];
            const updateWorkingTimeItem = {
                dateTime,
                annualLeaveRegisted,
                reasonLeave,
                totalTimeWorking,
                overTime,
                lessTime,
                detailsTime
            };
            workingTimesItems.push(updateWorkingTimeItem)
        };
        const totalAnuallLeaveRegistedArr = workingTimesItems.map(item => {
            return item.annualLeaveRegisted;
        });
        const totalAnuallLeaveRegisted = totalAnuallLeaveRegistedArr.reduce((total, value) => {
            return total + value;
        });
        const annualLeave = 12 - totalAnuallLeaveRegisted / 8;
        return db
            .collection('employees')
            .updateMany({ _id: this._id },
                {
                    $set: {
                        workingTimes: { Items: workingTimesItems },
                        annualLeave: annualLeave,
                    }
                });
    };

    static findById(employeeId) {       // Phương thức tĩnh tìm nhân viên theo ID từ database
        const db = getDb();
        return db
            .collection('employees')
            .findOne({ _id: new mongodb.ObjectId(employeeId) })
            .then(employee => {
                return employee;
            })
            .catch(err => {
                console.log(err);
            });
    };

    static findByMonth(month, employeeId) {
        const db = getDb();
        // return db
        //     .collection('employees')
        //     .aggregate([
        //         { $match: { 'workingTimes.Items.dateTime': '2022-09' } },
        //         { $project: { _id: 0, workingTimes: 1 } }
        //     ])
        //     .then(result => console.log(result))
        return db
            .collection('employees')
            .findOne({ _id: new mongodb.ObjectId(employeeId) })
            .then(employee => {
                const workingTimeItems = employee.workingTimes.Items;
                const workingTimeItemsOfMonth = workingTimeItems.filter(i => {
                    if (month === '') {
                        return null;
                    }
                    return i.dateTime.includes(month);
                });
                return workingTimeItemsOfMonth;
            })

    }
}

module.exports = Employee;