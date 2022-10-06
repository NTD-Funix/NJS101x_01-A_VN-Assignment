const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const managerSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    employees: [{
        employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
        monthConfirmed: [],
    }]
})

module.exports = mongoose.model('Manager', managerSchema);