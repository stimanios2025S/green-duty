export type UserRole = 'guest' | 'buyer' | 'seller' | 'driver' | 'business' | 'citizen' | 'agronomist' | 'ngo' | 'corporate' | 'admin' | 'farmer';

/** Account types a new user can register as. */
export type AccountType = 'client' | 'partner';

/**
 * Account types from before the agency pivot. No longer offered at signup,
 * but kept in the type system so accounts already in the database keep
 * resolving to a working portal instead of dead-ending. Once no rows hold
 * these values, this union and the matching nav entries can be deleted.
 */
export type LegacyAccountType = 'guest' | 'buyer' | 'seller' | 'driver' | 'business' | 'farmer';

/** Any account type that can come back from the database. */
export type AnyAccountType = AccountType | LegacyAccountType;

export type SeverityLevel = 'low' | 'moderate' | 'severe' | 'critical';
export type HotspotStatus = 'reported' | 'event_created' | 'in_progress' | 'cleaned' | 'resolved';
export type PostStatus = 'pending' | 'certified' | 'rejected';
export type ProductCategory = 'seeds' | 'fertilizers' | 'irrigation' | 'tools' | 'organic_produce' | 'smart_farming' | 'bio_pesticides' | 'sensors';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type SponsorshipTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type PollutionType = 'plastics' | 'chemical_waste' | 'illegal_dumping' | 'deforestation' | 'water_pollution' | 'air_pollution' | 'soil_contamination' | 'other';
export interface GeoLocation { lat: number; lng: number; address: string; }
export interface CompanyDetails { companyName: string; industry: string; csrBudget: number; website: string; }
export interface BusinessProfile { businessName: string; businessAddress: string; industry?: string; website?: string; licenseNumber?: string; }
export interface User { id: string; name: string; email: string; avatarUrl: string; role: UserRole; accountType?: AnyAccountType; points: number; badges: string[]; joinedAt: string; location?: GeoLocation; companyDetails?: CompanyDetails; businessProfile?: BusinessProfile; username?: string; bio?: string; emoji?: string; gradient?: string; isOwner?: boolean; }
export interface Notification { id: string; userId: string; title: string; message: string; type: 'event' | 'order' | 'post' | 'hotspot' | 'reward' | 'system'; read: boolean; createdAt: string; link?: string; }