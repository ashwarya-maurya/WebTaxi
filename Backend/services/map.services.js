const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const OSRM_BASE_URL = 'https://router.project-osrm.org';

const getHeaders = () => ({
    'User-Agent': process.env.NOMINATIM_USER_AGENT || 'RideBookingBackend/1.0',
    'Accept': 'application/json'
});

const createMapError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const isValidCoordinates = (coordinates) => (
    Number.isFinite(Number(coordinates?.lat)) &&
    Number.isFinite(Number(coordinates?.lng)) &&
    Number(coordinates.lat) >= -90 && Number(coordinates.lat) <= 90 &&
    Number(coordinates.lng) >= -180 && Number(coordinates.lng) <= 180
);

const normalizeCoordinates = (coordinates) => ({
    lat: Number(coordinates.lat),
    lng: Number(coordinates.lng)
});

const fetchJson = async (url, options = {}, failureMessage) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        if (response.status === 429) {
            throw createMapError('Map service is busy. Try again shortly.', 503);
        }

        let data;

        try {
            data = await response.json();
        } catch (error) {
            throw createMapError(failureMessage, 502);
        }

        if (!response.ok) {
            if (data?.code === 'NoRoute' || data?.code === 'NoSegment') {
                throw createMapError('One of these locations is not reachable by road. Try a nearby location.', 422);
            }

            throw createMapError(failureMessage, 502);
        }

        return data;
    } catch (error) {
        if (error.statusCode) {
            throw error;
        }

        if (error.name === 'AbortError') {
            throw createMapError('Map service timed out. Try again.', 504);
        }

        throw createMapError(failureMessage, 502);
    } finally {
        clearTimeout(timeoutId);
    }
};

module.exports.getCoordinates = async (address) => {
    if (!address) {
        throw new Error('Address is required');
    }

    const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(address)}&limit=1`;

    const data = await fetchJson(
        url,
        { headers: getHeaders() },
        'Unable to fetch coordinates'
    );

    if (!data || data.length === 0) {
        throw createMapError('No coordinates found for this address', 422);
    }

    return {
        lat: Number(data[0].lat),
        lng: Number(data[0].lon),
        displayName: data[0].display_name
    };
};

module.exports.getSuggestions = async (input) => {
    if (!input) {
        throw new Error('Input is required');
    }

    const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(input)}&addressdetails=1&limit=5`;

    const response = await fetch(url, {
        headers: getHeaders()
    });

    if (!response.ok) {
        throw new Error('Unable to fetch suggestions');
    }

    const data = await response.json();

    return data.map((place) => ({
        placeId: place.place_id,
        displayName: place.display_name,
        lat: Number(place.lat),
        lng: Number(place.lon),
        type: place.type,
        category: place.class
    }));
};

module.exports.getDistanceTime = async (
    origin,
    destination,
    providedOriginCoordinates = null,
    providedDestinationCoordinates = null
) => {
    if (!origin || !destination) {
        throw createMapError('Origin and destination are required', 400);
    }

    const originCoordinates = isValidCoordinates(providedOriginCoordinates)
        ? normalizeCoordinates(providedOriginCoordinates)
        : await module.exports.getCoordinates(origin);
    const destinationCoordinates = isValidCoordinates(providedDestinationCoordinates)
        ? normalizeCoordinates(providedDestinationCoordinates)
        : await module.exports.getCoordinates(destination);

    const coordinates = `${originCoordinates.lng},${originCoordinates.lat};${destinationCoordinates.lng},${destinationCoordinates.lat}`;
    const url = `${OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=false`;

    const data = await fetchJson(
        url,
        {},
        'Unable to calculate distance and duration'
    );

    if (data.code === 'NoRoute' || data.code === 'NoSegment') {
        throw createMapError('One of these locations is not reachable by road. Try a nearby location.', 422);
    }

    if (data.code !== 'Ok') {
        throw createMapError('Unable to calculate distance and duration', 502);
    }

    if (!data.routes || data.routes.length === 0) {
        throw createMapError('No route found between origin and destination', 422);
    }

    const route = data.routes[0];

    return {
        distance: route.distance,
        duration: route.duration,
        origin: originCoordinates,
        destination: destinationCoordinates
    };
};

module.exports.getAddressFromCoordinates = async (lat, lng) => {
    if (!lat || !lng) {
        throw new Error('Latitude and longitude are required');
    }

    const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;

    const response = await fetch(url, {
        headers: getHeaders()
    });

    if (!response.ok) {
        throw new Error('Unable to fetch address');
    }

    const data = await response.json();

    if (!data || !data.display_name) {
        throw new Error('No address found for these coordinates');
    }

    return {
        address: data.display_name
    };
};
