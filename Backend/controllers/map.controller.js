const { validationResult } = require('express-validator');
const mapService = require('../services/map.services');

module.exports.getCoordinates = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { address } = req.query;

        const coordinates = await mapService.getCoordinates(address);

        res.status(200).json(coordinates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports.getSuggestions = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { input } = req.query;

        const suggestions = await mapService.getSuggestions(input);

        res.status(200).json(suggestions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports.getDistanceTime = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { origin, destination } = req.query;

        const distanceTime = await mapService.getDistanceTime(origin, destination);

        res.status(200).json(distanceTime);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports.getAddressFromCoordinates = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { lat, lng } = req.query;

        const address = await mapService.getAddressFromCoordinates(lat, lng);

        res.status(200).json(address);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports.getAddress = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { lat, lng } = req.query;

        const result = await mapService.getAddressFromCoordinates(lat, lng);

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};