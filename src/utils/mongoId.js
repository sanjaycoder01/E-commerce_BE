const mongoose = require('mongoose');

/**
 * Turn request/UI values into a plain ObjectId hex string.
 * Handles string ids and Mongo extended JSON { $oid: "..." } (avoids "[object Object]").
 * @param {*} raw
 * @returns {string}
 */
function normalizeMongoId(raw) {
  if (raw == null) return '';
  if (typeof raw === 'object' && raw !== null) {
    if (raw.$oid != null) return String(raw.$oid).trim();
    if (raw._id != null) return normalizeMongoId(raw._id);
    return '';
  }
  return String(raw).trim();
}

/**
 * @param {*} raw
 * @returns {string|''} Valid 24-char hex or empty
 */
function toValidObjectIdString(raw) {
  const s = normalizeMongoId(raw);
  if (!s) return '';
  return mongoose.Types.ObjectId.isValid(s) ? s : '';
}

module.exports = {
  normalizeMongoId,
  toValidObjectIdString,
};
