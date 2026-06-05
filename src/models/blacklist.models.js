const mongoose = require('mongoose');

const blacklistTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: [true,"Token is required to be added in the blacklist"]
  },
}, { timestamps: true });

module.exports = mongoose.model('BlacklistToken', blacklistTokenSchema);  