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