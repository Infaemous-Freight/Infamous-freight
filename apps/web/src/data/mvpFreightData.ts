// Seed/demo data shipped to clients. Production builds set
// VITE_ENABLE_DEMO_DATA=false to drop these arrays from the bundle.
// Consumers should fall back to live API responses when the flag is off.
const demoEnabled = import.meta.env.VITE_ENABLE_DEMO_DATA !== 'false';

const _demoShipments = [
  {
    trackingNumber: 'IF-20491',
    customer: 'Summit Retail Group',
    route: 'Chicago, IL → Dallas, TX',
    origin: 'Chicago, IL',
    destination: 'Dallas, TX',
    status: 'In transit',
    pickupDate: 'Apr 29, 2026',
    deliveryDate: 'Apr 30, 2026',
    eta: 'Apr 30, 2026 · 6:30 PM',
    carrier: 'Midwest Linehaul Co.',
    equipment: '53 ft dry van',
    rate: '$3,200',
    notes: 'Driver checked in. Running on schedule with no reported exceptions.',
  },
  {
    trackingNumber: 'IF-20492',
    customer: 'Blue Ridge Foods',
    route: 'Atlanta, GA → Charlotte, NC',
    origin: 'Atlanta, GA',
    destination: 'Charlotte, NC',
    status: 'At pickup',
    pickupDate: 'Apr 29, 2026',
    deliveryDate: 'Apr 29, 2026',
    eta: 'Apr 29, 2026 · 4:00 PM',
    carrier: 'Road Runner Inc.',
    equipment: 'Reefer',
    rate: '$1,850',
    notes: 'Waiting on shipper dock assignment. Temperature requirement confirmed.',
  },
  {
    trackingNumber: 'IF-20493',
    customer: 'Desert Supply Co.',
    route: 'Houston, TX → Phoenix, AZ',
    origin: 'Houston, TX',
    destination: 'Phoenix, AZ',
    status: 'Exception review',
    pickupDate: 'Apr 28, 2026',
    deliveryDate: 'Apr 30, 2026',
    eta: 'Delayed · recovery plan pending',
    carrier: 'Desert Haul Co.',
    equipment: 'Flatbed',
    rate: '$4,100',
    notes: 'Weather delay reported near El Paso. Dispatch should confirm revised ETA and notify customer.',
  },
];

const _demoQuotes = [
  {
    id: 'QR-1182',
    shipper: 'Summit Retail Group',
    lane: 'Chicago, IL → Dallas, TX',
    freight: 'Palletized retail goods',
    equipment: 'Dry van',
    weight: '24,000 lb',
    status: 'Needs review',
    priority: 'High',
  },
  {
    id: 'QR-1183',
    shipper: 'Blue Ridge Foods',
    lane: 'Atlanta, GA → Charlotte, NC',
    freight: 'Refrigerated food product',
    equipment: 'Reefer',
    weight: '18,500 lb',
    status: 'Rate pending',
    priority: 'Medium',
  },
  {
    id: 'QR-1184',
    shipper: 'Keystone Building Supply',
    lane: 'Pittsburgh, PA → Columbus, OH',
    freight: 'Building materials',
    equipment: 'Flatbed',
    weight: '42,000 lb',
    status: 'Ready to book',
    priority: 'High',
  },
];

const _demoCarrierLoads = [
  {
    id: 'AVL-3021',
    lane: 'Memphis, TN → Indianapolis, IN',
    equipment: 'Dry van',
    pickup: 'Apr 30, 2026 · 9:00 AM',
    delivery: 'May 1, 2026 · 10:00 AM',
    pay: '$2,400',
    miles: '465 mi',
  },
  {
    id: 'AVL-3022',
    lane: 'Kansas City, MO → Denver, CO',
    equipment: 'Flatbed',
    pickup: 'May 1, 2026 · 7:00 AM',
    delivery: 'May 2, 2026 · 2:00 PM',
    pay: '$3,650',
    miles: '604 mi',
  },
  {
    id: 'AVL-3023',
    lane: 'Nashville, TN → Orlando, FL',
    equipment: 'Reefer',
    pickup: 'May 1, 2026 · 12:00 PM',
    delivery: 'May 2, 2026 · 8:00 PM',
    pay: '$4,250',
    miles: '690 mi',
  },
];

export const demoShipments = demoEnabled ? _demoShipments : [];
export const demoQuotes = demoEnabled ? _demoQuotes : [];
export const demoCarrierLoads = demoEnabled ? _demoCarrierLoads : [];
