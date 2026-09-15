const captainModel = require('../models/captain.models');

module.exports.createCaptain = async ({
    firstname,lastname,email,password,color,plate,capacity,vehicleType
})=>{
    if(!firstname || !email || !password || !color || !plate || !capacity || !vehicleType){
        throw new Error('All fields are required')
    }

    const captain = await captainModel.create({
        fullname:{
            firstname,
            lastname
        },
        email,
        password,
        vehicle:{
            color,
            plate,
            capacity,
            vehicleType
        }
    })
    return captain
}

module.exports.findCaptain = async ({email})=>{
    return await captainModel.findOne({email}).select('+password')
}

const getDistanceInKm = (lat1, lng1, lat2, lng2) => {
    const earthRadiusKm = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
};

module.exports.getCaptainsInRadius = async ({
    lat,
    lng,
    radius = 5,
    vehicleType
}) => {
    const normalizedLat = Number(lat);
    const normalizedLng = Number(lng);
    const normalizedRadius = Number(radius);

    if (
        !Number.isFinite(normalizedLat) ||
        !Number.isFinite(normalizedLng) ||
        normalizedLat < -90 ||
        normalizedLat > 90 ||
        normalizedLng < -180 ||
        normalizedLng > 180 ||
        !Number.isFinite(normalizedRadius) ||
        normalizedRadius <= 0 ||
        !vehicleType
    ) {
        throw new Error('Latitude, longitude and vehicle type are required');
    }

    const captains = await captainModel.find({
        status: 'active',
        socketId: { $type: 'string', $ne: '' },
        'vehicle.vehicleType': vehicleType,
        'location.lat': { $type: 'number' },
        'location.lng': { $type: 'number' }
    });

    return captains.filter((captain) => {
        if (!Number.isFinite(captain.location.lat) || !Number.isFinite(captain.location.lng)) {
            return false;
        }

        const distance = getDistanceInKm(
            normalizedLat,
            normalizedLng,
            captain.location.lat,
            captain.location.lng
        );

        return distance <= normalizedRadius;
    });
};
