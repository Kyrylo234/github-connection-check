import type { AnalyzedNewsEvent, NewsCategory } from "@/types/news";

export const DEMO_SNAPSHOT_AT = "2026-11-15T10:00:00.000Z";
export const DEMO_DATA_LABEL = "DEMO DATA";

interface DemoReport {
  title: string;
  source: string;
}

interface DemoEventSeed {
  id: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  category: NewsCategory;
  sentiment: number;
  severity: number;
  hoursAgo: number;
  reports: DemoReport[];
}

const isoHoursAgo = (hours: number) =>
  new Date(Date.parse(DEMO_SNAPSHOT_AT) - hours * 60 * 60 * 1000).toISOString();

function makeDemoEvent(seed: DemoEventSeed): AnalyzedNewsEvent {
  const occurredAt = isoHoursAgo(seed.hoursAgo);
  const articles = seed.reports.map((report, index) => ({
    id: `${seed.id}-article-${index + 1}`,
    title: report.title,
    source: report.source,
    publishedAt: isoHoursAgo(seed.hoursAgo + index * 2),
    isDemo: true,
  }));

  return {
    id: seed.id,
    location: {
      name: seed.city,
      country: seed.country,
      latitude: seed.latitude,
      longitude: seed.longitude,
    },
    category: seed.category,
    sentiment: seed.sentiment,
    severity: seed.severity,
    occurredAt,
    articles,
    articleCount: articles.length,
    isDemo: true,
  };
}

