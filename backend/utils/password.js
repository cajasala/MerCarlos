console.log('PASSWORD.JS LOADING');

try {
    const bcrypt = require('bcrypt');
    console.log('BCRYPT LOADED OK');

    const hashPassword = async (plainText) => {
        return await bcrypt.hash(plainText, 10);
    };

    const comparePassword = async (plainText, hashed) => {
        return await bcrypt.compare(plainText, hashed);
    };

    module.exports = { hashPassword, comparePassword };

} catch (err) {
    console.error('BCRYPT ERROR:', err);
    throw err;
}