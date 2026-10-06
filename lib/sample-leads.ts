/**
 * Illustrative example leads for the public showcase pages.
 *
 * These are fictional examples that show prospects what a LeadVault lead
 * looks like. They are NOT real opportunities — never present them as such.
 */

export type SampleLead = {
  id: string;
  title: string;
  category: string;
  buyPrice: number;
  buySource: string;
  sellPrice: number;
  sellSource: string;
  publishedLabel: string;
  seatsTaken: number;
  seatsTotal: number;
  note: string;
};

export const SAMPLE_LEADS: SampleLead[] = [
  {
    id: 'sample-1',
    title: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones (Black)',
    category: 'Electronics',
    buyPrice: 248.0,
    buySource: 'Walmart',
    sellPrice: 348.0,
    sellSource: 'Amazon',
    publishedLabel: '2 days ago',
    seatsTaken: 5,
    seatsTotal: 5,
    note: 'Clearance pricing at a regional store — verified in stock at time of vetting.',
  },
  {
    id: 'sample-2',
    title: 'KitchenAid Artisan 5-Quart Stand Mixer (Empire Red)',
    category: 'Home & Kitchen',
    buyPrice: 329.99,
    buySource: 'Target',
    sellPrice: 459.0,
    sellSource: 'Amazon',
    publishedLabel: '4 days ago',
    seatsTaken: 3,
    seatsTotal: 5,
    note: 'Seasonal promotion stacked with a registry-completion discount.',
  },
  {
    id: 'sample-3',
    title: 'LEGO Star Wars Millennium Falcon 75192 (UCS)',
    category: 'Toys & Games',
    buyPrice: 679.99,
    buySource: 'Costco',
    sellPrice: 849.99,
    sellSource: 'Walmart Marketplace',
    publishedLabel: '1 week ago',
    seatsTaken: 5,
    seatsTotal: 5,
    note: 'Warehouse club exclusive bundle — margin verified after fees.',
  },
];
