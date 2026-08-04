export interface InstaUser {
  id: string;
  username: string;
  name: string;
  role: string;
  bio: string;
  emoji: string;
  gradient: string; // tailwind gradient classes
  verified?: boolean;
  followers: number;
  following: number;
}

export interface InstaComment {
  id: string;
  user: InstaUser;
  text: string;
  likes?: number;
}

export interface InstaPost {
  id: string;
  user: InstaUser;
  type: "article" | "video";
  // article
  title?: string;
  excerpt?: string;
  content?: string;
  tags?: string[];
  coverEmoji?: string;
  coverGradient?: string;
  // video
  videoUrl?: string;
  duration?: string;
  views?: number;
  // common
  caption?: string;
  location?: string;
  likes: number;
  likedBy?: string;
  liked?: boolean;
  saved?: boolean;
  comments: InstaComment[];
  createdAt: string;
}

export interface InstaStory {
  id: string;
  user: InstaUser;
  emoji: string;
  gradient: string;
  caption?: string;
  live?: boolean;
  viewed?: boolean;
}

const h = (hours: number) => new Date(Date.now() - hours * 3600 * 1000).toISOString();

export const instaUsers: Record<string, InstaUser> = {
  alex: {
    id: "u1", username: "alex.greenfield", name: "Alex Greenfield", role: "Eco Citizen",
    bio: "🌱 Reporting pollution & planting trees across NYC 🌍",
    emoji: "🌿", gradient: "from-amber-400 to-orange-600", followers: 12400, following: 386, verified: false,
  },
  maria: {
    id: "u2", username: "mariasantos", name: "Maria Santos", role: "Organic Farmer",
    bio: "👩‍🌾 Growing organic tomatoes & herbs · Santos Organic Farm 🌱",
    emoji: "👩‍🌾", gradient: "from-lime-400 to-green-700", followers: 58200, following: 240, verified: true,
  },
  jchen: {
    id: "u3", username: "dr.jchen", name: "Dr. James Chen", role: "Agronomist",
    bio: "🧑‍🔬 Soil scientist · Regenerative agriculture · Certified content",
    emoji: "🧑‍🔬", gradient: "from-teal-400 to-cyan-700", followers: 89400, following: 158, verified: true,
  },
  eco: {
    id: "u4", username: "ecowatch.ngo", name: "EcoWatch NGO", role: "Non-profit",
    bio: "🌍 Protecting the planet · Community cleanups · Join us!",
    emoji: "🌍", gradient: "from-sky-400 to-blue-700", followers: 214000, following: 92, verified: true,
  },
  greenearth: {
    id: "u5", username: "greenearth.corp", name: "GreenEarth Corp", role: "Corporate",
    bio: "🏢 CSR & sustainability · 5,000 trees planted",
    emoji: "🏢", gradient: "from-emerald-500 to-teal-800", followers: 43100, following: 74, verified: true,
  },
  soilhub: {
    id: "u6", username: "soilhub", name: "Soil Hub", role: "Educator",
    bio: "🪱 Composting & soil health · Weekly workshops",
    emoji: "🪱", gradient: "from-amber-500 to-amber-800", followers: 18700, following: 201,
  },
  leila: {
    id: "u7", username: "farmgirl.leila", name: "Leila Benali", role: "Young Farmer",
    bio: "🌻 Hydroponics & urban farming · Algeria 🇩🇿",
    emoji: "🌻", gradient: "from-yellow-400 to-amber-700", followers: 9600, following: 420,
  },
  agritech: {
    id: "u8", username: "agritech.solutions", name: "AgriTech Solutions", role: "B2B Agency",
    bio: "📡 IoT greenhouses & smart irrigation · Engineering for farms",
    emoji: "📡", gradient: "from-orange-400 to-red-700", followers: 33900, following: 66, verified: true,
  },
};

