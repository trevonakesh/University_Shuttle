// Single source of truth for public business details.
// Update these values before publishing — especially the ABN.

export const business = {
  name: 'Uni Shuttle',
  legalName: 'Uni Shuttle Pty Ltd',
  tagline: 'Prepaid university bus travel, tracked in real time.',

  // ⚠️ PLACEHOLDER — replace with your registered ABN before submission.
  // The format below is the standard documentation example, not a real ABN.
  abn: '12 345 678 901',

  email: 'hello@unishuttle.com.au',
  supportEmail: 'support@unishuttle.com.au',
  phone: '+61 3 9000 1234',
  phoneHref: '+61390001234',

  address: {
    line1: 'Level 4, 120 Spencer Street',
    suburb: 'Melbourne',
    state: 'VIC',
    postcode: '3000',
    country: 'Australia'
  },

  hours: [
    { days: 'Monday – Friday', time: '7:00 AM – 7:00 PM' },
    { days: 'Saturday', time: '9:00 AM – 1:00 PM' },
    { days: 'Sunday & public holidays', time: 'Closed' }
  ],

  socials: [
    { name: 'Facebook', url: 'https://facebook.com/unishuttle', handle: '/unishuttle' },
    { name: 'Instagram', url: 'https://instagram.com/unishuttle', handle: '@unishuttle' },
    { name: 'LinkedIn', url: 'https://linkedin.com/company/unishuttle', handle: '/company/unishuttle' },
    { name: 'YouTube', url: 'https://youtube.com/@unishuttle', handle: '@unishuttle' }
  ],

  // Map centred on the office address above.
  mapEmbed:
    'https://www.openstreetmap.org/export/embed.html?bbox=144.94%2C-37.822%2C144.968%2C-37.808&layer=mapnik&marker=-37.815%2C144.954',
  mapLink: 'https://www.openstreetmap.org/?mlat=-37.815&mlon=144.954#map=16/-37.815/144.954'
};

export type Plan = {
  id: string;
  name: string;
  price: number;
  unit: string;
  currency: string;
  blurb: string;
  features: string[];
  featured?: boolean;
  savings?: string;
};

// Prices are what the PayPal order is created for.
export const plans: Plan[] = [
  {
    id: 'monthly',
    name: 'Student Monthly Pass',
    price: 39,
    unit: 'per month',
    currency: 'AUD',
    blurb: 'One month of travel on your chosen bus, billed month to month.',
    features: [
      'Reserved seat on one approved bus',
      'Live GPS tracking with arrival times',
      'Daily attendance polls',
      'Digital receipts and payment history',
      'Cancel any time'
    ]
  },
  {
    id: 'semester',
    name: 'Student Semester Pass',
    price: 199,
    unit: 'per semester',
    currency: 'AUD',
    blurb: 'Six months prepaid — our best value for full-time students.',
    features: [
      'Everything in the Monthly Pass',
      'Six months of travel, prepaid',
      'Locked-in fare — no mid-semester increases',
      'Priority seat allocation at semester start',
      'Never risk a late-payment freeze'
    ],
    featured: true,
    savings: 'Save $35 vs monthly'
  },
  {
    id: 'operator',
    name: 'Operator Partner Plan',
    price: 0,
    unit: 'free to join · 10% per fare',
    currency: 'AUD',
    blurb: 'For bus operators. No signup fee — we earn only when you do.',
    features: [
      'Passenger and fare management dashboard',
      'Automatic online fare collection',
      'Cash payments recorded in the same ledger',
      'Wallet with on-demand payouts',
      'Verified operator badge in student search'
    ]
  }
];

export const services = [
  {
    title: 'Monthly Bus Subscriptions',
    audience: 'For students',
    description:
      'Reserve a seat on a verified bus running your route and pay one fixed monthly fare. No cash, no chasing the driver, no surprise price changes mid-semester.',
    points: ['Fixed monthly fare', 'One-tap online renewal', 'Digital receipts']
  },
  {
    title: 'Live Bus Tracking',
    audience: 'For students',
    description:
      'Watch your bus move on the map in real time and see how far away it is, how fast it is travelling, and when it will reach your stop.',
    points: ['Real GPS, updated every few seconds', 'Distance and arrival estimate', 'Private to your bus only']
  },
  {
    title: 'Attendance Polls',
    audience: 'For students & operators',
    description:
      'Drivers ask who is travelling tomorrow, students answer in one tap, and the driver gets a passenger list with pickup points before leaving the depot.',
    points: ['One-tap response', 'Live passenger list', 'Fewer wasted stops']
  },
  {
    title: 'Digital Fare Management',
    audience: 'For operators',
    description:
      'A monthly ledger showing exactly who has paid, who has not, and who is not travelling — replacing notebooks and end-of-month guesswork.',
    points: ['Paid / unpaid / not travelling lists', 'Cash payments recorded too', 'Automatic overdue handling']
  },
  {
    title: 'Online Fare Collection',
    audience: 'For operators',
    description:
      'Students pay by card and the money lands in your wallet automatically, net of our 10% commission. Cash still works and is tracked in the same place.',
    points: ['Card payments settled automatically', 'Net earnings wallet', 'Full transaction history']
  },
  {
    title: 'Operator Verification',
    audience: 'For everyone',
    description:
      'Every operator submits licence, vehicle registration and identity documents, and is reviewed by our team before a single student can book a seat.',
    points: ['Document checks', 'Manual review', 'Verified badge on approval']
  }
];
