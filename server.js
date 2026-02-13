const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();

// ✅ Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dorpsn4nf',
  api_key: process.env.CLOUDINARY_API_KEY || '185325533762674',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Z6Dk5ZgVpFVXHlXFPli8MhmLMyg',
  secure: true
});

// ✅ Middleware
app.use(cors({
  origin: [
    'https://owner-of-royal-trust-o299viqa1-jahirkhanlavaa-glitchs-projects.vercel.app',
    'https://owner-of-royal-trust-bd-899i.vercel.app',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// ✅ Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

// ✅ MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jahirkhanlavaa_db_user:F08lxNuvuuJTnVwK@cluster0.w1uufvt.mongodb.net/RoyalTrustBD?appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected Successfully!'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

/* ============================================
   DATABASE SCHEMAS - সম্পূর্ণ আপডেটেড
   ============================================ */

// ✅ ক্যাটাগরি স্কিমা - NEW
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  banglaName: { type: String, required: true },
  description: String,
  icon: { type: String, default: 'fa-tshirt' },
  image: String,
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// ✅ পণ্য স্কিমা - আপডেটেড (ক্যাটাগরি যুক্ত)
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  banglaName: { type: String, required: true },
  description: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  category: { type: String, required: true },
  categoryBangla: String,
  subCategory: String,
  subCategoryBangla: String,
  colors: [{
    name: { type: String, required: true },
    banglaName: String,
    code: { type: String, required: true },
    image: { type: String, required: true },
    isBase64: { type: Boolean, default: false }
  }],
  size: { type: String, required: true },
  sizeOptions: [String],
  regularPrice: { type: Number, required: true },
  offerPrice: { type: Number, required: true },
  offerPercentage: { type: Number, required: true },
  stock: { type: Number, default: 100 },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  tags: [String],
  features: [String],
  material: String,
  fit: String,
  careInstructions: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ✅ অর্ডার স্কিমা - আপডেটেড
const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  address: { type: String, required: true },
  district: String,
  area: String,
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  productBanglaName: String,
  category: String,
  categoryBangla: String,
  color: { type: String, required: true },
  colorBangla: String,
  size: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: Number,
  totalPrice: { type: Number, required: true },
  deliveryCharge: { type: Number, default: 60 },
  grandTotal: Number,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: { type: String, default: 'cash_on_delivery' },
  paymentStatus: { type: String, default: 'pending' },
  notes: String,
  adminNotes: String,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ✅ রিভিউ স্কিমা - আপডেটেড
const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: String,
  email: String,
  location: { type: String, required: true },
  text: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: String,
  orderId: String,
  isApproved: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  images: [String],
  reply: String,
  replyDate: Date,
  createdAt: { type: Date, default: Date.now }
});

// ✅ স্লাইডার স্কিমা - আপডেটেড
const sliderSchema = new mongoose.Schema({
  slideNumber: { type: Number, required: true },
  title: { type: String, required: true },
  banglaTitle: String,
  subtitle: { type: String, required: true },
  banglaSubtitle: String,
  description: { type: String, required: true },
  banglaDescription: String,
  imageUrl: { type: String, required: true },
  mobileImageUrl: String,
  isBase64: { type: Boolean, default: false },
  badgeText: String,
  badgeBanglaText: String,
  badgeColor: { type: String, default: 'red' },
  price: Number,
  originalPrice: Number,
  buttonText: { type: String, default: 'অর্ডার করুন' },
  buttonLink: { type: String, default: '#order' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// ✅ ওয়েবসাইট সেটিংস স্কিমা - সম্পূর্ণ আপডেটেড
const websiteSettingsSchema = new mongoose.Schema({
  // Contact Information
  whatsappNumber: { type: String, default: '01911465879' },
  phoneNumber: { type: String, default: '01911465879' },
  phoneNumber2: String,
  email: { type: String, default: 'royaltrustbd@gmail.com' },
  address: { type: String, default: 'ঢাকা, বাংলাদেশ' },
  
  // Delivery Settings
  deliveryChargeInsideDhaka: { type: Number, default: 60 },
  deliveryChargeOutsideDhaka: { type: Number, default: 160 },
  freeDeliveryThreshold: { type: Number, default: 3000 },
  deliveryTime: { type: String, default: '২-৩ কার্যদিবস' },
  
  // Business Hours
  serviceHours: { type: String, default: 'সকাল ৯টা - রাত ১০টা' },
  serviceDays: { type: String, default: 'শনি-বৃহস্পতি' },
  weeklyHoliday: { type: String, default: 'শুক্রবার' },
  
  // Homepage Settings
  homePageTitle: { type: String, default: 'আমাদের পাঞ্জাবি কালেকশন' },
  homePageSubtitle: { type: String, default: 'প্রিমিয়াম কোয়ালিটি, রয়েল ফিনিশিং' },
  orderFormTitle: { type: String, default: 'পাঞ্জাবি অর্ডার ফর্ম' },
  orderFormSubtitle: { type: String, default: 'নিচের ফর্মটি পূরণ করে অর্ডার কনফার্ম করুন' },
  
  // Footer Settings
  footerText: { type: String, default: 'প্রিমিয়াম পাঞ্জাবি, টি-শার্ট, থ্রি পিজ ও ফিটনেস পরিধানের নির্ভরযোগ্য ঠিকানা' },
  footerCopyright: { type: String, default: 'ROYAL TRUST BD. সকল স্বত্ব সংরক্ষিত।' },
  
  // SEO Settings
  metaTitle: { type: String, default: 'ROYAL TRUST BD - প্রিমিয়াম পাঞ্জাবি ও ফ্যাশন' },
  metaDescription: { type: String, default: 'উচ্চমানের পাঞ্জাবি, টি-শার্ট, থ্রি পিজ ও ফিটনেস গিয়ার। রয়েল কোয়ালিটি, রয়েল ফিনিশিং।' },
  metaKeywords: { type: String, default: 'পাঞ্জাবি, টি-শার্ট, থ্রি পিজ, ফিটনেস, রয়েল ট্রাস্ট' },
  
  // Social Media
  facebook: String,
  instagram: String,
  youtube: String,
  twitter: String,
  
  // Branding
  logo: { type: String, default: '/images/jahirul-01.png' },
  favicon: String,
  brandColor: { type: String, default: '#dc2626' },
  
  // Feature Flags
  enableReviews: { type: Boolean, default: true },
  enableWhatsApp: { type: Boolean, default: true },
  enableCOD: { type: Boolean, default: true },
  
  updatedAt: { type: Date, default: Date.now }
});

// ✅ অ্যাডমিন স্কিমা
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  email: String,
  role: { type: String, default: 'admin' },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now }
});

// ✅ কন্টাক্ট স্কিমা - NEW
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  subject: String,
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  replied: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// ✅ কুপন স্কিমা - NEW
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  description: String,
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  discountValue: { type: Number, required: true },
  minOrderAmount: Number,
  maxDiscount: Number,
  validFrom: Date,
  validUntil: Date,
  usageLimit: Number,
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

/* ============================================
   MODELS
   ============================================ */
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Review = mongoose.model('Review', reviewSchema);
const Slider = mongoose.model('Slider', sliderSchema);
const WebsiteSettings = mongoose.model('WebsiteSettings', websiteSettingsSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Contact = mongoose.model('Contact', contactSchema);
const Coupon = mongoose.model('Coupon', couponSchema);

/* ============================================
   HELPER FUNCTIONS
   ============================================ */

// ✅ জেনারেট অর্ডার আইডি
function generateOrderId() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RT${timestamp}${random}`;
}

// ✅ ইমেইল কনফিগারেশন
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'jahirkhan.lavaa@gmail.com',
    pass: process.env.EMAIL_PASS
  }
});

// ✅ ইমেইল নোটিফিকেশন
async function sendEmailNotification(subject, message) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'jahirkhan.lavaa@gmail.com',
      to: 'jahirkhan.lavaa@gmail.com',
      subject: subject,
      html: message
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.error('❌ Email sending failed:', error);
      else console.log('✅ Email notification sent:', info.messageId);
    });
  } catch (error) {
    console.error('❌ Email setup error:', error);
  }
}

/* ============================================
   CLOUDINARY IMAGE UPLOAD - সম্পূর্ণ আপডেটেড
   ============================================ */

// ✅ Cloudinary তে Base64 ইমেজ আপলোড
const uploadBase64ToCloudinary = async (base64String, folder = 'products', options = {}) => {
  try {
    console.log(`📤 Cloudinary আপলোড শুরু: ${folder}`);
    
    const uploadOptions = {
      folder: `royal_trust/${folder}`,
      resource_type: 'auto',
      timeout: 60000,
      transformation: [
        { width: options.width || 1200, height: options.height || 800, crop: "limit" },
        { quality: options.quality || "auto:good" }
      ]
    };
    
    const result = await cloudinary.uploader.upload(base64String, uploadOptions);
    console.log(`✅ Cloudinary আপলোড সফল: ${result.secure_url.substring(0, 50)}...`);
    return result.secure_url;
    
  } catch (error) {
    console.error('❌ Cloudinary আপলোড ত্রুটি:', error.message);
    
    // Fallback: local file system
    try {
      console.log('🔄 Local ফাইল সিস্টেমে সেভ করার চেষ্টা...');
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      const filename = `${folder}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
      const filepath = path.join(uploadsDir, filename);
      
      fs.writeFileSync(filepath, buffer);
      return `/uploads/${filename}`;
    } catch (fallbackError) {
      console.error('❌ Fallback ত্রুটি:', fallbackError.message);
      
      // Default images
      const defaultImages = {
        products: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        sliders: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
        categories: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      };
      
      return defaultImages[folder] || defaultImages.products;
    }
  }
};

