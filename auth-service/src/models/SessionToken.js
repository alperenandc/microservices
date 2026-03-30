const mongoose = require("mongoose");

const sessionTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const SessionToken = mongoose.model("SessionToken", sessionTokenSchema);

module.exports = { SessionToken };
