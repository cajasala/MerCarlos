/**
 * SMS Utility for MerCarlos
 * In production, this would use Twilio or Azure Communication Services.
 */

const sendSMS = async (phoneNumber, message) => {
    // Mocking SMS sending
    console.log(`[SMS MOCK] Sending to ${phoneNumber}: ${message}`);
    
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ success: true, messageId: 'mock-id-' + Date.now() });
        }, 500);
    });
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
    sendSMS,
    generateOTP
};
