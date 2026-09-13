const rideModel = require('../models/ride.models');
const mapService = require('./map.services');
const captainService = require('./captain.services');

const fareRates = {
    Auto: {
        baseFare: 30,
        perKm: 10,
        perMinute: 2
    },
    Car: {
        baseFare: 50,
        perKm: 15,
        perMinute: 3
    },
    Bike: {
        baseFare: 20,
        perKm: 8,
        perMinute: 1.5
    }
};

const getOtp = (num) => {
    return Math.floor(Math.random() * Math.pow(10, num))
        .toString()
        .padStart(num, '0');
};

const DISPATCH_TIMEOUT_MS = 40000;

const BUSY_RIDE_CONDITIONS = [
    { status: { $in: ['accepted', 'ongoing'] } },
    { status: 'completed', paymentStatus: { $ne: 'paid' } }
];

const createServiceError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const isDuplicateKeyError = (error) => error?.code === 11000;

const expireStalePendingRides = async (filter = {}) => {
    await rideModel.updateMany(
        {
            ...filter,
            status: 'pending',
            $or: [
                { dispatchExpiresAt: { $lte: new Date() } },
                { dispatchExpiresAt: { $exists: false } }
            ]
        },
        {
            $set: {
                status: 'cancelled',
                isOpen: false
            }
        }
    );
};

const normalizeProvidedCoordinates = (coordinates, label) => {
    if (coordinates === null || coordinates === undefined) {
        return null;
    }

    if (
        coordinates.lat === null ||
        coordinates.lat === undefined ||
        coordinates.lat === '' ||
        coordinates.lng === null ||
        coordinates.lng === undefined ||
        coordinates.lng === ''
    ) {
        throw createServiceError(`Invalid ${label} coordinates`, 400);
    }

    const lat = Number(coordinates.lat);
    const lng = Number(coordinates.lng);

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
    ) {
        throw createServiceError(`Invalid ${label} coordinates`, 400);
    }

    return { lat, lng };
};

module.exports.getFare = async (
    pickup,
    destination,
    pickupCoordinates = null,
    destinationCoordinates = null
) => {
    if (!pickup || !destination) {
        throw createServiceError('Pickup and destination are required', 400);
    }

    const normalizedPickupCoordinates = normalizeProvidedCoordinates(pickupCoordinates, 'pickup');
    const normalizedDestinationCoordinates = normalizeProvidedCoordinates(destinationCoordinates, 'destination');

    const distanceTime = await mapService.getDistanceTime(
        pickup,
        destination,
        normalizedPickupCoordinates,
        normalizedDestinationCoordinates
    );

    const distanceInKm = distanceTime.distance / 1000;
    const durationInMinutes = distanceTime.duration / 60;

    const fare = {
        Auto: Math.round(
            fareRates.Auto.baseFare +
            distanceInKm * fareRates.Auto.perKm +
            durationInMinutes * fareRates.Auto.perMinute
        ),
        Car: Math.round(
            fareRates.Car.baseFare +
            distanceInKm * fareRates.Car.perKm +
            durationInMinutes * fareRates.Car.perMinute
        ),
        Bike: Math.round(
            fareRates.Bike.baseFare +
            distanceInKm * fareRates.Bike.perKm +
            durationInMinutes * fareRates.Bike.perMinute
        )
    };

    return {
        fare,
        distance: distanceTime.distance,
        duration: distanceTime.duration,
        pickupCoordinates: distanceTime.origin,
        destinationCoordinates: distanceTime.destination
    };
};

module.exports.createRide = async ({
    user,
    pickup,
    destination,
    vehicleType,
    pickupCoordinates = null,
    destinationCoordinates = null
}) => {
    if (!user || !pickup || !destination || !vehicleType) {
        throw new Error('All fields are required');
    }

    if (!fareRates[vehicleType]) {
        throw new Error('Invalid vehicle type');
    }

    await expireStalePendingRides({ user });

    const fareData = await module.exports.getFare(
        pickup,
        destination,
        pickupCoordinates,
        destinationCoordinates
    );

    let ride;

    try {
        ride = await rideModel.create({
            user,
            pickup,
            destination,
            vehicleType,
            fare: fareData.fare[vehicleType],
            distance: fareData.distance,
            duration: fareData.duration,
            pickupCoordinates: fareData.pickupCoordinates,
            destinationCoordinates: fareData.destinationCoordinates,
            otp: getOtp(6),
            isOpen: true,
            dispatchExpiresAt: new Date(Date.now() + DISPATCH_TIMEOUT_MS)
        });
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            throw createServiceError('You already have an active ride', 409);
        }
        throw error;
    }

    const populatedRide = await ride.populate({
        path: 'user',
        select: 'fullname'
    })

    return populatedRide;
};

