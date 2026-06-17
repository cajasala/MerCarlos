const { app } = require('@azure/functions');

console.log('INDEX LOADED');

app.http('health', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'health',
    handler: async () => {
        return {
            status: 200,
            body: 'OK'
        };
    }
});

console.log('1111111');
require('./functions/auth');
console.log('2222222');
require('./functions/catalog');
console.log('3333333');
require('./functions/locations');
console.log('44444444');
require('./functions/orders');
/*
console.log('555555555');
require('./functions/lists');
console.log('666666666');
require('./functions/admin');
console.log('777777777');
require('./functions/adminBulk');
console.log('8888888888');
require('./functions/adminImages');
console.log('9999999999');
require('./functions/adminOrders');
console.log('101010101010');
*/