/**
 * Pricing Engine Service
 * Dynamically calculate freight pricing based on shipment details
 * Supports regional adjustments, bulk discounts, and promotional pricing
 */

const WORLDWIDE_PRICING = require('../data/worldwidePricing');
const PRODUCTS_PRICING = require('../data/productsPricing');
const SUBSCRIPTION_PLANS = require('../data/subscriptionPlans');

class PricingEngine {
    /**
     * Calculate shipment pricing with all factors
     */
    async calculateShipmentPrice(shipmentDetails) {
        const {
            weight = 0,
            distance = 0,
            region = 'US-East',
            serviceLevel = 'standard',
            freightType = 'general',
            hasInsurance = false,
            insuranceValue = 0,
            addOns = [],
            quantity = 1,
            isAnnualCustomer = false,
        } = shipmentDetails;

        try {
            let basePrice = WORLDWIDE_PRICING.perShipment.base.domestic;
            let breakdown = {};

            // 1. Calculate base rate
            const serviceConfig = WORLDWIDE_PRICING.serviceLevels[serviceLevel] ||
                WORLDWIDE_PRICING.serviceLevels.standard;
            basePrice += serviceConfig.surcharge;
            breakdown.serviceLevel = serviceConfig.surcharge;

            // 2. Apply weight-based pricing
            if (weight > 0) {
                const weightRate = this.getWeightRate(weight, region);
                const weightCharge = weight * weightRate.rate;
                basePrice += Math.max(weightCharge, weightRate.min);
                breakdown.weight = weightCharge;
            }

            // 3. Apply distance-based pricing
            if (distance > 0) {
                const distanceRate = this.getDistanceRate(distance);
                const distanceCharge = distance * distanceRate.rate;
                basePrice += Math.max(distanceCharge, distanceRate.min);
                breakdown.distance = distanceCharge;
            }

            // 4. Add freight type surcharges
            const freightConfig = WORLDWIDE_PRICING.freightTypes[freightType] ||
                WORLDWIDE_PRICING.freightTypes.general;
            basePrice += freightConfig.surcharge || 0;
            breakdown.freightType = freightConfig.surcharge || 0;

            // 5. Apply regional multiplier
            const regional = this.getRegionalMultiplier(region);
            basePrice = basePrice * regional.multiplier;
            breakdown.regionalMultiplier = regional.multiplier;
            breakdown.currency = regional.currency;

            // 6. Add optional services
            const addOnsTotal = this.calculateAddOns(addOns, insuranceValue);
            basePrice += addOnsTotal.total;
            breakdown.addOns = addOnsTotal.breakdown;

            // 7. Apply insurance if enabled
            if (hasInsurance && insuranceValue > 0) {
                const insurance = insuranceValue * WORLDWIDE_PRICING.addOns.insurance.percent / 100;
                basePrice += Math.max(insurance, WORLDWIDE_PRICING.addOns.insurance.minCharge);
                breakdown.insurance = insurance;
            }

            // 8. Apply bulk discounts
            if (quantity > 1) {
                const discountRate = this.getBulkDiscount(quantity);
                const discount = basePrice * discountRate;
                breakdown.bulkDiscount = -discount;
                basePrice -= discount;
            }

            // 9. Apply annual customer discount
            if (isAnnualCustomer) {
                const annualDiscount = basePrice * 0.10; // 10% for annual customers
                breakdown.annualCustomerDiscount = -annualDiscount;
                basePrice -= annualDiscount;
            }

            return {
                success: true,
                basePrice: parseFloat(basePrice.toFixed(2)),
                breakdown,
                currency: breakdown.currency || 'USD',
                pricePerUnit: parseFloat((basePrice / quantity).toFixed(2)),
                totalQuantity: quantity,
                totalPrice: parseFloat((basePrice * quantity).toFixed(2)),
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Get weight-based rate
     */
    getWeightRate(weight, region) {
        let rates = WORLDWIDE_PRICING.perShipment.byWeight.local;

        if (region && region.includes('international')) {
            rates = WORLDWIDE_PRICING.perShipment.byWeight.international;
        } else if (region && region.includes('regional')) {
            rates = WORLDWIDE_PRICING.perShipment.byWeight.regional;
        }

        return {
            rate: rates.base,
            min: rates.min,
        };
    }

    /**
     * Get distance-based rate
     */
    getDistanceRate(distance) {
        if (distance <= 50) {
            return {
                rate: WORLDWIDE_PRICING.perShipment.byDistance.local.base,
                min: WORLDWIDE_PRICING.perShipment.byDistance.local.min,
            };
        } else if (distance <= 500) {
            return {
                rate: WORLDWIDE_PRICING.perShipment.byDistance.regional.base,
                min: WORLDWIDE_PRICING.perShipment.byDistance.regional.min,
            };
        } else {
            return {
                rate: WORLDWIDE_PRICING.perShipment.byDistance.longHaul.base,
                min: WORLDWIDE_PRICING.perShipment.byDistance.longHaul.min,
            };
        }
    }

    /**
     * Get regional multiplier and currency
     */
    getRegionalMultiplier(region) {
        const config = WORLDWIDE_PRICING.regionalAdjustments[region];
        if (!config) {
            return WORLDWIDE_PRICING.regionalAdjustments['US-East'];
        }
        return config;
    }

    /**
     * Calculate add-ons total
     */
    calculateAddOns(addOnsList, shipmentValue) {
        let total = 0;
        const breakdown = {};

        addOnsList.forEach((addOn) => {
            const config = WORLDWIDE_PRICING.addOns[addOn];
            if (config) {
                breakdown[addOn] = config.price || 0;
                total += config.price || 0;
            }
        });

        return { total, breakdown };
    }

    /**
     * Get bulk discount percentage
     */
    getBulkDiscount(quantity) {
        if (quantity < 10) return 0;
        if (quantity < 50) return 0.05;
        if (quantity < 100) return 0.10;
        if (quantity < 500) return 0.15;
        if (quantity < 1000) return 0.20;
        return 0.25;
    }

    /**
     * Calculate subscription plan pricing for region
     */
    calculateSubscriptionPrice(plan, region = 'US-East', billingCycle = 'monthly') {
        const planConfig = SUBSCRIPTION_PLANS[plan];
        if (!planConfig) return null;

        const regional = this.getRegionalMultiplier(region);
        const price = billingCycle === 'annual'
            ? (planConfig.annualPrice || planConfig.price * 12)
            : planConfig.price;

        const adjustedPrice = price * (regional.multiplier || 1);
        const currencyRate = WORLDWIDE_PRICING.exchangeRates[regional.currency] || 1;

        return {
            plan: planConfig.name,
            basePrice: price,
            regional: planConfig,
            adjustedPrice: parseFloat(adjustedPrice.toFixed(2)),
            currency: regional.currency,
            inLocalCurrency: parseFloat((adjustedPrice / currencyRate).toFixed(2)),
            billingCycle,
            features: planConfig.features,
        };
    }

    /**
     * Convert price between currencies
     */
    convertCurrency(amount, fromCurrency = 'USD', toCurrency = 'USD') {
        const fromRate = WORLDWIDE_PRICING.exchangeRates[fromCurrency] || 1;
        const toRate = WORLDWIDE_PRICING.exchangeRates[toCurrency] || 1;

        const usdAmount = amount / fromRate;
        const convertedAmount = usdAmount * toRate;

        return parseFloat(convertedAmount.toFixed(2));
    }

    /**
     * Get pricing for specific product/service
     */
    getPricingForProduct(productId) {
        // Search through all product categories
        for (const category in PRODUCTS_PRICING) {
            for (const product in PRODUCTS_PRICING[category]) {
                if (PRODUCTS_PRICING[category][product].id === productId) {
                    return PRODUCTS_PRICING[category][product];
                }
            }
        }
        return null;
    }

    /**
     * Calculate promotional pricing
     */
    calculatePromotionalPrice(basePrice, promoCode) {
        const promo = WORLDWIDE_PRICING.promotions[promoCode];
        if (!promo) return basePrice;

        const discount = basePrice * promo.discount;
        return parseFloat((basePrice - discount).toFixed(2));
    }

    /**
     * Get all subscription plans for a region
     */
    getAllSubscriptionPlans(region = 'US-East') {
        const plans = {};

        for (const planKey in SUBSCRIPTION_PLANS) {
            plans[planKey] = this.calculateSubscriptionPrice(
                planKey,
                region,
                'monthly'
            );
        }

        return plans;
    }

    /**
     * Estimate cost for shipment (quick estimate)
     */
    quickEstimate(weight, distance, region = 'US-East') {
        let estimate = 2.50; // Base

        // Weight estimate
        if (weight > 0) {
            estimate += weight * 0.10; // Simplified per kg
        }

        // Distance estimate
        if (distance > 0) {
            estimate += distance * 0.05; // Simplified per km
        }

        // Regional adjustment
        const regional = this.getRegionalMultiplier(region);
        estimate = estimate * regional.multiplier;

        return {
            estimate: parseFloat(estimate.toFixed(2)),
            currency: regional.currency,
            range: {
                min: parseFloat((estimate * 0.9).toFixed(2)),
                max: parseFloat((estimate * 1.2).toFixed(2)),
            },
            note: 'This is an estimate. Final price may vary.',
        };
    }
}

module.exports = new PricingEngine();