// ✅ ফাইল আপলোড হ্যান্ডলার
const saveUploadedFile = async (file, folder = 'products') => {
  try {
    const base64String = `data:${file.mimetype};base64,${file.data.toString('base64')}`;
    return await uploadBase64ToCloudinary(base64String, folder);
  } catch (error) {
    console.error('Error saving uploaded file:', error);
    return null;
  }
};

// ✅ Base64 ইমেজ সেভ
const saveBase64Image = async (base64String, folder = 'products') => {
  return await uploadBase64ToCloudinary(base64String, folder);
};

/* ============================================
   BASIC ROUTES
   ============================================ */

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Royal Trust BD API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'OK',
    database: dbStatus,
    uptime: process.uptime(),
    cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'not configured'
  });
});

/* ============================================
   IMAGE UPLOAD ENDPOINTS
   ============================================ */

app.post('/api/upload', async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'No files were uploaded' });
    }
    
    const file = req.files.file;
    const folder = req.body.folder || 'general';
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only images are allowed' });
    }
    
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large. Max size is 5MB' });
    }
    
    const fileUrl = await saveUploadedFile(file, folder);
    
    if (!fileUrl) {
      return res.status(500).json({ error: 'Failed to save file' });
    }
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      url: fileUrl
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload/base64', async (req, res) => {
  try {
    const { base64, folder = 'general' } = req.body;
    
    if (!base64) {
      return res.status(400).json({ error: 'No base64 data provided' });
    }
    
    if (!base64.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid base64 image data' });
    }
    
    const fileUrl = await saveBase64Image(base64, folder);
    
    if (!fileUrl) {
      return res.status(500).json({ error: 'Failed to save image' });
    }
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      url: fileUrl
    });
    
  } catch (error) {
    console.error('Base64 upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* ============================================
   FRONTEND API ROUTES - সম্পূর্ণ ফ্রন্টএন্ড কন্ট্রোল
   ============================================ */

// ✅ অর্ডার জমা
app.post('/api/frontend/order', async (req, res) => {
  try {
    const orderData = req.body;
    orderData.orderId = generateOrderId();
    
    // ডেলিভারি চার্জ যোগ করুন
    const settings = await WebsiteSettings.findOne();
    const isDhaka = orderData.address.toLowerCase().includes('ঢাকা') || 
                    orderData.address.toLowerCase().includes('dhaka');
    
    orderData.deliveryCharge = isDhaka 
      ? (settings?.deliveryChargeInsideDhaka || 60)
      : (settings?.deliveryChargeOutsideDhaka || 160);
    
    orderData.grandTotal = orderData.totalPrice + orderData.deliveryCharge;
    
    const order = new Order(orderData);
    await order.save();
    
    // ইমেইল নোটিফিকেশন
    const emailSubject = `🆕 New Order Received - ${order.orderId}`;
    const emailMessage = `
      <h2>New Order Received</h2>
      <p><strong>Order ID:</strong> ${order.orderId}</p>
      <p><strong>Customer Name:</strong> ${order.customerName}</p>
      <p><strong>Phone:</strong> ${order.phone}</p>
      <p><strong>Product:</strong> ${order.productName}</p>
      <p><strong>Color:</strong> ${order.color}</p>
      <p><strong>Size:</strong> ${order.size}</p>
      <p><strong>Quantity:</strong> ${order.quantity}</p>
      <p><strong>Total Price:</strong> ${order.totalPrice} টাকা</p>
      <p><strong>Delivery Charge:</strong> ${order.deliveryCharge} টাকা</p>
      <p><strong>Grand Total:</strong> ${order.grandTotal} টাকা</p>
      <p><strong>Address:</strong> ${order.address}</p>
      <p><strong>Order Time:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
      <br>
      <p>Login to admin panel to manage this order.</p>
    `;
    
    sendEmailNotification(emailSubject, emailMessage).catch(err => {
      console.error('Email sending error (non-blocking):', err);
    });
    
    res.json({
      success: true,
      message: 'Order placed successfully',
      orderId: order.orderId
    });
    
  } catch (error) {
    console.error('Order submission error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ রিভিউ জমা
app.post('/api/frontend/review', async (req, res) => {
  try {
    const review = new Review(req.body);
    await review.save();
    
    const emailSubject = `⭐ New Review Submitted by ${review.name}`;
    const emailMessage = `
      <h2>New Review Submitted</h2>
      <p><strong>Name:</strong> ${review.name}</p>
      <p><strong>Location:</strong> ${review.location}</p>
      <p><strong>Rating:</strong> ${review.rating}/5</p>
      <p><strong>Review:</strong> ${review.text}</p>
      <p><strong>Submitted At:</strong> ${new Date(review.createdAt).toLocaleString()}</p>
      <br>
      <p>Login to admin panel to approve this review.</p>
    `;
    
    sendEmailNotification(emailSubject, emailMessage).catch(err => {
      console.error('Email sending error (non-blocking):', err);
    });
    
    res.json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
    
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ কন্টাক্ট জমা - NEW
app.post('/api/frontend/contact', async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();
    
    const emailSubject = `📞 New Contact Message from ${contact.name}`;
    const emailMessage = `
      <h2>New Contact Message</h2>
      <p><strong>Name:</strong> ${contact.name}</p>
      <p><strong>Phone:</strong> ${contact.phone}</p>
      <p><strong>Email:</strong> ${contact.email || 'N/A'}</p>
      <p><strong>Subject:</strong> ${contact.subject || 'N/A'}</p>
      <p><strong>Message:</strong> ${contact.message}</p>
      <p><strong>Time:</strong> ${new Date(contact.createdAt).toLocaleString()}</p>
    `;
    
    sendEmailNotification(emailSubject, emailMessage).catch(err => {
      console.error('Email sending error (non-blocking):', err);
    });
    
    res.json({
      success: true,
      message: 'Message sent successfully'
    });
    
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ সকল পণ্য (সক্রিয়)
app.get('/api/frontend/products', async (req, res) => {
  try {
    const { category, featured, newArrival } = req.query;
    
    let query = { isActive: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (featured === 'true') {
      query.isFeatured = true;
    }
    
    if (newArrival === 'true') {
      query.isNewArrival = true;
    }
    
    const products = await Product.find(query)
      .populate('categoryId', 'name banglaName')
      .sort({ isFeatured: -1, createdAt: -1 });
    
    res.json(products);
    
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ একক পণ্য
app.get('/api/frontend/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('categoryId');
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ সকল ক্যাটাগরি - NEW
app.get('/api/frontend/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ এপ্রুভড রিভিউ
app.get('/api/frontend/reviews', async (req, res) => {
  try {
    const { productId, featured } = req.query;
    
    let query = { isApproved: true };
    
    if (productId) {
      query.productId = productId;
    }
    
    if (featured === 'true') {
      query.isFeatured = true;
    }
    
    const reviews = await Review.find(query)
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(10);
    
    res.json(reviews);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ সক্রিয় স্লাইডার
app.get('/api/frontend/sliders', async (req, res) => {
  try {
    const sliders = await Slider.find({ isActive: true }).sort({ slideNumber: 1 });
    res.json(sliders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ ওয়েবসাইট সেটিংস
app.get('/api/frontend/settings', async (req, res) => {
  try {
    let settings = await WebsiteSettings.findOne();
    if (!settings) {
      settings = new WebsiteSettings();
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ কুপন ভেরিফাই - NEW
app.post('/api/frontend/verify-coupon', async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(), 
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    });
    
    if (!coupon) {
      return res.json({ valid: false, message: 'Invalid coupon code' });
    }
    
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.json({ valid: false, message: 'Coupon usage limit exceeded' });
    }
    
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return res.json({ 
        valid: false, 
        message: `Minimum order amount ${coupon.minOrderAmount} টাকা required` 
      });
    }
    
    let discountAmount = 0;
    
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }
    
    res.json({
      valid: true,
      coupon,
      discountAmount,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================
   ADMIN API ROUTES - সম্পূর্ণ নিয়ন্ত্রণ
   ============================================ */

// ✅ অ্যাডমিন লগইন
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (username === (process.env.ADMIN_USERNAME || 'admin') &&
      password === (process.env.ADMIN_PASSWORD || 'admin123')) {
    
    let admin = await Admin.findOne({ username });
    if (!admin) {
      admin = new Admin({ username, password, name: 'Administrator' });
      await admin.save();
    }
    
    admin.lastLogin = new Date();
    await admin.save();
    
    res.json({
      success: true,
      message: 'Login successful',
      username: admin.username,
      name: admin.name,
      role: admin.role
    });
    
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

/* ============================================
   ADMIN - DASHBOARD
   ============================================ */

// ✅ ড্যাশবোর্ড পরিসংখ্যান
app.get('/api/admin/dashboard/stats', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const confirmedOrders = await Order.countDocuments({ status: 'confirmed' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
    
    const deliveredOrdersList = await Order.find({ status: 'delivered' });
    const totalRevenue = deliveredOrdersList.reduce((sum, order) => sum + (order.grandTotal || order.totalPrice), 0);
    
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const featuredProducts = await Product.countDocuments({ isFeatured: true });
    
    const totalCategories = await Category.countDocuments();
    const activeCategories = await Category.countDocuments({ isActive: true });
    
    const totalReviews = await Review.countDocuments();
    const pendingReviews = await Review.countDocuments({ isApproved: false });
    const featuredReviews = await Review.countDocuments({ isFeatured: true });
    
    const totalSliders = await Slider.countDocuments();
    const activeSliders = await Slider.countDocuments({ isActive: true });
    
    const totalContacts = await Contact.countDocuments();
    const unreadContacts = await Contact.countDocuments({ isRead: false });
    
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    const unreadOrders = await Order.countDocuments({ isRead: false });
    const unreadReviews = await Review.countDocuments({ isRead: false });
    
    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
    const todayRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: today }, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    
    res.json({
      // Orders
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      todayOrders,
      
      // Revenue
      totalRevenue,
      todayRevenue: todayRevenue[0]?.total || 0,
      
      // Products
      totalProducts,
      activeProducts,
      featuredProducts,
      
      // Categories
      totalCategories,
      activeCategories,
      
      // Reviews
      totalReviews,
      pendingReviews,
      featuredReviews,
      
      // Sliders
      totalSliders,
      activeSliders,
      
      // Contacts
      totalContacts,
      unreadContacts,
      
      // Notifications
      unreadOrders,
      unreadReviews,
      
      // Recent Orders
      recentOrders
    });
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/* ============================================
   ADMIN - CATEGORY MANAGEMENT - সম্পূর্ণ নতুন
   ============================================ */

// ✅ সকল ক্যাটাগরি
app.get('/api/admin/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ ক্যাটাগরি তৈরি
app.post('/api/admin/categories', async (req, res) => {
  try {
    const categoryData = req.body;
    
    // ইমেজ প্রসেসিং
    if (categoryData.imageFile && categoryData.imageFile.startsWith('data:image/')) {
      const imageUrl = await uploadBase64ToCloudinary(categoryData.imageFile, 'categories');
      categoryData.image = imageUrl;
      delete categoryData.imageFile;
    }
    
    const category = new Category(categoryData);
    await category.save();
    
    res.json({
      success: true,
      message: 'ক্যাটাগরি সফলভাবে যোগ করা হয়েছে',
      category
    });
    
  } catch (error) {
    console.error('Category creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ ক্যাটাগরি আপডেট
app.put('/api/admin/categories/:id', async (req, res) => {
  try {
    const categoryData = req.body;
    
    if (categoryData.imageFile && categoryData.imageFile.startsWith('data:image/')) {
      const imageUrl = await uploadBase64ToCloudinary(categoryData.imageFile, 'categories');
      categoryData.image = imageUrl;
      delete categoryData.imageFile;
    }
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { ...categoryData, updatedAt: new Date() },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'ক্যাটাগরি আপডেট হয়েছে',
      category
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ ক্যাটাগরি ডিলিট
app.delete('/api/admin/categories/:id', async (req, res) => {
  try {
    // Check if category has products
    const productsCount = await Product.countDocuments({ categoryId: req.params.id });
    
    if (productsCount > 0) {
      return res.status(400).json({
        error: 'এই ক্যাটাগরিতে পণ্য আছে, আগে পণ্যগুলো ডিলিট বা অন্য ক্যাটাগরিতে স্থানান্তর করুন'
      });
    }
    
    await Category.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'ক্যাটাগরি ডিলিট হয়েছে'
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================
   ADMIN - PRODUCT MANAGEMENT - সম্পূর্ণ আপডেটেড
   ============================================ */

// ✅ সকল পণ্য (অ্যাডমিন)
app.get('/api/admin/products', async (req, res) => {
  try {
    const products = await Product.find()
      .populate('categoryId', 'name banglaName')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ পণ্য তৈরি
app.post('/api/admin/products', async (req, res) => {
  try {
    const productData = req.body;
    console.log('🔄 নতুন পণ্য তৈরি শুরু...');
    
    // অফার পার্সেন্টেজ ক্যালকুলেট
    if (productData.regularPrice && productData.offerPrice) {
      productData.offerPercentage = Math.round(
        ((productData.regularPrice - productData.offerPrice) / productData.regularPrice) * 100
      );
    }
    
    // সাইজ অপশন অ্যারেতে রূপান্তর
    if (productData.size) {
      productData.sizeOptions = productData.size.split(',').map(s => s.trim());
    }
    
    // কালার ইমেজ প্রসেসিং
    if (productData.colors && Array.isArray(productData.colors)) {
      for (let i = 0; i < productData.colors.length; i++) {
        let color = productData.colors[i];
        
        if (color.imageFile && color.imageFile.startsWith('data:image/')) {
          const imageUrl = await uploadBase64ToCloudinary(color.imageFile, 'products/colors');
          color.image = imageUrl;
          delete color.imageFile;
        } else if (!color.image) {
          color.image = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800';
        }
      }
    }
    
    productData.updatedAt = new Date();
    
    const product = new Product(productData);
    await product.save();
    
    console.log('✅ পণ্য সফলভাবে তৈরি হয়েছে');
    
    res.json({
      success: true,
      message: 'পণ্য সফলভাবে যোগ করা হয়েছে',
      product
    });
    
  } catch (error) {
    console.error('❌ পণ্য তৈরি ত্রুটি:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ পণ্য আপডেট
app.put('/api/admin/products/:id', async (req, res) => {
  try {
    const productData = req.body;
    
    if (productData.regularPrice && productData.offerPrice) {
      productData.offerPercentage = Math.round(
        ((productData.regularPrice - productData.offerPrice) / productData.regularPrice) * 100
      );
    }
    
    if (productData.size) {
      productData.sizeOptions = productData.size.split(',').map(s => s.trim());
    }
    
    if (productData.colors && Array.isArray(productData.colors)) {
      for (let i = 0; i < productData.colors.length; i++) {
        let color = productData.colors[i];
        
        if (color.imageFile && color.imageFile.startsWith('data:image/')) {
          const imageUrl = await uploadBase64ToCloudinary(color.imageFile, 'products/colors');
          color.image = imageUrl;
          delete color.imageFile;
        }
      }
    }
    
    productData.updatedAt = new Date();
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'পণ্য আপডেট হয়েছে',
      product
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ পণ্য ডিলিট
app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: 'পণ্য ডিলিট হয়েছে'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================
   ADMIN - ORDER MANAGEMENT - সম্পূর্ণ আপডেটেড
   ============================================ */

// ✅ সকল অর্ডার
app.get('/api/admin/orders', async (req, res) => {
  try {
    const { status, search, fromDate, toDate } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }
    
    const orders = await Order.find(query).sort({ createdAt: -1 });
    
    res.json({ orders });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ অর্ডার স্ট্যাটাস আপডেট
app.put('/api/admin/orders/:id/status', async (req, res) => {
  try {
    const { status, notes, adminNotes } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status,
        notes,
        adminNotes,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Order status updated',
      order
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ অর্ডার ডিলিট
app.delete('/api/admin/orders/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: 'Order deleted'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================
   ADMIN - REVIEW MANAGEMENT - সম্পূর্ণ আপডেটেড
   ============================================ */

// ✅ সকল রিভিউ
app.get('/api/admin/reviews', async (req, res) => {
  try {
    const { approved, featured, search } = req.query;
    
    let query = {};
    
    if (approved !== undefined) {
      query.isApproved = approved === 'true';
    }
    
    if (featured !== undefined) {
      query.isFeatured = featured === 'true';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { text: { $regex: search, $options: 'i' } }
      ];
    }
    
    const reviews = await Review.find(query).sort({ createdAt: -1 });
    res.json(reviews);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ রিভিউ এপ্রুভ
app.put('/api/admin/reviews/:id/approve', async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, isRead: true },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Review approved',
      review
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ রিভিউ ফিচার টগল
app.put('/api/admin/reviews/:id/feature', async (req, res) => {
  try {
    const { isFeatured } = req.body;
    
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isFeatured },
      { new: true }
    );
    
    res.json({
      success: true,
      message: isFeatured ? 'Review featured' : 'Review unfeatured',
      review
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ রিভিউ রিপ্লাই
app.put('/api/admin/reviews/:id/reply', async (req, res) => {
  try {
    const { reply } = req.body;
    
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        reply,
        replyDate: new Date()
      },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Reply added',
      review
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ রিভিউ ডিলিট
app.delete('/api/admin/reviews/:id', async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: 'Review deleted'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================
   ADMIN - SLIDER MANAGEMENT - সম্পূর্ণ আপডেটেড
   ============================================ */

// ✅ সকল স্লাইডার
app.get('/api/admin/sliders', async (req, res) => {
  try {
    const sliders = await Slider.find().sort({ slideNumber: 1 });
    res.json(sliders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ স্লাইডার তৈরি
app.post('/api/admin/sliders', async (req, res) => {
  try {
    const sliderData = req.body;
    
    if (sliderData.imageFile && sliderData.imageFile.startsWith('data:image/')) {
      const imageUrl = await uploadBase64ToCloudinary(sliderData.imageFile, 'sliders', {
        width: 1920,
        height: 1080
      });
      sliderData.imageUrl = imageUrl;
      delete sliderData.imageFile;
    }
    
    if (sliderData.mobileImageFile && sliderData.mobileImageFile.startsWith('data:image/')) {
      const mobileImageUrl = await uploadBase64ToCloudinary(sliderData.mobileImageFile, 'sliders/mobile', {
        width: 800,
        height: 1000
      });
      sliderData.mobileImageUrl = mobileImageUrl;
      delete sliderData.mobileImageFile;
    }
    
    const slider = new Slider(sliderData);
    await slider.save();
    
    res.json({
      success: true,
      message: 'স্লাইডার তৈরি হয়েছে',
      slider
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ স্লাইডার আপডেট
app.put('/api/admin/sliders/:id', async (req, res) => {
  try {
    const sliderData = req.body;
    
    if (sliderData.imageFile && sliderData.imageFile.startsWith('data:image/')) {
      const imageUrl = await uploadBase64ToCloudinary(sliderData.imageFile, 'sliders');
      sliderData.imageUrl = imageUrl;
      delete sliderData.imageFile;
    }
    
    if (sliderData.mobileImageFile && sliderData.mobileImageFile.startsWith('data:image/')) {
      const mobileImageUrl = await uploadBase64ToCloudinary(sliderData.mobileImageFile, 'sliders/mobile');
      sliderData.mobileImageUrl = mobileImageUrl;
      delete sliderData.mobileImageFile;
    }
    
    const slider = await Slider.findByIdAndUpdate(
      req.params.id,
      sliderData,
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'স্লাইডার আপডেট হয়েছে',
      slider
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ স্লাইডার ডিলিট
app.delete('/api/admin/sliders/:id', async (req, res) => {
  try {
    await Slider.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: 'স্লাইডার ডিলিট হয়েছে'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================
   ADMIN - WEBSITE SETTINGS - সম্পূর্ণ আপডেটেড
   ============================================ */

// ✅ সেটিংস দেখুন
app.get('/api/admin/settings', async (req, res) => {
  try {
    let settings = await WebsiteSettings.findOne();
    if (!settings) {
      settings = new WebsiteSettings();
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ সেটিংস আপডেট
app.put('/api/admin/settings', async (req, res) => {
  try {
    let settings = await WebsiteSettings.findOne();
    
    if (!settings) {
      settings = new WebsiteSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    
    // লোগো আপলোড
    if (req.body.logoFile && req.body.logoFile.startsWith('data:image/')) {
      const logoUrl = await uploadBase64ToCloudinary(req.body.logoFile, 'branding');
      settings.logo = logoUrl;
    }
    
    if (req.body.faviconFile && req.body.faviconFile.startsWith('data:image/')) {
      const faviconUrl = await uploadBase64ToCloudinary(req.body.faviconFile, 'branding', {
        width: 32,
        height: 32
      });
      settings.favicon = faviconUrl;
    }
    
    settings.updatedAt = new Date();
    await settings.save();
    
    res.json({
      success: true,
      message: 'Settings updated',
      settings
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================
   ADMIN - CONTACT MANAGEMENT - NEW
   ============================================ */

// ✅ সকল কন্টাক্ট
app.get('/api/admin/contacts', async (req, res) => {
  try {
    const { read, search } = req.query;
    
    let query = {};
    
    if (read !== undefined) {
      query.isRead = read === 'true';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }
    
    const contacts = await Contact.find(query).sort({ createdAt: -1 });
    res.json(contacts);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ কন্টাক্ট আপডেট (read status)
app.put('/api/admin/contacts/:id', async (req, res) => {
  try {
    const { isRead, replied } = req.body;
    
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { isRead, replied },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Contact updated',
      contact
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ কন্টাক্ট ডিলিট
app.delete('/api/admin/contacts/:id', async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: 'Contact deleted'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================
   ADMIN - COUPON MANAGEMENT - NEW
   ============================================ */

// ✅ সকল কুপন
app.get('/api/admin/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ কুপন তৈরি
app.post('/api/admin/coupons', async (req, res) => {
  try {
    const couponData = req.body;
    
    // কোড আপারকেসে রূপান্তর
    if (couponData.code) {
      couponData.code = couponData.code.toUpperCase();
    }
    
    const coupon = new Coupon(couponData);
    await coupon.save();
    
    res.json({
      success: true,
      message: 'কুপন তৈরি হয়েছে',
      coupon
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ কুপন আপডেট
app.put('/api/admin/coupons/:id', async (req, res) => {
  try {
    const couponData = req.body;
    
    if (couponData.code) {
      couponData.code = couponData.code.toUpperCase();
    }
    
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      couponData,
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'কুপন আপডেট হয়েছে',
      coupon
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ কুপন ডিলিট
app.delete('/api/admin/coupons/:id', async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: 'কুপন ডিলিট হয়েছে'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================
   NOTIFICATIONS
   ============================================ */

// ✅ নোটিফিকেশন
app.get('/api/admin/notifications', async (req, res) => {
  try {
    const unreadOrders = await Order.find({ isRead: false })
      .sort({ createdAt: -1 })
      .limit(20);
    
    const unreadReviews = await Review.find({ isRead: false })
      .sort({ createdAt: -1 })
      .limit(20);
    
    const unreadContacts = await Contact.find({ isRead: false })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({
      unreadOrders,
      unreadReviews,
      unreadContacts
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ নোটিফিকেশন রিড
app.post('/api/admin/notifications/read', async (req, res) => {
  try {
    const { type, id } = req.body;
    
    if (type === 'order') {
      await Order.findByIdAndUpdate(id, { isRead: true });
    } else if (type === 'review') {
      await Review.findByIdAndUpdate(id, { isRead: true });
    } else if (type === 'contact') {
      await Contact.findByIdAndUpdate(id, { isRead: true });
    } else if (type === 'all') {
      await Order.updateMany({ isRead: false }, { isRead: true });
      await Review.updateMany({ isRead: false }, { isRead: true });
      await Contact.updateMany({ isRead: false }, { isRead: true });
    }
    
    res.json({ success: true, message: 'Marked as read' });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================
   DATABASE INITIALIZATION
   ============================================ */

async function initializeDatabase() {
  try {
    console.log('🔄 ডাটাবেস ইনিশিয়ালাইজ করা হচ্ছে...');
    
    // ✅ ডিফল্ট ক্যাটাগরি
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      const defaultCategories = [
        { name: 'panjabi', banglaName: 'পাঞ্জাবি', icon: 'fa-tshirt', order: 1 },
        { name: 'tshirt', banglaName: 'টি-শার্ট', icon: 'fa-tshirt', order: 2 },
        { name: 'three-piece', banglaName: 'থ্রি পিজ', icon: 'fa-tshirt', order: 3 },
        { name: 'fitness', banglaName: 'ফিটনেস', icon: 'fa-dumbbell', order: 4 },
        { name: 'pajama', banglaName: 'পায়জামা', icon: 'fa-tshirt', order: 5 },
        { name: 'kota', banglaName: 'কোট', icon: 'fa-tshirt', order: 6 }
      ];
      
      await Category.insertMany(defaultCategories);
      console.log('✅ ডিফল্ট ক্যাটাগরি তৈরি করা হয়েছে');
    }
    
    // ✅ ডিফল্ট পণ্য
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const panjabiCategory = await Category.findOne({ name: 'panjabi' });
      
      await Product.create({
        name: "Royal Silk Panjabi",
        banglaName: "রয়েল সিল্ক পাঞ্জাবি",
        description: "উচ্চমানের সিল্ক কাপড়ে তৈরি, হাতে তৈরি এমব্রয়ডারি, ফিটিং ডিজাইন",
        category: 'panjabi',
        categoryBangla: 'পাঞ্জাবি',
        categoryId: panjabiCategory?._id,
        colors: [{
          name: "Red & Gold",
          banglaName: "লাল ও সোনালী",
          code: "#dc2626",
          image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800"
        }],
        size: "S, M, L, XL, XXL",
        sizeOptions: ["S", "M", "L", "XL", "XXL"],
        regularPrice: 3200,
        offerPrice: 2499,
        offerPercentage: 22,
        isActive: true,
        isFeatured: true,
        isNewArrival: true,
        features: [
          "১০০% খাঁটি সিল্ক",
          "হাতে তৈরি এমব্রয়ডারি",
          "প্রিমিয়াম ফিটিং",
          "ওয়াশেবল"
        ],
        material: "সিল্ক",
        fit: "স্লিম ফিট",
        careInstructions: "ড্রাই ক্লিন করুন"
      });
      console.log('✅ ডিফল্ট পণ্য তৈরি করা হয়েছে');
    }
    
    // ✅ ডিফল্ট স্লাইডার
    const sliderCount = await Slider.countDocuments();
    if (sliderCount === 0) {
      await Slider.create([
        {
          slideNumber: 1,
          title: "Royal Silk",
          banglaTitle: "রয়েল সিল্ক",
          subtitle: "Panjabi",
          banglaSubtitle: "পাঞ্জাবি",
          description: "Hand embroidered, premium silk fabric, royal experience",
          banglaDescription: "হাতে তৈরি এমব্রয়ডারি, উচ্চমানের সিল্ক কাপড়, রাজকীয় অভিজ্ঞতা",
          imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1600",
          badgeText: "Premium Collection",
          badgeBanglaText: "প্রিমিয়াম কালেকশন",
          badgeColor: "red",
          price: 2499,
          originalPrice: 3200,
          buttonText: "অর্ডার করুন",
          buttonLink: "#order",
          isActive: true
        },
        {
          slideNumber: 2,
          title: "T-Shirt",
          banglaTitle: "টি-শার্ট",
          subtitle: "Collection",
          banglaSubtitle: "কালেকশন",
          description: "Comfortable & fashionable t-shirts, 100% cotton",
          banglaDescription: "আরামদায়ক ও ফ্যাশনেবল টি-শার্ট, ১০০% সুতি কাপড়",
          imageUrl: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=1600",
          badgeText: "New Arrival",
          badgeBanglaText: "নতুন কালেকশন",
          badgeColor: "green",
          price: 690,
          originalPrice: 990,
          buttonText: "অর্ডার করুন",
          buttonLink: "#order",
          isActive: true
        },
        {
          slideNumber: 3,
          title: "Three Piece",
          banglaTitle: "থ্রি পিজ",
          subtitle: "Set",
          banglaSubtitle: "সেট",
          description: "Complete three piece set: Panjabi + Pajama + Coat",
          banglaDescription: "সম্পূর্ণ থ্রি পিজ সেট: পাঞ্জাবি + পায়জামা + কোট",
          imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1600",
          badgeText: "24% Off",
          badgeBanglaText: "২৪% ছাড়",
          badgeColor: "purple",
          price: 3490,
          originalPrice: 4590,
          buttonText: "অর্ডার করুন",
          buttonLink: "#order",
          isActive: true
        }
      ]);
      console.log('✅ ডিফল্ট স্লাইডার তৈরি করা হয়েছে');
    }
    
    // ✅ ডিফল্ট সেটিংস
    const settingsCount = await WebsiteSettings.countDocuments();
    if (settingsCount === 0) {
      const defaultSettings = new WebsiteSettings();
      await defaultSettings.save();
      console.log('✅ ডিফল্ট সেটিংস তৈরি করা হয়েছে');
    }
    
    console.log('✅ ডাটাবেস ইনিশিয়ালাইজেশন সম্পূর্ণ');
    
  } catch (error) {
    console.error('❌ ডাটাবেস ইনিশিয়ালাইজেশন ত্রুটি:', error.message);
  }
}

/* ============================================
   START SERVER
   ============================================ */

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
  console.log(`\n🚀 সার্ভার পোর্ট ${PORT} এ চলছে`);
  console.log(`📡 API URL: http://localhost:${PORT}`);
  console.log(`📡 হেলথ চেক: http://localhost:${PORT}/health`);
  console.log(`☁️ Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ কনফিগার্ড' : '❌ কনফিগার্ড নয়'}`);
  console.log(`📧 ইমেইল: ${process.env.EMAIL_USER ? '✅ এনাবলড' : '❌ ডিসএবলড'}`);
  console.log(`📁 আপলোড ডিরেক্টরি: ${uploadsDir}\n`);
  
  // Cloudinary টেস্ট
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      await cloudinary.uploader.upload(testImage, { folder: 'test' });
      console.log('✅ Cloudinary কানেকশন সফল!\n');
    } catch (error) {
      console.error('❌ Cloudinary কানেকশন ব্যর্থ:', error.message, '\n');
    }
  }
  
  setTimeout(initializeDatabase, 2000);
});

// ✅ Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = app;