const seeds: DemoEventSeed[] = [
  {
    id: "demo-01", city: "Bab el-Mandeb", country: "Red Sea", latitude: 12.6, longitude: 43.3,
    category: "Conflict", sentiment: -0.82, severity: 0.88, hoursAgo: 2,
    reports: [
      { title: "Demo shipping operators review Red Sea routes after security warning", source: "World Pulse Demo Wire" },
      { title: "Sample insurers model longer diversions around Bab el-Mandeb", source: "Demo Maritime Desk" },
      { title: "Fictional regional patrols announce a new coordination protocol", source: "Sample Security Monitor" },
    ],
  },
  {
    id: "demo-02", city: "Kyiv", country: "Ukraine", latitude: 50.45, longitude: 30.52,
    category: "Conflict", sentiment: -0.76, severity: 0.84, hoursAgo: 4,
    reports: [
      { title: "Demo authorities report overnight drone interceptions over Kyiv", source: "World Pulse Demo Wire" },
      { title: "Sample engineers assess damage to a fictional power substation", source: "Demo Infrastructure Desk" },
      { title: "Fictional city services outline repairs and emergency timetables", source: "Sample City Bulletin" },
      { title: "Demo analysts map the overnight incident timeline", source: "Demo Analysis Bureau" },
    ],
  },
  {
    id: "demo-03", city: "Port Sudan", country: "Sudan", latitude: 19.62, longitude: 37.22,
    category: "Society", sentiment: -0.71, severity: 0.9, hoursAgo: 7,
    reports: [
      { title: "Demo relief teams request more capacity at Port Sudan shelters", source: "Demo Humanitarian Desk" },
      { title: "Sample agencies coordinate water deliveries for displaced families", source: "World Pulse Demo Wire" },
    ],
  },
  {
    id: "demo-04", city: "Rafah", country: "Gaza", latitude: 31.29, longitude: 34.25,
    category: "Diplomacy", sentiment: 0.24, severity: 0.72, hoursAgo: 10,
    reports: [
      { title: "Demo monitors describe a larger aid convoy crossing at Rafah", source: "Demo Humanitarian Desk" },
      { title: "Sample mediators publish a fictional delivery verification plan", source: "World Pulse Demo Wire" },
      { title: "Demo logistics teams prepare additional medical shipments", source: "Sample Relief Bulletin" },
    ],
  },
  {
    id: "demo-05", city: "Karachi", country: "Pakistan", latitude: 24.86, longitude: 67.01,
    category: "Climate", sentiment: -0.66, severity: 0.76, hoursAgo: 15,
    reports: [
      { title: "Demo heat advisory prompts Karachi to extend cooling-centre hours", source: "Demo Climate Desk" },
      { title: "Sample hospitals rehearse a fictional surge-response plan", source: "World Pulse Demo Wire" },
    ],
  },
  {
    id: "demo-06", city: "Jakarta", country: "Indonesia", latitude: -6.21, longitude: 106.85,
    category: "Climate", sentiment: -0.59, severity: 0.68, hoursAgo: 20,
    reports: [
      { title: "Demo flood sensors trigger neighbourhood alerts across Jakarta", source: "Demo Climate Desk" },
      { title: "Sample response crews clear priority drainage channels", source: "World Pulse Demo Wire" },
    ],
  },
  {
    id: "demo-07", city: "Tokyo", country: "Japan", latitude: 35.68, longitude: 139.69,
    category: "Technology", sentiment: 0.58, severity: 0.22, hoursAgo: 26,
    reports: [
      { title: "Demo robotics consortium opens a shared safety-testing facility in Tokyo", source: "Demo Technology Desk" },
    ],
  },
  {
    id: "demo-08", city: "Seoul", country: "South Korea", latitude: 37.57, longitude: 126.98,
    category: "Economy", sentiment: 0.46, severity: 0.28, hoursAgo: 31,
    reports: [
      { title: "Demo chipmakers announce a fictional recycling partnership in Seoul", source: "Demo Markets Desk" },
      { title: "Sample suppliers forecast lower manufacturing waste", source: "World Pulse Demo Wire" },
    ],
  },
  {
    id: "demo-09", city: "Singapore", country: "Singapore", latitude: 1.35, longitude: 103.82,
    category: "Economy", sentiment: 0.08, severity: 0.31, hoursAgo: 38,
    reports: [
      { title: "Demo port data shows steady container traffic through Singapore", source: "Demo Maritime Desk" },
    ],
  },
  {
    id: "demo-10", city: "Mumbai", country: "India", latitude: 19.08, longitude: 72.88,
    category: "Climate", sentiment: -0.48, severity: 0.61, hoursAgo: 44,
    reports: [
      { title: "Demo monsoon forecast puts Mumbai transport teams on alert", source: "Demo Climate Desk" },
      { title: "Sample commuters advised to expect fictional rail delays", source: "World Pulse Demo Wire" },
    ],
  },
  {
    id: "demo-11", city: "New Delhi", country: "India", latitude: 28.61, longitude: 77.21,
    category: "Health", sentiment: -0.53, severity: 0.58, hoursAgo: 50,
    reports: [
      { title: "Demo air-quality bulletin recommends limits on outdoor activity in Delhi", source: "Demo Health Desk" },
    ],
  },
  {
    id: "demo-12", city: "Beijing", country: "China", latitude: 39.9, longitude: 116.41,
    category: "Technology", sentiment: 0.42, severity: 0.24, hoursAgo: 57,
    reports: [
      { title: "Demo battery researchers publish a longer-life recycling process", source: "Demo Technology Desk" },
      { title: "Sample manufacturers agree to test the fictional process at scale", source: "World Pulse Demo Wire" },
    ],
  },
  {
    id: "demo-13", city: "Sydney", country: "Australia", latitude: -33.87, longitude: 151.21,
    category: "Climate", sentiment: 0.61, severity: 0.25, hoursAgo: 65,
    reports: [
      { title: "Demo renewable microgrid begins a year-long trial near Sydney", source: "Demo Climate Desk" },
      { title: "Sample households join a fictional shared-storage programme", source: "World Pulse Demo Wire" },
    ],
  },
  {
    id: "demo-14", city: "Wellington", country: "New Zealand", latitude: -41.29, longitude: 174.78,
    category: "Society", sentiment: 0.12, severity: 0.36, hoursAgo: 72,
    reports: [
      { title: "Demo earthquake exercise tests Wellington emergency communications", source: "World Pulse Demo Wire" },
    ],
  },
  {
    id: "demo-15", city: "Nairobi", country: "Kenya", latitude: -1.29, longitude: 36.82,
    category: "Diplomacy", sentiment: 0.55, severity: 0.44, hoursAgo: 80,
    reports: [
      { title: "Demo regional delegates agree a fictional water-sharing framework in Nairobi", source: "Demo Diplomacy Desk" },
      { title: "Sample technical teams schedule cross-border monitoring", source: "World Pulse Demo Wire" },
    ],
  },
  {
    id: "demo-16", city: "Lagos", country: "Nigeria", latitude: 6.52, longitude: 3.38,
    category: "Economy", sentiment: 0.39, severity: 0.2, hoursAgo: 91,
    reports: [
      { title: "Demo fintech cooperative expands small-business training in Lagos", source: "Demo Markets Desk" },
    ],
  },
  {
    id: "demo-17", city: "Accra", country: "Ghana", latitude: 5.6, longitude: -0.19,
    category: "Society", sentiment: 0.67, severity: 0.18, hoursAgo: 103,
    reports: [
      { title: "Demo community science programme reaches fifty Accra schools", source: "Demo Society Desk" },
    ],
  },
  {
    id: "demo-18", city: "Cape Town", country: "South Africa", latitude: -33.92, longitude: 18.42,
    category: "Climate", sentiment: -0.62, severity: 0.7, hoursAgo: 116,
    reports: [
      { title: "Demo reservoir outlook triggers water-saving measures in Cape Town", source: "Demo Climate Desk" },
      { title: "Sample utilities publish fictional neighbourhood usage targets", source: "World Pulse Demo Wire" },
    ],
  },
  {
    id: "demo-19", city: "Cairo", country: "Egypt", latitude: 30.04, longitude: 31.24,
    category: "Technology", sentiment: -0.06, severity: 0.33, hoursAgo: 129,
    reports: [
      { title: "Demo grid operators begin scheduled maintenance across Cairo", source: "World Pulse Demo Wire" },
    ],
  },
  {
    id: "demo-20", city: "Casablanca", country: "Morocco", latitude: 33.57, longitude: -7.59,
    category: "Climate", sentiment: 0.52, severity: 0.27, hoursAgo: 142,
    reports: [
      { title: "Demo solar desalination pilot starts operations near Casablanca", source: "Demo Climate Desk" },
      { title: "Sample engineers publish the fictional plant's first output targets", source: "World Pulse Demo Wire" },
    ],
  },
  {
    id: "demo-21", city: "London", country: "United Kingdom", latitude: 51.51, longitude: -0.13,
    category: "Economy", sentiment: 0.04, severity: 0.35, hoursAgo: 156,
    reports: [
      { title: "Demo central-bank scenario leaves London markets little changed", source: "Demo Markets Desk" },
      { title: "Sample analysts describe a wait-and-see fictional outlook", source: "World Pulse Demo Wire" },
    ],
  },
  {
    id: "demo-22", city: "Berlin", country: "Germany", latitude: 52.52, longitude: 13.41,
    category: "Economy", sentiment: -0.34, severity: 0.43, hoursAgo: 171,
    reports: [
      { title: "Demo factory survey points to slower orders around Berlin", source: "Demo Markets Desk" },
    ],
  },
  {
    id: "demo-23", city: "Paris", country: "France", latitude: 48.86, longitude: 2.35,
    category: "Society", sentiment: -0.12, severity: 0.38, hoursAgo: 187,
    reports: [
      { title: "Demo transport unions announce a limited fictional Paris stoppage", source: "Demo Society Desk" },
    ],
  },
  {
    id: "demo-24", city: "Oslo", country: "Norway", latitude: 59.91, longitude: 10.75,
    category: "Climate", sentiment: 0.48, severity: 0.2, hoursAgo: 204,
    reports: [
      { title: "Demo coastal restoration project expands seagrass beds near Oslo", source: "Demo Climate Desk" },
    ],
  },
  {
    id: "demo-25", city: "Reykjavik", country: "Iceland", latitude: 64.15, longitude: -21.94,
    category: "Technology", sentiment: 0.63, severity: 0.19, hoursAgo: 221,
    reports: [
      { title: "Demo geothermal storage pilot exceeds its fictional efficiency target", source: "Demo Technology Desk" },
    ],
  },
  {
    id: "demo-26", city: "Istanbul", country: "Türkiye", latitude: 41.01, longitude: 28.98,
    category: "Diplomacy", sentiment: 0.18, severity: 0.49, hoursAgo: 239,
    reports: [
      { title: "Demo negotiators resume fictional grain-corridor talks in Istanbul", source: "Demo Diplomacy Desk" },
      { title: "Sample delegates agree a technical agenda for the next round", source: "World Pulse Demo Wire" },
    ],
  },
  {
    id: "demo-27", city: "São Paulo", country: "Brazil", latitude: -23.55, longitude: -46.63,
    category: "Climate", sentiment: -0.45, severity: 0.56, hoursAgo: 258,
    reports: [
      { title: "Demo researchers warn of faster forest loss in a fictional monitoring zone", source: "Demo Climate Desk" },
      { title: "Sample São Paulo investors review deforestation safeguards", source: "World Pulse Demo Wire" },
    ],
  },
  {
    id: "demo-28", city: "Buenos Aires", country: "Argentina", latitude: -34.6, longitude: -58.38,
    category: "Economy", sentiment: 0.29, severity: 0.41, hoursAgo: 278,
    reports: [
      { title: "Demo price index shows slower fictional inflation in Buenos Aires", source: "Demo Markets Desk" },
    ],
  },
  {
    id: "demo-29", city: "Santiago", country: "Chile", latitude: -33.45, longitude: -70.67,
    category: "Economy", sentiment: -0.09, severity: 0.3, hoursAgo: 299,
    reports: [
      { title: "Demo lithium producers outline a fictional water-accounting standard in Santiago", source: "Demo Markets Desk" },
    ],
  },
  {
    id: "demo-30", city: "Mexico City", country: "Mexico", latitude: 19.43, longitude: -99.13,
    category: "Climate", sentiment: -0.57, severity: 0.64, hoursAgo: 321,
    reports: [
      { title: "Demo water authority expands leak repairs across Mexico City", source: "Demo Climate Desk" },
      { title: "Sample neighbourhood tanks receive fictional priority deliveries", source: "World Pulse Demo Wire" },
    ],
  },
  {
    id: "demo-31", city: "New York", country: "United States", latitude: 40.71, longitude: -74.01,
    category: "Climate", sentiment: -0.51, severity: 0.66, hoursAgo: 344,
    reports: [
      { title: "Demo coastal storm scenario closes parts of New York harbour", source: "Demo Climate Desk" },
      { title: "Sample transit crews prepare fictional flood barriers", source: "World Pulse Demo Wire" },
    ],
  },
  {
    id: "demo-32", city: "San Francisco", country: "United States", latitude: 37.77, longitude: -122.42,
    category: "Technology", sentiment: 0.44, severity: 0.26, hoursAgo: 368,
    reports: [
      { title: "Demo AI labs publish a shared fictional model-evaluation benchmark", source: "Demo Technology Desk" },
      { title: "Sample universities join an open safety review in San Francisco", source: "World Pulse Demo Wire" },
    ],
  },
  {
    id: "demo-33", city: "Toronto", country: "Canada", latitude: 43.65, longitude: -79.38,
    category: "Health", sentiment: 0.57, severity: 0.23, hoursAgo: 393,
    reports: [
      { title: "Demo clinics report shorter waits after a fictional Toronto scheduling trial", source: "Demo Health Desk" },
    ],
  },
  {
    id: "demo-34", city: "Vancouver", country: "Canada", latitude: 49.28, longitude: -123.12,
    category: "Climate", sentiment: -0.69, severity: 0.73, hoursAgo: 419,
    reports: [
      { title: "Demo wildfire smoke forecast prompts health warnings around Vancouver", source: "Demo Climate Desk" },
      { title: "Sample fire crews reposition fictional aircraft and equipment", source: "World Pulse Demo Wire" },
    ],
  },
  {
    id: "demo-35", city: "Honolulu", country: "United States", latitude: 21.31, longitude: -157.86,
    category: "Climate", sentiment: 0.64, severity: 0.21, hoursAgo: 446,
    reports: [
      { title: "Demo coral nursery records strong growth in a fictional Honolulu restoration trial", source: "Demo Climate Desk" },
    ],
  },
];

export const demoNewsEvents: AnalyzedNewsEvent[] = seeds.map(makeDemoEvent);

export function getPrimaryArticle(event: AnalyzedNewsEvent) {
  const article = event.articles[0];
  if (!article) throw new Error(`Demo event ${event.id} has no primary article`);
  return article;
}
