const { validationResult } = require('express-validator');
const rideService = require('../services/ride.services');
const socketService = require('../socket');

const DISPATCH_TIMEOUT_MS = 40000;
const RIDE_UNAVAILABLE_MESSAGE = 'No captains are available for this ride. Please try again later.';
const dispatchTimers = new Map();

const getDocumentId = (value) => value?._id || value;

const clearDispatchTimer = (rideId) => {
    const timerKey = rideId?.toString();
    const timer = timerKey ? dispatchTimers.get(timerKey) : null;

    if (timer) {
        clearTimeout(timer);
        dispatchTimers.delete(timerKey);
    }
};

const notifyOfferedCaptains = (ride, message, excludedCaptainId = null) => {
    socketService.sendMessageToAccountIds(
        'captain',
        ride?.offeredCaptains || [],
        'ride-unavailable',
        {
            rideId: ride?._id,
            message
        },
        excludedCaptainId
    );
};

const notifyRiderRideUnavailable = (ride, message) => {
    const userId = getDocumentId(ride?.user);

    if (userId) {
        socketService.sendMessageToAccountId(
            'user',
            userId,
            'ride-unavailable',
            {
                rideId: ride?._id,
                message
            }
        );
    }
};

const scheduleDispatchExpiry = (ride) => {
    const rideId = ride?._id?.toString();
    const expiresAt = new Date(ride?.dispatchExpiresAt).getTime();

    if (!rideId || !Number.isFinite(expiresAt)) {
        return;
    }

    clearDispatchTimer(rideId);

    const timer = setTimeout(async () => {
        dispatchTimers.delete(rideId);

        try {
            const expiredRide = await rideService.expirePendingRide(rideId);

            if (!expiredRide) {
                return;
            }

            notifyRiderRideUnavailable(expiredRide, RIDE_UNAVAILABLE_MESSAGE);
            notifyOfferedCaptains(expiredRide, 'This ride request has expired.');
        } catch (error) {
            console.error('Ride dispatch expiry failed:', error.message);
        }
    }, Math.max(0, expiresAt - Date.now()));

    timer.unref?.();
    dispatchTimers.set(rideId, timer);
};

const withoutOtp = (ride) => {
    const rideData = typeof ride?.toObject === 'function'
        ? ride.toObject()
        : { ...ride };

    delete rideData.otp;
    delete rideData.offeredCaptains;
    delete rideData.declinedCaptains;
    delete rideData.isOpen;
    return rideData;
};

const withoutDispatchDetails = (ride) => {
    const rideData = typeof ride?.toObject === 'function'
        ? ride.toObject()
        : { ...ride };

    delete rideData.offeredCaptains;
    delete rideData.declinedCaptains;
    delete rideData.isOpen;
    return rideData;
};

const getQueryCoordinates = (query, prefix) => {
    const lat = query[`${prefix}Lat`];
    const lng = query[`${prefix}Lng`];

    if (lat === undefined && lng === undefined) {
        return null;
    }

    return { lat, lng };
};

module.exports.getFare = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { pickup, destination } = req.query;

        const fare = await rideService.getFare(
            pickup,
            destination,
            getQueryCoordinates(req.query, 'pickup'),
            getQueryCoordinates(req.query, 'destination')
        );

        res.status(200).json(fare);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

