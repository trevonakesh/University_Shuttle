// Single source of truth for public business details shown on the website.
// ⚠️ PLACEHOLDER contact details — replace email, phone and address with
// real ones before the site goes live.

export const business = {
  name: 'UniShuttle',
  tagline: 'University bus travel in Sri Lanka, organised in one app.',

  email: 'hello@unishuttle.example',
  phone: '+94 11 000 0000',
  phoneHref: '+94110000000',

  address: {
    line1: 'No. 00, Example Road',
    city: 'Colombo 07',
    country: 'Sri Lanka'
  },

  hours: [
    { days: 'Monday – Friday', time: '8:30 AM – 5:00 PM' },
    { days: 'Saturday', time: '9:00 AM – 1:00 PM' },
    { days: 'Sunday & public holidays', time: 'Closed' }
  ]
};

// Platform rules, mirrored from the backend so the site never drifts from
// what the apps actually do (see backend/src/utils/time.ts and paymentController.ts).
export const rules = {
  fareDueDay: 10,        // FREEZE_DAY
  reminderFromDay: 8,    // REMINDER_DAY
  commissionPercent: 10  // COMMISSION_RATE
};
