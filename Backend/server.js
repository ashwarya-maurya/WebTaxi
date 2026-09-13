const dotenv = require('dotenv');
dotenv.config();

const http = require('http');
const app = require('./app');
const connectToDB = require('./DB/db');
const { initializeSocket } = require('./socket');

const REQUIRED_ENVIRONMENT_VARIABLES = [
    'DB_CONNECT',
    'JWT_SECRET',
    'CLIENT_URL',
    'NOMINATIM_USER_AGENT'
];

const validateEnvironment = () => {
    const missingVariables = REQUIRED_ENVIRONMENT_VARIABLES.filter(
        (variableName) => !process.env[variableName]?.trim()
    );

    if (missingVariables.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVariables.join(', ')}`);
    }
};

const startServer = async () => {
    try {
        validateEnvironment();
        await connectToDB();

        const port = process.env.PORT || 3000;
        const server = http.createServer(app);

        initializeSocket(server);
        server.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Server startup failed:', error.message);
        process.exitCode = 1;
    }
};

startServer();
