const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/users?limit=1&includeOrders=true',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            if (parsed.data && parsed.data.length > 0) {
                const user = parsed.data[0];
                console.log('User Keys:', Object.keys(user));
                if (user.orders) {
                    console.log('Orders found:', user.orders.length);
                    if (user.orders.length > 0) {
                        console.log('First Order Keys:', Object.keys(user.orders[0]));
                    }
                } else {
                    console.log('Orders property MISSING');
                }
            } else {
                console.log('No users found or error structure', parsed);
            }
        } catch (e) {
            console.error('Parse error', e.message);
            console.log('Raw data sample:', data.substring(0, 200));
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
