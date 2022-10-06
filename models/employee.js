const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const employeeSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'Manager', required: true },
    name: {
        type: String,
        required: true,
    },
    doB: {
        type: String,
        required: true,
    },
    salaryScale: {
        type: Number,
        required: true,
    },
    startDate: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    annualLeave: {
        type: Number,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    times: [{
        dateTime: { type: String, required: true },
        annualLeaveData: { type: Object },
        workingTimes: [{
            workPlace: { type: String, required: true },
            startTime: { type: Date, required: true },
            endTime: { type: Date, required: true },
            totalTime: { type: Number, required: true },
        }]
    }],
    covidInfos: {
        temps: [{
            tempDate: { type: String, required: true },
            tempValue: { type: String, required: true }
        }],
        vaccines: [{
            times: { type: Number, required: true },
            vaccineType: { type: String, required: true },
            injectDate: { type: String, required: true }
        }],
        positives: [{
            times: { type: Number, required: true },
            positiveDate: { type: String, required: true },
        }]
    },
    monthsConfirmed: { type: Array },
});

employeeSchema.methods.addWorkingTime = function (workingInfo) {
    const dateTime = workingInfo.startTime.toISOString().split('T')[0];
    const timeDateIndex = this.times.findIndex(td => {
        return td.dateTime === dateTime;
    });
    if (!this.times.workingTimes) {
        this.times.workingTimes = [];
    }
    const updateTimes = [...this.times];
    if (timeDateIndex < 0) {
        updateTimes.push({
            dateTime: dateTime,
            annualLeaveData: { reasonOff: '', leaveHour: 0 },
            workingTimes: [workingInfo]
        });
    } else {
        updateTimes[timeDateIndex].workingTimes.push(workingInfo);
    }
    this.times = updateTimes;
    return this.save();
};

employeeSchema.methods.addannualLeaveData = function (registerLeaveData) {
    const dateOff = registerLeaveData.dateOff;
    const updateTimes = [...this.times];
    const timeDateIndex = updateTimes.findIndex(td => {
        return td.dateTime === dateOff;
    });
    if (timeDateIndex < 0) {
        updateTimes.push({ dateTime: dateOff, annualLeaveData: registerLeaveData, workingTimes: [] })
    } else {
        updateTimes[timeDateIndex].annualLeaveData = registerLeaveData;
    }
    console.log(updateTimes)
    this.times = updateTimes;
    const annualLeaveRegisted = this.times.map(item => {
        return item.annualLeaveData.leaveHour;
    }).reduce((total, value) => {
        return total + value;
    }, 0);
    this.annualLeave = 12 - annualLeaveRegisted / 8;
    return this.save();
};

employeeSchema.methods.addTempInfo = function (temp) {
    const updateTempInfo = [...this.covidInfos.temps];
    updateTempInfo.push(temp);
    this.covidInfos.temps = updateTempInfo;
    return this.save();
};

employeeSchema.methods.addVaccinationInfo = function (vaccinationInfo) {
    const updateVaccinationInfo = [...this.covidInfos.vaccines];
    updateVaccinationInfo.push(vaccinationInfo);
    this.covidInfos.vaccines = updateVaccinationInfo;
    return this.save();
};

employeeSchema.methods.addPositiveInfo = function (positiveInfo) {
    const updatePositiveInfo = [...this.covidInfos.positives];
    updatePositiveInfo.push(positiveInfo);
    this.covidInfos.positives = updatePositiveInfo;
    return this.save();
};

employeeSchema.methods.changeEmployeeInfo = function (imageUrl) {
    this.imageUrl = imageUrl;
    return this.save();
}

module.exports = mongoose.model('Employee', employeeSchema);