export const SAMPLE_VIDEOS = [
  { label: "Greenhouse Timelapse", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", duration: "9:56" },
  { label: "Farm Drone Footage", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", duration: "10:53" },
  { label: "Irrigation System", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", duration: "0:15" },
  { label: "Harvest Day", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", duration: "0:15" },
];

export const initialStories: InstaStory[] = [
  { id: "s1", user: instaUsers.maria, emoji: "🍅", gradient: "from-red-400 to-rose-700", caption: "Harvest day!" },
  { id: "s2", user: instaUsers.jchen, emoji: "🔬", gradient: "from-teal-400 to-cyan-700", caption: "Soil lab results", live: true },
  { id: "s3", user: instaUsers.eco, emoji: "🧹", gradient: "from-sky-400 to-blue-700", caption: "Beach cleanup" },
  { id: "s4", user: instaUsers.greenearth, emoji: "🌳", gradient: "from-emerald-500 to-teal-800", caption: "Tree planting drive" },
  { id: "s5", user: instaUsers.leila, emoji: "💧", gradient: "from-yellow-400 to-amber-700", caption: "Hydroponics tour", live: true },
  { id: "s6", user: instaUsers.agritech, emoji: "📡", gradient: "from-orange-400 to-red-700", caption: "Smart greenhouse" },
  { id: "s7", user: instaUsers.soilhub, emoji: "🪱", gradient: "from-amber-500 to-amber-800", caption: "Compost 101" },
];

export const initialPosts: InstaPost[] = [
  {
    id: "p1",
    user: instaUsers.maria,
    type: "video",
    videoUrl: SAMPLE_VIDEOS[0].url,
    duration: SAMPLE_VIDEOS[0].duration,
    views: 12400,
    caption: "A full day at Santos Organic Farm 🌱 — from sunrise irrigation to harvesting these beauties 🍅",
    location: "Santos Organic Farm",
    likes: 3210,
    likedBy: "dr.jchen",
    comments: [
      { id: "c1", user: instaUsers.jchen, text: "Your soil moisture levels are textbook! 👏", likes: 48 },
      { id: "c2", user: instaUsers.leila, text: "Goals 😍 the tomatoes look incredible", likes: 12 },
      { id: "c3", user: instaUsers.soilhub, text: "That irrigation setup is clean 🔥", likes: 7 },
    ],
    createdAt: h(2),
  },
  {
    id: "p2",
    user: instaUsers.jchen,
    type: "article",
    title: "5 Principles of Regenerative Agriculture",
    excerpt: "Restore soil health through minimal tillage, cover cropping, crop rotation, composting, and managed grazing.",
    content: "Regenerative agriculture focuses on restoring soil health through minimal tillage, cover cropping, crop rotation, composting, and managed grazing...",
    tags: ["regenerative", "soil-health", "sustainability"],
    coverEmoji: "🌾",
    coverGradient: "from-amber-400 to-orange-700",
    caption: "New certified article! The science behind regenerating our farmland 🌾",
    location: "Agronomy Lab",
    likes: 4820,
    likedBy: "ecowatch.ngo",
    comments: [
      { id: "c4", user: instaUsers.eco, text: "This should be mandatory reading 🙌", likes: 103 },
      { id: "c5", user: instaUsers.leila, text: "Cover cropping changed my farm completely", likes: 21 },
    ],
    createdAt: h(5),
  },
  {
    id: "p3",
    user: instaUsers.eco,
    type: "video",
    videoUrl: SAMPLE_VIDEOS[1].url,
    duration: SAMPLE_VIDEOS[1].duration,
    views: 28400,
    caption: "Drone footage from Sunday's beach cleanup 🧹 2.4 tons of plastic collected 🌊 Thank you volunteers!",
    location: "Coney Island Beach",
    likes: 9210,
    likedBy: "alex.greenfield",
    comments: [
      { id: "c6", user: instaUsers.alex, text: "Proud to be part of this 💚", likes: 34 },
      { id: "c7", user: instaUsers.maria, text: "Incredible work from the community!", likes: 18 },
    ],
    createdAt: h(9),
  },
  {
    id: "p4",
    user: instaUsers.agritech,
    type: "article",
    title: "IoT Greenhouses: The Complete Guide",
    excerpt: "Temperature, humidity, and CO₂ automation with real-time sensor dashboards.",
    content: "Smart greenhouse systems integrate sensors, actuators, and cloud monitoring to maintain optimal growing conditions automatically...",
    tags: ["iot", "greenhouse", "automation"],
    coverEmoji: "📡",
    coverGradient: "from-orange-400 to-red-700",
    caption: "How we build smart greenhouses for farms 📡🌡️",
    location: "AgriTech HQ",
    likes: 2100,
    likedBy: "greenearth.corp",
    comments: [
      { id: "c8", user: instaUsers.greenearth, text: "We use these in our CSR farms!", likes: 9 },
      { id: "c9", user: instaUsers.jchen, text: "The sensor calibration section is gold ⭐", likes: 15 },
    ],
    createdAt: h(14),
  },
  {
    id: "p5",
    user: instaUsers.leila,
    type: "video",
    videoUrl: SAMPLE_VIDEOS[3].url,
    duration: SAMPLE_VIDEOS[3].duration,
    views: 6700,
    caption: "Tour of my urban hydroponics setup 💧 200 plants in 40m² — the future of city farming 🏙️",
    location: "Algiers, DZ",
    likes: 1540,
    likedBy: "soilhub",
    comments: [
      { id: "c10", user: instaUsers.soilhub, text: "The nutrient solution recipe you shared works!", likes: 6 },
      { id: "c11", user: instaUsers.maria, text: "So inspiring for young farmers 🌻", likes: 11 },
    ],
    createdAt: h(20),
  },
  {
    id: "p6",
    user: instaUsers.soilhub,
    type: "article",
    title: "Composting for Small Farms",
    excerpt: "Hot composting, vermicomposting, and bokashi — turn waste into black gold.",
    content: "Composting is the backbone of organic soil management. This guide explores hot composting, vermicomposting, and bokashi methods...",
    tags: ["composting", "organic", "soil"],
    coverEmoji: "🪱",
    coverGradient: "from-amber-500 to-amber-800",
    caption: "Everything I wish I knew about composting 🪱♻️",
    likes: 980,
    likedBy: "dr.jchen",
    comments: [
      { id: "c12", user: instaUsers.jchen, text: "Great C:N ratio guidance!", likes: 4 },
    ],
    createdAt: h(26),
  },
  {
    id: "p7",
    user: instaUsers.greenearth,
    type: "video",
    videoUrl: SAMPLE_VIDEOS[2].url,
    duration: SAMPLE_VIDEOS[2].duration,
    views: 15200,
    caption: "Our CSR team installing smart irrigation at GreenField Acres 💧🌾 #CSR #Sustainability",
    location: "GreenField Acres",
    likes: 3400,
    likedBy: "ecowatch.ngo",
    comments: [
      { id: "c13", user: instaUsers.eco, text: "Love seeing corporates give back 👏", likes: 29 },
    ],
    createdAt: h(30),
  },
  {
    id: "p8",
    user: instaUsers.alex,
    type: "article",
    title: "I Reported 9 Pollution Hotspots This Month",
    excerpt: "A citizen's guide to reporting environmental issues and getting them cleaned up.",
    content: "Every hotspot report triggers a cleanup event with volunteers and sponsors. Here's how the process works and why your voice matters...",
    tags: ["citizen", "eco-map", "pollution"],
    coverEmoji: "🗺️",
    coverGradient: "from-amber-400 to-emerald-700",
    caption: "How you can make a difference from your phone 📱🌍",
    likes: 760,
    likedBy: "ecowatch.ngo",
    comments: [
      { id: "c14", user: instaUsers.eco, text: "You're a legend Alex 💚", likes: 22 },
    ],
    createdAt: h(40),
  },
];

export const suggestions = [
  instaUsers.soilhub,
  instaUsers.leila,
  instaUsers.agritech,
  instaUsers.greenearth,
  instaUsers.jchen,
];

export function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}
