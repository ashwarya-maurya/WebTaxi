const mongoose = require('mongoose');

const coordinateSchema = new mongoose.Schema({
    lat: {
        type: Number,
        required: true,
        min: -90,
        max: 90
    },
    lng: {
        type: Number,
        required: true,
        min: -180,
        max: 180
    }
}, { _id: false });

const rideSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'captains',
    },
    offeredCaptains: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'captains'
        }],
        default: [],
        select: false
    },
    declinedCaptains: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'captains'
        }],
        default: [],
        select: false
    },
    dispatchExpiresAt: {
        type: Date
    },
    pickup: {
        type: String,
        required: true,
    },
    destination: {
        type: String,
        required: true,
    },
    pickupCoordinates: {
        type: coordinateSchema,
    },
    destinationCoordinates: {
        type: coordinateSchema,
    },
    fare: {
        type: Number,
        required: true,
    },

    status: {
        type: String,
        enum: [ 'pending', 'accepted', "ongoing", 'completed', 'cancelled' ],
        default: 'pending',
    },

    isOpen: {
        type: Boolean,
        default: true,
        select: false,
    },

    duration: {
        type: Number,
    }, // in seconds

    distance: {
        type: Number,
    }, // in meters

    paymentStatus: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending',
    },

    paymentMethod: {
        type: String,
        enum: ['cash', 'upi'],
    },

    paymentConfirmedAt: {
        type: Date,
    },

    otp: {
        type: String,
        select: false,
        required: true,
    },

    vehicleType: {
        type: String,
        required: true,
        enum: ['Bike', 'Car', 'Auto'],
    },
})

rideSchema.index({ user: 1, status: 1, paymentStatus: 1 });
rideSchema.index({ captain: 1, status: 1, paymentStatus: 1 });
rideSchema.index(
    { user: 1 },
    {
        unique: true,
        partialFilterExpression: { isOpen: true }
    }
);
rideSchema.index(
    { captain: 1 },
    {
        unique: true,
        partialFilterExpression: {
            isOpen: true,
            captain: { $exists: true }
        }
    }
);

module.exports = mongoose.model('ride', rideSchema);