module.exports.createRide = async (req, res) => {
    let ride;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const {
            pickup,
            destination,
            vehicleType,
            pickupCoordinates,
            destinationCoordinates
        } = req.body;

        ride = await rideService.createRide({
            user: req.user._id,
            pickup,
            destination,
            vehicleType,
            pickupCoordinates,
            destinationCoordinates
        });

        const nearbyCaptains = await rideService.getNearbyCaptains({
            pickup,
            pickupCoordinates: ride.pickupCoordinates,
            vehicleType,
            radius: 5
        });

        const eligibleCaptains = new Map(
            nearbyCaptains.captains
                .filter((captain) => (
                    captain.socketId &&
                    socketService.isSocketConnected(captain.socketId)
                ))
                .map((captain) => [captain._id.toString(), captain])
        );

        ride.offeredCaptains = Array.from(eligibleCaptains.keys());
        ride.declinedCaptains = [];
        ride.dispatchExpiresAt = new Date(Date.now() + DISPATCH_TIMEOUT_MS);

        if (eligibleCaptains.size === 0) {
            ride.status = 'cancelled';
            ride.isOpen = false;
        }

        await ride.save();

        if (eligibleCaptains.size === 0) {
            return res.status(201).json({
                ...withoutDispatchDetails(ride),
                message: RIDE_UNAVAILABLE_MESSAGE
            });
        }

        scheduleDispatchExpiry(ride);

        const captainRide = withoutOtp(ride);

        eligibleCaptains.forEach((captain) => {
            socketService.sendMessageToSocketId(
                captain.socketId,
                'new-ride',
                {
                    ride: captainRide,
                    pickupCoordinates: nearbyCaptains.pickupCoordinates
                }
            );
        });

        res.status(201).json(withoutDispatchDetails(ride));
    } catch (error) {
        if (ride?._id && ride.status === 'pending') {
            try {
                await rideService.cancelPendingRide({
                    rideId: ride._id,
                    user: req.user._id
                });
            } catch (cleanupError) {
                console.error('Failed to cancel an undispatched ride:', cleanupError.message);
            }
        }

        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

module.exports.getNearbyCaptains = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { pickup, vehicleType, radius } = req.query;

        const nearbyCaptains = await rideService.getNearbyCaptains({
            pickup,
            vehicleType,
            radius: radius ? Number(radius) : 5
        });

        res.status(200).json({
            pickupCoordinates: nearbyCaptains.pickupCoordinates,
            availableCaptainCount: nearbyCaptains.captains.length
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

module.exports.acceptRide = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { rideId } = req.body;

        if (
            req.captain.status !== 'active' ||
            !req.captain.socketId ||
            !socketService.isSocketConnected(req.captain.socketId)
        ) {
            return res.status(409).json({ message: 'Captain must be online to accept a ride' });
        }

        const ride = await rideService.acceptRide({
            rideId,
            captain: req.captain._id
        });

        clearDispatchTimer(ride._id);
        notifyOfferedCaptains(
            ride,
            'This ride was accepted by another captain.',
            req.captain._id
        );

        socketService.sendMessageToSocketId(
            ride.user.socketId,
            'ride-accepted',
            ride
        );

        res.status(200).json(withoutOtp(ride));
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

module.exports.rejectRide = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { rideId } = req.body;
        const { ride, allDeclined } = await rideService.rejectRide({
            rideId,
            captain: req.captain._id
        });

        if (allDeclined) {
            clearDispatchTimer(ride._id);
            notifyRiderRideUnavailable(ride, RIDE_UNAVAILABLE_MESSAGE);
            notifyOfferedCaptains(ride, 'This ride request is no longer available.');
        }

        res.status(200).json({
            rideId: ride._id,
            status: ride.status,
            allDeclined
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

module.exports.cancelRide = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { rideId } = req.body;
        const ride = await rideService.cancelPendingRide({
            rideId,
            user: req.user._id
        });

        clearDispatchTimer(ride._id);
        notifyOfferedCaptains(ride, 'This ride request is no longer available.');

        res.status(200).json({
            rideId: ride._id,
            status: ride.status,
            message: RIDE_UNAVAILABLE_MESSAGE
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

module.exports.startRide = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { rideId, otp } = req.body;

        const ride = await rideService.startRide({
            rideId,
            captain: req.captain._id,
            otp
        });

        socketService.sendMessageToSocketId(
            ride.user.socketId,
            'ride-started',
            ride
        );

        res.status(200).json(withoutOtp(ride));
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

module.exports.endRide = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { rideId } = req.body;

        const ride = await rideService.endRide({
            rideId,
            captain: req.captain._id
        });

        socketService.sendMessageToSocketId(
            ride.user.socketId,
            'ride-ended',
            ride
        );

        res.status(200).json(withoutOtp(ride));
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

module.exports.confirmPayment = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { rideId, paymentMethod } = req.body;

        const { ride, newlyConfirmed } = await rideService.confirmPayment({
            rideId,
            captain: req.captain._id,
            paymentMethod
        });

        if (newlyConfirmed) {
            socketService.sendMessageToSocketId(
                ride.user.socketId,
                'payment-confirmed',
                {
                    rideId: ride._id,
                    paymentStatus: ride.paymentStatus,
                    paymentMethod: ride.paymentMethod
                }
            );
        }

        res.status(200).json(ride);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

module.exports.getCurrentUserRide = async (req, res) => {
    try {
        const ride = await rideService.getCurrentUserRide(req.user._id);
        res.status(200).json({ ride });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports.getCurrentCaptainRide = async (req, res) => {
    try {
        const ride = await rideService.getCurrentCaptainRide(req.captain._id);
        res.status(200).json({ ride });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
