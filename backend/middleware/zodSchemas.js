const { z } = require('zod');

// 1. Auth Schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address format.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters long.'),
  roomNumber: z.string().min(1, 'Room number is required.'),
  phoneNumber: z.string().optional(),
  pdpaConsent: z.boolean().refine(val => val === true, 'PDPA consent is required.')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address format.'),
  password: z.string().min(1, 'Password is required.')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address format.')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long.')
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required.')
});

const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address format.')
});

// 2. Profile Schemas
const profileUpdateSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters long.').optional(),
  roomNumber: z.string().min(1, 'Room number is required.').optional(),
  phoneNumber: z.string().optional()
});

// 3. Listing Schemas
const listingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long.'),
  description: z.string().min(5, 'Description must be at least 5 characters long.'),
  price: z.union([z.number(), z.string()]).transform(val => {
    const num = parseFloat(val);
    if (isNaN(num)) throw new Error('Price must be a valid number.');
    return num;
  }),
  category: z.string().min(1, 'Category is required.'),
  images: z.array(z.string().url('Invalid image URL format.')).optional(),
  legalAffirmation: z.boolean().refine(val => val === true, 'Legal certification is required.')
});

const listingUpdateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long.').optional(),
  description: z.string().min(5, 'Description must be at least 5 characters long.').optional(),
  price: z.union([z.number(), z.string()]).transform(val => {
    const num = parseFloat(val);
    if (isNaN(num)) throw new Error('Price must be a valid number.');
    return num;
  }).optional(),
  category: z.string().optional(),
  images: z.array(z.string().url('Invalid image URL format.')).optional()
});

// 4. Review Schemas
const reviewSchema = z.object({
  sellerId: z.string().uuid('Invalid Seller ID format.'),
  rating: z.number().int().min(1, 'Rating must be at least 1.').max(5, 'Rating cannot exceed 5.'),
  reviewText: z.string().max(500, 'Review cannot exceed 500 characters.').optional()
});

// 5. Verification Schemas
const sellerVerifySchema = z.object({
  shopName: z.string().min(2, 'Shop name must be at least 2 characters long.'),
  idCardUrl: z.string().url('Invalid ID card document URL.').optional(),
  proofOfResidencyUrl: z.string().url('Invalid proof of residency document URL.').optional()
});

const sellerVerifyDecisionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], { errorMap: () => ({ message: "Status must be APPROVED or REJECTED." }) }),
  reason: z.string().optional()
});

// 6. Report Schemas
const reportSchema = z.object({
  reportedUserId: z.string().uuid('Invalid user ID format.').optional().nullable(),
  reportedListingId: z.string().uuid('Invalid listing ID format.').optional().nullable(),
  reason: z.string().min(5, 'Reason must be at least 5 characters long.')
});

const reportResolveSchema = z.object({
  status: z.enum(['RESOLVED', 'DISMISSED'], { errorMap: () => ({ message: "Status must be RESOLVED or DISMISSED." }) }),
  notes: z.string().optional()
});

// 7. Admin Action Schemas
const listingModerateSchema = z.object({
  status: z.enum(['ACTIVE', 'REJECTED'], { errorMap: () => ({ message: "Status must be ACTIVE or REJECTED." }) }),
  reason: z.string().optional()
});

const userSuspendSchema = z.object({
  suspend: z.boolean(),
  reason: z.string().optional()
});

// 8. Middleware helper
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Parse query parameters if GET, otherwise parse body
      const dataToValidate = req.method === 'GET' ? req.query : req.body;
      const parsed = schema.parse(dataToValidate);
      
      // Override body/query with validated, parsed data
      if (req.method === 'GET') {
        req.query = parsed;
      } else {
        req.body = parsed;
      }
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = err.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return res.status(400).json({ error: 'Validation failed.', details: errors });
      }
      return res.status(400).json({ error: err.message });
    }
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  profileUpdateSchema,
  listingSchema,
  listingUpdateSchema,
  reviewSchema,
  sellerVerifySchema,
  sellerVerifyDecisionSchema,
  reportSchema,
  reportResolveSchema,
  listingModerateSchema,
  userSuspendSchema,
  validateRequest
};
