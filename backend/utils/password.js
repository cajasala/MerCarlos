const bcrypt = require('bcryptjs');

/**
 * Hash a plain-text password before storing it.
 * Use this during migration / seed only.
 */
const hashPassword = async (plainText) => {
    return await bcrypt.hash(plainText, 10);
    //return "";
};

/**
 * Compare a submitted password with a stored bcrypt hash.
 * Returns true if the password matches.
 */
const comparePassword = async (plainText, hashed) => {
    return await bcrypt.compare(plainText, hashed);
    //return "";
};

module.exports = { hashPassword, comparePassword };
