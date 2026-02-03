import { z } from "zod";

// Validate environment variables at application startup
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  // Optional: Admin password for seed (ONLY for development)
  ADMIN_PASSWORD: z.string().optional(),
  // Optional: Test user password for seed (ONLY for development)
  TEST_USER_PASSWORD: z.string().optional(),
  // Razorpay configuration (optional - required for payment processing)
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  // Shiprocket configuration (optional - required for logistics)
  SHIPROCKET_EMAIL: z.string().optional(),
  SHIPROCKET_PASSWORD: z.string().optional(),
  SHIPROCKET_BASE_URL: z.string().optional(),
  SHIPROCKET_PICKUP_NAME: z.string().optional(),
  SHIPROCKET_PICKUP_PHONE: z.string().optional(),
  SHIPROCKET_PICKUP_EMAIL: z.string().optional(),
  SHIPROCKET_PICKUP_ADDRESS: z.string().optional(),
  SHIPROCKET_PICKUP_ADDRESS_LINE2: z.string().optional(),
  SHIPROCKET_PICKUP_CITY: z.string().optional(),
  SHIPROCKET_PICKUP_STATE: z.string().optional(),
  SHIPROCKET_PICKUP_COUNTRY: z.string().optional(),
  SHIPROCKET_PICKUP_PINCODE: z.string().optional(),
  // Google OAuth configuration (optional - required for Google login)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
});

export const env = envSchema.parse(process.env);