module.exports.getNearbyCaptains = async ({
    pickup,
    pickupCoordinates = null,
    vehicleType,
    radius
}) => {
    if (!pickup || !vehicleType) {
        throw new Error('Pickup and vehicle type are required');
    }

    const normalizedPickupCoordinates = normalizeProvidedCoordinates(pickupCoordinates, 'pickup')
        || await mapService.getCoordinates(pickup);

    const captains = await captainService.getCaptainsInRadius({
        lat: normalizedPickupCoordinates.lat,
        lng: normalizedPickupCoordinates.lng,
        radius,
        vehicleType
    });

    if (captains.length === 0) {
        return {
            pickupCoordinates: normalizedPickupCoordinates,
            captains: []
        };
    }

    const captainIds = captains.map((captain) => captain._id);
    const [busyCaptainIds, offeredCaptainIds] = await Promise.all([
        rideModel.distinct('captain', {
            captain: { $in: captainIds },
            $or: BUSY_RIDE_CONDITIONS
        }),
        rideModel.distinct('offeredCaptains', {
            offeredCaptains: { $in: captainIds },
            status: 'pending',
            dispatchExpiresAt: { $gt: new Date() }
        })
    ]);
    const busyCaptainSet = new Set(
        [...busyCaptainIds, ...offeredCaptainIds].map((captainId) => captainId.toString())
    );

    return {
        pickupCoordinates: normalizedPickupCoordinates,
        captains: captains.filter((captain) => !busyCaptainSet.has(captain._id.toString()))
    };
};

module.exports.acceptRide = async ({
    rideId,
    captain
}) => {
    if (!rideId || !captain) {
        throw new Error('Ride id and captain are required');
    }

    const existingRide = await rideModel.exists({
        captain,
        $or: BUSY_RIDE_CONDITIONS
    });

    if (existingRide) {
        throw createServiceError('Captain already has an active ride', 409);
    }

    let ride;

    try {
        ride = await rideModel.findOneAndUpdate(
            {
                _id: rideId,
                status: 'pending',
                offeredCaptains: captain,
                declinedCaptains: { $ne: captain },
                dispatchExpiresAt: { $gt: new Date() }
            },
            {
                $set: {
                    captain,
                    status: 'accepted'
                }
            },
            {
                returnDocument: 'after'
            }
        )
            .populate('user')
            .populate('captain')
            .select('+otp +offeredCaptains');
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            throw createServiceError('Captain already has an active ride', 409);
        }
        throw error;
    }

    if (!ride) {
        throw createServiceError('Ride not found or already accepted', 409);
    }

    return ride;
};

module.exports.startRide = async ({
    rideId,
    captain,
    otp
}) => {
    if (!rideId || !captain || !otp) {
        throw new Error('Ride id, captain and OTP are required');
    }

    const ride = await rideModel.findOneAndUpdate(
        {
            _id: rideId,
            captain,
            status: 'accepted',
            otp
        },
        {
            $set: { status: 'ongoing' }
        },
        {
            returnDocument: 'after'
        }
    )
        .populate('user')
        .populate('captain');

    if (!ride) {
        throw createServiceError('Invalid OTP or ride is no longer available', 409);
    }

    return ride;
};

module.exports.endRide = async ({
    rideId,
    captain
}) => {
    if (!rideId || !captain) {
        throw new Error('Ride id and captain are required');
    }

    const ride = await rideModel.findOneAndUpdate(
        {
            _id: rideId,
            captain,
            status: 'ongoing'
        },
        {
            status: 'completed'
        },
        {
            returnDocument: 'after'
        }
    )
        .populate('user')
        .populate('captain');

    if (!ride) {
        throw createServiceError('Ride not found or not ongoing', 409);
    }

    return ride;
};

