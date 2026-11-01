const { zonedTimeToUtc, format } = require('date-fns-tz');
const d = zonedTimeToUtc('2024-01-01T00:00:00', 'Asia/Kolkata');
console.log('iso', d.toISOString());
console.log('fmt', format(d, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: 'UTC' }));
