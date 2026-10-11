// App configuration and route mounting only. The server is started in server.js.
const express = require('express');
const cors = require('cors');
const logger = require('./middleware/logger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim()) }));
app.use(express.json());
app.use(logger);

app.use('/api', routes);

app.use(notFound);     // 404 catch-all (after all routes)
app.use(errorHandler); // error handler (always last)

module.exports = app;