module.exports.rejectRide = async ({
    rideId,
    captain
}) => {
    if (!rideId || !captain) {
        throw createServiceError('Ride id and captain are required', 400);
    }

    const declinedRide = await rideModel.findOneAndUpdate(
        {
            _id: rideId,
            status: 'pending',
            offeredCaptains: captain,
            dispatchExpiresAt: { $gt: new Date() }
        },
        {
            $addToSet: { declinedCaptains: captain }
        },
        {
            returnDocument: 'after'
        }
    )
        .populate('user')
        .select('+offeredCaptains +declinedCaptains');

    if (!declinedRide) {
        throw createServiceError('Ride is no longer available', 409);
    }

    const declinedCaptainIds = new Set(
        declinedRide.declinedCaptains.map((captainId) => captainId.toString())
    );
    const allDeclined = declinedRide.offeredCaptains.length > 0 &&
        declinedRide.offeredCaptains.every((captainId) => (
            declinedCaptainIds.has(captainId.toString())
        ));

    if (!allDeclined) {
        return { ride: declinedRide, allDeclined: false };
    }

    const cancelledRide = await rideModel.findOneAndUpdate(
        {
            _id: rideId,
            status: 'pending'
        },
        {
            $set: {
                status: 'cancelled',
                isOpen: false
            }
        },
        {
            returnDocument: 'after'
        }
    )
        .populate('user')
        .select('+offeredCaptains');

    return {
        ride: cancelledRide || declinedRide,
        allDeclined: Boolean(cancelledRide)
    };
};

module.exports.cancelPendingRide = async ({
    rideId,
    user
}) => {
    if (!rideId || !user) {
        throw createServiceError('Ride id and user are required', 400);
    }

    const ride = await rideModel.findOneAndUpdate(
        {
            _id: rideId,
            user,
            status: 'pending'
        },
        {
            $set: {
                status: 'cancelled',
                isOpen: false
            }
        },
        {
            returnDocument: 'after'
        }
    )
        .populate('user')
        .select('+offeredCaptains');

    if (!ride) {
        const alreadyCancelledRide = await rideModel.findOne({
            _id: rideId,
            user,
            status: 'cancelled'
        })
            .populate('user')
            .select('+offeredCaptains');

        if (alreadyCancelledRide) {
            return alreadyCancelledRide;
        }

        throw createServiceError('Ride is no longer pending', 409);
    }

    return ride;
};

module.exports.confirmPayment = async ({
    rideId,
    captain,
    paymentMethod
}) => {
    if (!rideId || !captain || !paymentMethod) {
        throw new Error('Ride id, captain and payment method are required');
    }

    const ride = await rideModel.findOneAndUpdate(
        {
            _id: rideId,
            captain,
            status: 'completed',
            paymentStatus: { $ne: 'paid' }
        },
        {
            $set: {
                paymentStatus: 'paid',
                paymentMethod,
                paymentConfirmedAt: new Date(),
                isOpen: false
            }
        },
        {
            returnDocument: 'after'
        }
    )
        .populate('user')
        .populate('captain');

    if (ride) {
        return { ride, newlyConfirmed: true };
    }

    const alreadyConfirmedRide = await rideModel.findOne({
        _id: rideId,
        captain,
        status: 'completed',
        paymentStatus: 'paid'
    })
        .populate('user')
        .populate('captain');

    if (!alreadyConfirmedRide) {
        throw createServiceError('Ride not found, not completed, or not assigned to this captain', 409);
    }

    return { ride: alreadyConfirmedRide, newlyConfirmed: false };
};

module.exports.getCurrentUserRide = async (user) => {
    await expireStalePendingRides({ user });

    return await rideModel.findOne({
        user,
        $or: [
            { status: { $in: ['pending', 'accepted', 'ongoing'] } },
            { status: 'completed', paymentStatus: { $ne: 'paid' } }
        ]
    })
        .sort({ _id: -1 })
        .select('+otp')
        .populate('user')
        .populate('captain');
};

module.exports.expirePendingRide = async (rideId) => {
    if (!rideId) {
        throw createServiceError('Ride id is required', 400);
    }

    return await rideModel.findOneAndUpdate(
        {
            _id: rideId,
            status: 'pending',
            dispatchExpiresAt: { $lte: new Date() }
        },
        {
            $set: {
                status: 'cancelled',
                isOpen: false
            }
        },
        {
            returnDocument: 'after'
        }
    )
        .populate('user')
        .select('+offeredCaptains');
};

module.exports.getCurrentCaptainRide = async (captain) => {
    return await rideModel.findOne({
        captain,
        $or: [
            { status: { $in: ['accepted', 'ongoing'] } },
            { status: 'completed', paymentStatus: { $ne: 'paid' } }
        ]
    })
        .sort({ _id: -1 })
        .populate('user')
        .populate('captain');
};
