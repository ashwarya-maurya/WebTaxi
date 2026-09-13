const express = require('express');
const router = express.Router();
const { query, body } = require('express-validator');
const rideController = require('../controllers/ride.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/get-fare',
    authMiddleware.authUser,
    [
        query('pickup')
            .isString()
            .isLength({ min: 3 })
            .withMessage('Pickup must be at least 3 characters long'),
        query('destination')
            .isString()
            .isLength({ min: 3 })
            .withMessage('Destination must be at least 3 characters long'),
        query('pickupLat')
            .optional()
            .isFloat({ min: -90, max: 90 })
            .withMessage('Invalid pickup latitude'),
        query('pickupLng')
            .optional()
            .isFloat({ min: -180, max: 180 })
            .withMessage('Invalid pickup longitude'),
        query('destinationLat')
            .optional()
            .isFloat({ min: -90, max: 90 })
            .withMessage('Invalid destination latitude'),
        query('destinationLng')
            .optional()
            .isFloat({ min: -180, max: 180 })
            .withMessage('Invalid destination longitude')
    ],
    rideController.getFare
);

router.post('/create',
    authMiddleware.authUser,
    [
        body('pickup')
            .isString()
            .isLength({ min: 3 })
            .withMessage('Pickup must be at least 3 characters long'),
        body('destination')
            .isString()
            .isLength({ min: 3 })
            .withMessage('Destination must be at least 3 characters long'),
        body('pickupCoordinates')
            .optional()
            .isObject()
            .withMessage('Pickup coordinates must be an object'),
        body('pickupCoordinates.lat')
            .optional()
            .isFloat({ min: -90, max: 90 })
            .withMessage('Invalid pickup latitude'),
        body('pickupCoordinates.lng')
            .optional()
            .isFloat({ min: -180, max: 180 })
            .withMessage('Invalid pickup longitude'),
        body('destinationCoordinates')
            .optional()
            .isObject()
            .withMessage('Destination coordinates must be an object'),
        body('destinationCoordinates.lat')
            .optional()
            .isFloat({ min: -90, max: 90 })
            .withMessage('Invalid destination latitude'),
        body('destinationCoordinates.lng')
            .optional()
            .isFloat({ min: -180, max: 180 })
            .withMessage('Invalid destination longitude'),
        body('vehicleType')
            .isIn(['Bike', 'Car', 'Auto'])
            .withMessage('Invalid vehicle type')
    ],
    rideController.createRide
);

router.get('/nearby-captains',
    authMiddleware.authUser,
    [
        query('pickup')
            .isString()
            .isLength({ min: 3 })
            .withMessage('Pickup must be at least 3 characters long'),
        query('vehicleType')
            .isIn(['Bike', 'Car', 'Auto'])
            .withMessage('Invalid vehicle type'),
        query('radius')
            .optional()
            .isFloat({ min: 1 })
            .withMessage('Radius must be at least 1 km')
    ],
    rideController.getNearbyCaptains
);

router.post('/accept',
    authMiddleware.authCaptain,
    [
        body('rideId')
            .isMongoId()
            .withMessage('Invalid ride id')
    ],
    rideController.acceptRide
);

router.post('/reject',
    authMiddleware.authCaptain,
    [
        body('rideId')
            .isMongoId()
            .withMessage('Invalid ride id')
    ],
    rideController.rejectRide
);

router.post('/cancel',
    authMiddleware.authUser,
    [
        body('rideId')
            .isMongoId()
            .withMessage('Invalid ride id')
    ],
    rideController.cancelRide
);

router.post('/start',
    authMiddleware.authCaptain,
    [
        body('rideId')
            .isMongoId()
            .withMessage('Invalid ride id'),
        body('otp')
            .isString()
            .isLength({ min: 6, max: 6 })
            .withMessage('Invalid OTP')
    ],
    rideController.startRide
);

router.post('/end',
    authMiddleware.authCaptain,
    [
        body('rideId')
            .isMongoId()
            .withMessage('Invalid ride id')
    ],
    rideController.endRide
);

router.post('/confirm-payment',
    authMiddleware.authCaptain,
    [
        body('rideId')
            .isMongoId()
            .withMessage('Invalid ride id'),
        body('paymentMethod')
            .isIn(['cash', 'upi'])
            .withMessage('Invalid payment method')
    ],
    rideController.confirmPayment
);

router.get('/current',
    authMiddleware.authUser,
    rideController.getCurrentUserRide
);

router.get('/current-captain',
    authMiddleware.authCaptain,
    rideController.getCurrentCaptainRide
);

module.exports = router;
