import { z } from 'zod';

export const hotspotReportSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Please provide a detailed description').max(1000),
  pollutionType: z.enum(['plastics','chemical_waste','illegal_dumping','deforestation','water_pollution','air_pollution','soil_contamination','other']),
  severity: z.enum(['low','moderate','severe','critical']),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().min(5),
});

export const productListingSchema = z.object({
  name: z.string().min(3).max(150),
  description: z.string().min(20).max(2000),
  category: z.enum(['seeds','fertilizers','irrigation','tools','organic_produce','smart_farming','bio_pesticides','sensors']),
  price: z.number().positive(),
  stock: z.number().int().positive(),
  qualityCertified: z.boolean(),
  organicCertified: z.boolean(),
  warrantyMonths: z.number().int().min(0).max(120),
  features: z.array(z.string()).min(1),
});

export const educationalPostSchema = z.object({
  title: z.string().min(10).max(200),
  content: z.string().min(100).max(10000),
  tags: z.array(z.string()).min(1).max(5),
  sourceVerified: z.boolean(),
  imageUrl: z.string().optional().or(z.literal('')),
});

export const cleanupEventSchema = z.object({
  title: z.string().min(5).max(150),
  description: z.string().min(20).max(2000),
  date: z.string().min(1, 'Date is required'),
  maxVolunteers: z.number().int().min(5).max(500),
  rewardPoints: z.number().int().min(0),
});

export const b2bBookingSchema = z.object({
  serviceId: z.string().min(1),
  companyName: z.string().min(2).max(100),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(7).max(20),
  projectDescription: z.string().min(50).max(5000),
  budget: z.string().min(1),
  timeline: z.string().min(1),
});

export const donationSchema = z.object({
  amount: z.number().positive(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().max(500).optional(),
  anonymous: z.boolean().default(false),
  corporateMatch: z.boolean().default(false),
});

export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  accountType: z.enum(['guest', 'buyer', 'seller', 'driver', 'business', 'farmer']),
  businessName: z.string().max(200).optional(),
  businessAddress: z.string().max(300).optional(),
  idType: z.string().max(50).optional(),
  idNumber: z.string().max(100).optional(),
});

export const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    productName: z.string().min(1),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })).min(1).optional(),
  productId: z.string().min(1).optional(),
  productName: z.string().min(1).optional(),
  quantity: z.number().int().positive().optional(),
  totalPrice: z.number().positive().optional(),
  paymentMethod: z.string().max(50).optional(),
  deliveryAddress: z.string().max(500).optional(),
}).refine(d => d.items || d.productId, { message: "Provide items array or single product" });

export type HotspotFormData = z.infer<typeof hotspotReportSchema>;
export type ProductFormData = z.infer<typeof productListingSchema>;
export type EducationalPostFormData = z.infer<typeof educationalPostSchema>;
export type CleanupEventFormData = z.infer<typeof cleanupEventSchema>;
export type B2BBookingFormData = z.infer<typeof b2bBookingSchema>;
export type DonationFormData = z.infer<typeof donationSchema>;
