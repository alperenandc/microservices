const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    method: String,
    url: String,
    status: Number,
    ip: String,
    userAgent: String
});

module.exports = mongoose.model('Log', LogSchema);
