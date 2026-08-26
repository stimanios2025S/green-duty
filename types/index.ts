export type UserRole = 'guest' | 'buyer' | 'seller' | 'driver' | 'business' | 'citizen' | 'farmer' | 'agronomist' | 'ngo' | 'corporate' | 'admin';
export type AccountType = 'guest' | 'buyer' | 'seller' | 'driver' | 'business' | 'farmer';
export type SeverityLevel = 'low' | 'moderate' | 'severe' | 'critical';
export type HotspotStatus = 'reported' | 'event_created' | 'in_progress' | 'cleaned' | 'resolved';
export type PostStatus = 'pending' | 'certified' | 'rejected';
export type ProductCategory = 'seeds' | 'fertilizers' | 'irrigation' | 'tools' | 'organic_produce' | 'smart_farming' | 'bio_pesticides' | 'sensors';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type SponsorshipTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type PollutionType = 'plastics' | 'chemical_waste' | 'illegal_dumping' | 'deforestation' | 'water_pollution' | 'air_pollution' | 'soil_contamination' | 'other';
export interface GeoLocation { lat: number; lng: number; address: string; }
export interface FarmDetails { farmName: string; size: number; crops: string[]; certifications: string[]; }
export interface CompanyDetails { companyName: string; industry: string; csrBudget: number; website: string; }
export interface BusinessProfile { businessName: string; businessAddress: string; industry?: string; website?: string; licenseNumber?: string; }
export interface IdDocument { type: 'identity_card' | 'drivers_license' | 'passport'; number: string; }
export interface User { id: string; name: string; email: string; avatarUrl: string; role: UserRole; accountType?: AccountType; points: number; badges: string[]; joinedAt: string; location?: GeoLocation; farmDetails?: FarmDetails; companyDetails?: CompanyDetails; businessProfile?: BusinessProfile; idDocument?: IdDocument; username?: string; bio?: string; emoji?: string; gradient?: string; }
export interface HotspotReport { id: string; title: string; description: string; location: GeoLocation; severity: SeverityLevel; status: HotspotStatus; imageUrl: string; reporterId: string; reporterName: string; pollutionType: PollutionType; createdAt: string; updatedAt: string; upvotes: number; }
export interface CleanupEvent { id: string; title: string; description: string; hotspotId: string; location: GeoLocation; date: string; volunteerCount: number; maxVolunteers: number; sponsorId?: string; sponsorName?: string; rewardPoints: number; status: 'upcoming' | 'ongoing' | 'completed'; imageUrl: string; treeCount: number; }
export interface Product { id: string; name: string; description: string; category: ProductCategory; price: number; currency: string; stock: number; qualityCertified: boolean; organicCertified: boolean; sellerId: string; sellerName: string; sellerVerified: boolean; imageUrl?: string; images: string[]; rating: number; reviewCount: number; warrantyMonths: number; createdAt: string; features: string[]; }
export interface Order { id: string; productId: string; productName: string; buyerId: string; sellerId: string; quantity: number; totalPrice: number; status: OrderStatus; warrantyExpiry: string; createdAt: string; }
export interface EducationalPost { id: string; title: string; content: string; excerpt: string; status: PostStatus; authorId: string; authorName: string; authorRole: UserRole; reviewerId?: string; reviewerName?: string; tags: string[]; imageUrl?: string; sourceVerified: boolean; createdAt: string; reviewedAt?: string; likes: number; comments: number; }
export interface FarmTelemetry { id: string; farmId: string; farmName: string; soilMoisture: number; temperature: number; humidity: number; irrigationStatus: 'on' | 'off' | 'scheduled'; waterFlowRate: number; lastWatered: string; nextSchedule: string; pumpStatus: 'running' | 'idle' | 'maintenance'; ph: number; nutrientLevel: number; lastUpdated: string; }
export interface Sponsor { id: string; name: string; logoUrl: string; tier: SponsorshipTier; totalSponsored: number; eventsSponsored: number; treesPlanted: number; }
export interface LeaderboardEntry { userId: string; userName: string; avatarUrl: string; points: number; eventsAttended: number; hotspotsReported: number; rank: number; }
export interface B2BService { id: string; name: string; description: string; category: 'web_dev' | 'iot' | 'dashboard' | 'consulting' | 'automation'; priceRange: string; deliveryTime: string; features: string[]; icon: string; }
export interface Notification { id: string; userId: string; title: string; message: string; type: 'event' | 'order' | 'post' | 'hotspot' | 'reward' | 'system'; read: boolean; createdAt: string; link?: string; }
export interface PlatformStats { treesPlanted: number; hotspotsCleaned: number; activeFarmers: number; co2Offset: number; waterSaved: number; eventsHosted: number; certifiedPosts: number; productsSold: number; }
export interface MapPin { id: string; lat: number; lng: number; severity: SeverityLevel; title: string; pollutionType: PollutionType; status: HotspotStatus; }
export interface CartItem { product: Product; quantity: number; }

/* ═══════════════════════════════════════════════════════
 *  Farmer CRM Types
 * ═══════════════════════════════════════════════════════ */

export type LedgerEntryType = 'income' | 'expense';
export type LedgerCategory =
  | 'harvest_sale' | 'wholesale' | 'subsidy' | 'other_income'
  | 'diesel' | 'labor' | 'seeds' | 'fertilizer' | 'pesticide' | 'equipment' | 'irrigation' | 'transport' | 'other_expense';
export type DebtStatus = 'pending' | 'partial' | 'paid';
export type DebtParty = 'supplier' | 'buyer';
export type InventoryCategory = 'fertilizer' | 'pesticide' | 'seed' | 'fuel' | 'equipment' | 'other';
export type InventoryUnit = 'kg' | 'quintal' | 'liter' | 'bag' | 'sack' | 'unit' | 'hectare';

export interface LedgerEntry {
  id: string;
  user_id: string;
  type: LedgerEntryType;
  category: LedgerCategory;
  amount: number;
  description: string;
  date: string;
  debt_id?: string;
  created_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  party_type: DebtParty;
  party_name: string;
  amount: number;
  paid: number;
  status: DebtStatus;
  description: string;
  due_date?: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: InventoryUnit;
  low_threshold: number;
  crop_batch_id?: string;
  created_at: string;
}

export interface InventoryTransaction {
  id: string;
  item_id: string;
  user_id: string;
  delta: number;
  reason: string;
  date: string;
  created_at: string;
}

export interface CropBatch {
  id: string;
  user_id: string;
  name: string;
  crop_type: string;
  area_hectares: number;
  planted_date: string;
  expected_harvest_date?: string;
  status: 'growing' | 'harvested' | 'failed';
  notes?: string;
  created_at: string;
}

export interface HarvestLog {
  id: string;
  batch_id: string;
  user_id: string;
  date: string;
  yield_kg: number;
  price_per_kg: number;
  sold_to?: string;
  revenue: number;
  notes?: string;
  created_at: string;
}

export interface FarmerPnL {
  total_income: number;
  total_expenses: number;
  net_profit: number;
  roi: number;
  period: string;
}
