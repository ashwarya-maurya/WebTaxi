const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const userModel = require('./models/user.models');
const captainModel = require('./models/captain.models');
const rideModel = require('./models/ride.models');
const blacklistTokenModel = require('./models/blacklistToken.models');

let io;

const getAccountRoom = (accountType, accountId) => `${accountType}:${accountId}`;

const registerAuthenticatedSocket = async (socket, { resetCaptainStatus = false } = {}) => {
    const update = { socketId: socket.id };

    if (socket.data.accountType === 'captain') {
        if (resetCaptainStatus) {
            update.status = 'inactive';
        }
        await captainModel.findByIdAndUpdate(socket.data.accountId, update);
        return;
    }

    await userModel.findByIdAndUpdate(socket.data.accountId, update);
};

module.exports.initializeSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true
        }
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error('Unauthorized Access'));
            }

            const [decoded, isBlacklisted] = await Promise.all([
                Promise.resolve(jwt.verify(token, process.env.JWT_SECRET)),
                blacklistTokenModel.exists({ token })
            ]);

            if (isBlacklisted) {
                return next(new Error('Unauthorized Access'));
            }

            const [user, captain] = await Promise.all([
                userModel.findById(decoded._id).select('_id'),
                captainModel.findById(decoded._id).select('_id')
            ]);

            if ((!user && !captain) || (user && captain)) {
                return next(new Error('Unauthorized Access'));
            }

            socket.data.accountId = decoded._id.toString();
            socket.data.accountType = captain ? 'captain' : 'user';
            return next();
        } catch (error) {
            return next(new Error('Unauthorized Access'));
        }
    });

    io.on('connection', async (socket) => {
        console.log('Socket connected:', socket.id);

        try {
            await registerAuthenticatedSocket(socket, { resetCaptainStatus: true });
            socket.join(getAccountRoom(socket.data.accountType, socket.data.accountId));
        } catch (error) {
            console.error('Socket registration failed:', error.message);
            socket.disconnect(true);
            return;
        }

        // Keep the existing event name for compatibility, but never trust its payload.
        socket.on('join', async () => {
            try {
                await registerAuthenticatedSocket(socket);
            } catch (error) {
                console.error('Socket registration failed:', error.message);
            }
        });

        socket.on('update-location-captain', async (data = {}) => {
            if (socket.data.accountType !== 'captain') {
                return;
            }

            const lat = Number(data.location?.lat);
            const lng = Number(data.location?.lng);

            if (
                !Number.isFinite(lat) ||
                !Number.isFinite(lng) ||
                lat < -90 ||
                lat > 90 ||
                lng < -180 ||
                lng > 180
            ) {
                return;
            }

            try {
                const captainId = socket.data.accountId;
                const captain = await captainModel.findOneAndUpdate(
                    { _id: captainId, socketId: socket.id },
                    {
                        location: { lat, lng },
                        status: 'active'
                    },
                    { returnDocument: 'after' }
                );

                if (!captain) {
                    return;
                }

                const activeRide = await rideModel.findOne({
                    captain: captainId,
                    status: { $in: ['accepted', 'ongoing'] }
                }).populate('user', 'socketId');

                if (activeRide?.user?.socketId) {
                    module.exports.sendMessageToSocketId(
                        activeRide.user.socketId,
                        'captain-location',
                        {
                            rideId: activeRide._id,
                            location: { lat, lng }
                        }
                    );
                }
            } catch (error) {
                console.error('Captain location update failed:', error.message);
            }
        });

        socket.on('disconnect', async () => {
            try {
                if (socket.data.accountType === 'captain') {
                    await captainModel.findOneAndUpdate(
                        { _id: socket.data.accountId, socketId: socket.id },
                        { socketId: null, status: 'inactive' }
                    );
                } else {
                    await userModel.findOneAndUpdate(
                        { _id: socket.data.accountId, socketId: socket.id },
                        { socketId: null }
                    );
                }
            } catch (error) {
                console.error('Socket disconnect cleanup failed:', error.message);
            }

            console.log('Socket disconnected:', socket.id);
        });
    });
};

module.exports.isSocketConnected = (socketId) => {
    return Boolean(io && socketId && io.sockets.sockets.has(socketId));
};

module.exports.sendMessageToSocketId = (socketId, event, data) => {
    if (!module.exports.isSocketConnected(socketId)) {
        return false;
    }

    io.to(socketId).emit(event, data);
    return true;
};

module.exports.sendMessageToAccountId = (accountType, accountId, event, data) => {
    if (!io || !accountType || !accountId) {
        return false;
    }

    io.to(getAccountRoom(accountType, accountId.toString())).emit(event, data);
    return true;
};

module.exports.sendMessageToAccountIds = (accountType, accountIds, event, data, excludedAccountId = null) => {
    const uniqueAccountIds = new Set(
        (accountIds || [])
            .filter(Boolean)
            .map((accountId) => accountId.toString())
    );

    if (excludedAccountId) {
        uniqueAccountIds.delete(excludedAccountId.toString());
    }

    uniqueAccountIds.forEach((accountId) => {
        module.exports.sendMessageToAccountId(accountType, accountId, event, data);
    });

    return uniqueAccountIds.size;
};
