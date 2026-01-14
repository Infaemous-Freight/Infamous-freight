/**
 * Multi-Region Configuration
 * Support for 24 global regions with regional settings
 * @module config/regions
 */

const regionsConfig = {
    defaultRegion: "us-east-1",

    regions: {
        // North America
        "us-east-1": {
            name: "US East (N. Virginia)",
            continent: "North America",
            timezone: "America/New_York",
            coordinates: { lat: 38.1281, lng: -77.3388 },
            dataResidency: "USA",
            gdprCompliant: false,
            primary: true,
        },
        "us-west-1": {
            name: "US West (N. California)",
            continent: "North America",
            timezone: "America/Los_Angeles",
            coordinates: { lat: 37.7749, lng: -122.4194 },
            dataResidency: "USA",
            gdprCompliant: false,
        },
        "us-west-2": {
            name: "US West (Oregon)",
            continent: "North America",
            timezone: "America/Los_Angeles",
            coordinates: { lat: 45.8951, lng: -119.2857 },
            dataResidency: "USA",
            gdprCompliant: false,
        },
        "ca-central-1": {
            name: "Canada (Central)",
            continent: "North America",
            timezone: "America/Toronto",
            coordinates: { lat: 43.6532, lng: -79.3832 },
            dataResidency: "Canada",
            gdprCompliant: false,
        },

        // Europe (GDPR Compliant)
        "eu-west-1": {
            name: "Europe (Ireland)",
            continent: "Europe",
            timezone: "Europe/Dublin",
            coordinates: { lat: 53.3498, lng: -6.2603 },
            dataResidency: "Ireland",
            gdprCompliant: true,
            primary: false,
        },
        "eu-west-2": {
            name: "Europe (London)",
            continent: "Europe",
            timezone: "Europe/London",
            coordinates: { lat: 51.5074, lng: -0.1278 },
            dataResidency: "United Kingdom",
            gdprCompliant: true,
        },
        "eu-west-3": {
            name: "Europe (Paris)",
            continent: "Europe",
            timezone: "Europe/Paris",
            coordinates: { lat: 48.8566, lng: 2.3522 },
            dataResidency: "France",
            gdprCompliant: true,
        },
        "eu-central-1": {
            name: "Europe (Frankfurt)",
            continent: "Europe",
            timezone: "Europe/Berlin",
            coordinates: { lat: 50.1109, lng: 8.6821 },
            dataResidency: "Germany",
            gdprCompliant: true,
        },
        "eu-north-1": {
            name: "Europe (Stockholm)",
            continent: "Europe",
            timezone: "Europe/Stockholm",
            coordinates: { lat: 59.3293, lng: 18.0686 },
            dataResidency: "Sweden",
            gdprCompliant: true,
        },

        // Asia-Pacific
        "ap-northeast-1": {
            name: "Asia Pacific (Tokyo)",
            continent: "Asia",
            timezone: "Asia/Tokyo",
            coordinates: { lat: 35.6762, lng: 139.6503 },
            dataResidency: "Japan",
            gdprCompliant: false,
        },
        "ap-northeast-2": {
            name: "Asia Pacific (Seoul)",
            continent: "Asia",
            timezone: "Asia/Seoul",
            coordinates: { lat: 37.5665, lng: 126.978 },
            dataResidency: "South Korea",
            gdprCompliant: false,
        },
        "ap-southeast-1": {
            name: "Asia Pacific (Singapore)",
            continent: "Asia",
            timezone: "Asia/Singapore",
            coordinates: { lat: 1.3521, lng: 103.8198 },
            dataResidency: "Singapore",
            gdprCompliant: false,
            primary: false,
        },
        "ap-southeast-2": {
            name: "Asia Pacific (Sydney)",
            continent: "Asia",
            timezone: "Australia/Sydney",
            coordinates: { lat: -33.8688, lng: 151.2093 },
            dataResidency: "Australia",
            gdprCompliant: false,
        },
        "ap-south-1": {
            name: "Asia Pacific (Mumbai)",
            continent: "Asia",
            timezone: "Asia/Kolkata",
            coordinates: { lat: 19.076, lng: 72.8777 },
            dataResidency: "India",
            gdprCompliant: false,
        },

        // South America
        "sa-east-1": {
            name: "South America (São Paulo)",
            continent: "South America",
            timezone: "America/Sao_Paulo",
            coordinates: { lat: -23.5505, lng: -46.6333 },
            dataResidency: "Brazil",
            gdprCompliant: false,
            primary: false,
        },

        // Middle East & Africa
        "me-south-1": {
            name: "Middle East (Bahrain)",
            continent: "Middle East",
            timezone: "Asia/Bahrain",
            coordinates: { lat: 26.0667, lng: 50.5577 },
            dataResidency: "Bahrain",
            gdprCompliant: false,
        },
        "af-south-1": {
            name: "Africa (Cape Town)",
            continent: "Africa",
            timezone: "Africa/Johannesburg",
            coordinates: { lat: -33.9249, lng: 18.4241 },
            dataResidency: "South Africa",
            gdprCompliant: false,
        },

        // Additional Asia-Pacific
        "ap-east-1": {
            name: "Asia Pacific (Hong Kong)",
            continent: "Asia",
            timezone: "Asia/Hong_Kong",
            coordinates: { lat: 22.3193, lng: 114.1694 },
            dataResidency: "Hong Kong",
            gdprCompliant: false,
        },
        "cn-north-1": {
            name: "China (Beijing)",
            continent: "Asia",
            timezone: "Asia/Shanghai",
            coordinates: { lat: 39.9042, lng: 116.4074 },
            dataResidency: "China",
            gdprCompliant: false,
        },

        // Additional Europe
        "eu-south-1": {
            name: "Europe (Milan)",
            continent: "Europe",
            timezone: "Europe/Rome",
            coordinates: { lat: 45.4642, lng: 9.1900 },
            dataResidency: "Italy",
            gdprCompliant: true,
        },
    },

    // Get region config
    getRegion: function (regionCode) {
        return this.regions[regionCode] || this.regions[this.defaultRegion];
    },

    // List all regions
    listRegions: function () {
        return Object.keys(this.regions);
    },

    // Get regions by continent
    getByContinent: function (continent) {
        return Object.entries(this.regions)
            .filter(([_, region]) => region.continent === continent)
            .map(([code, region]) => ({ code, ...region }));
    },

    // Get GDPR-compliant regions
    getGdprRegions: function () {
        return Object.entries(this.regions)
            .filter(([_, region]) => region.gdprCompliant)
            .map(([code, region]) => ({ code, ...region }));
    },

    // Find nearest region by coordinates
    findNearestRegion: function (userLat, userLng) {
        let nearest = this.defaultRegion;
        let minDistance = Infinity;

        for (const [code, region] of Object.entries(this.regions)) {
            const distance = Math.sqrt(
                Math.pow(userLat - region.coordinates.lat, 2) +
                Math.pow(userLng - region.coordinates.lng, 2),
            );
            if (distance < minDistance) {
                minDistance = distance;
                nearest = code;
            }
        }

        return nearest;
    },
};

module.exports = regionsConfig;
