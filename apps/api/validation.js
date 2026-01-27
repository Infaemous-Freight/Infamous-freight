// api/validation.js - Input Validation Module
function validateShipment(data) {
    const errors = [];

    // Tracking number
    if (!data.trackingNumber || typeof data.trackingNumber !== 'string') {
        errors.push('Tracking number is required and must be a string');
    } else if (data.trackingNumber.length < 5 || data.trackingNumber.length > 50) {
        errors.push('Tracking number must be between 5 and 50 characters');
    } else if (!/^[A-Z0-9\-]+$/.test(data.trackingNumber)) {
        errors.push('Tracking number can only contain uppercase letters, numbers, and hyphens');
    }

    // Status
    const validStatuses = ['PENDING', 'IN_TRANSIT', 'DELIVERED'];
    if (data.status && !validStatuses.includes(data.status)) {
        errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    // Origin
    if (!data.origin || typeof data.origin !== 'string') {
        errors.push('Origin is required and must be a string');
    } else if (data.origin.length < 2 || data.origin.length > 100) {
        errors.push('Origin must be between 2 and 100 characters');
    }

    // Destination
    if (!data.destination || typeof data.destination !== 'string') {
        errors.push('Destination is required and must be a string');
    } else if (data.destination.length < 2 || data.destination.length > 100) {
        errors.push('Destination must be between 2 and 100 characters');
    }

    return errors;
}

function sanitize(str) {
    return String(str)
        .trim()
        .replace(/[<>]/g, '')
        .substring(0, 1000);
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

module.exports = { validateShipment, sanitize, validateEmail };
