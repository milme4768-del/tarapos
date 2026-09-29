const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

/**
 * Atomically increments and gets the next sequence number for a given key.
 * @param {string} key Identifier e.g. "bill_OUT1_2026"
 * @returns {Promise<number>}
 */
counterSchema.statics.getNextSequence = async function (key) {
  const result = await this.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  return result.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
