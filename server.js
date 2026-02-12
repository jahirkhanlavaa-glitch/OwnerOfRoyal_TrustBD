const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();

// ============================================
// CLOUDINARY CONFIGURATION
// ============================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000', 'https://hilarious-rolypoly-c0d8ff.netlify.app'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ============================================
// MONGODB CONNECTION
// ============================================
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log('✅ MongoDB Connected Successfully!'))
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err.message);
  process.exit(1);
});

// ============================================
// DATABASE SCHEMAS
// ============================================

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  colors: [{
    name: String,
    code: String,
    image: String
  }],
  size: { type: String, required: true },
  regularPrice: { type: Number, required: true },
  offerPrice: { type: Number, required: true },
  offerPercentage: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  category: { 
    type: String, 
    enum: ['panjabi', 'tshirt', 'three-piece', 'fitness'],
    default: 'panjabi'
  },
  features: [String],
  hasVariants: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  productCategory: String,
  color: { type: String, required: true },
  size: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  totalPrice: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  notes: String,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  text: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  isApproved: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const sliderSchema = new mongoose.Schema({
  slideNumber: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  badgeText: String,
  badgeColor: { 
    type: String, 
    enum: ['red', 'blue', 'green', 'yellow', 'purple'],
    default: 'red'
  },
  price: Number,
  originalPrice: Number,
  isActive: { type: Boolean, default: true }
});

const websiteSettingsSchema = new mongoose.Schema({
  whatsappNumber: { type: String, default: '01911465879' },
  phoneNumber: { type: String, default: '01911465879' },
  footerText: { type: String, default: 'প্রিমিয়াম পাঞ্জাবি, টি-শার্ট, থ্রি পিজ ও ফিটনেস পরিধানের নির্ভরযোগ্য ঠিকানা' },
  deliveryChargeInsideDhaka: { type: Number, default: 60 },
  deliveryChargeOutsideDhaka: { type: Number, default: 160 },
  serviceHours: { type: String, default: 'সকাল ৯টা - রাত ১০টা' },
  homePageTitle: { type: String, default: 'আমাদের কালেকশন' },
  orderFormTitle: { type: String, default: 'পণ্য অর্ডার ফর্ম' },
  updatedAt: { type: Date, default: Date.now }
});

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now }
});

// Models
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Review = mongoose.model('Review', reviewSchema);
const Slider = mongoose.model('Slider', sliderSchema);
const WebsiteSettings = mongoose.model('WebsiteSettings', websiteSettingsSchema);
const Admin = mongoose.model('Admin', adminSchema);

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate unique order ID
function generateOrderId() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RT${timestamp}${random}`;
}

// Upload image to Cloudinary
async function uploadToCloudinary(file, folder = 'products') {
  try {
    if (!file) return null;
    
    let result;
    
    if (typeof file === 'string' && file.startsWith('data:image')) {
      // Base64 string
      result = await cloudinary.uploader.upload(file, {
        folder: `royal_trust/${folder}`,
        resource_type: 'auto',
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto:good' }
        ]
      });
    } else if (file.data) {
      // File object from express-fileupload
      const base64 = `data:${file.mimetype};base64,${file.data.toString('base64')}`;
      result = await cloudinary.uploader.upload(base64, {
        folder: `royal_trust/${folder}`,
        resource_type: 'auto'
      });
    } else if (file.tempFilePath) {
      // Temp file
      result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: `royal_trust/${folder}`,
        resource_type: 'auto'
      });
    } else {
      return null;
    }
    
    return result.secure_url;
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error.message);
    return null;
  }
}

// ============================================
// TEST ENDPOINTS
// ============================================

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Royal Trust BD API is running',
    version: '1.0.0',
    endpoints: {
      frontend: 'https://hilarious-rolypoly-c0d8ff.netlify.app',
      admin: '/admin',
      api: '/api'
    }
  });
});

app.get('/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  let cloudinaryStatus = 'not configured';
  try {
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      await cloudinary.api.ping();
      cloudinaryStatus = 'connected';
    }
  } catch (error) {
    cloudinaryStatus = 'error';
  }
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    cloudinary: cloudinaryStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================================
// PUBLIC API ENDPOINTS (Frontend)
// ============================================

// Get all active products
app.get('/api/frontend/products', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get approved reviews
app.get('/api/frontend/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ isApproved: true })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active sliders
app.get('/api/frontend/sliders', async (req, res) => {
  try {
    const sliders = await Slider.find({ isActive: true }).sort({ slideNumber: 1 });
    res.json(sliders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get website settings
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

// Submit order
app.post('/api/frontend/order', async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      orderId: generateOrderId()
    };
    
    const order = new Order(orderData);
    await order.save();
    
    res.json({
      success: true,
      message: 'অর্ডার সফল হয়েছে!',
      orderId: order.orderId
    });
  } catch (error) {
    console.error('Order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit review
app.post('/api/frontend/review', async (req, res) => {
  try {
    const review = new Review(req.body);
    await review.save();
    
    res.json({
      success: true,
      message: 'রিভিউ জমা দেওয়া হয়েছে! এপ্রুভ হলে দেখানো হবে।'
    });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ADMIN API ENDPOINTS
// ============================================

// Admin login
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    let admin = await Admin.findOne({ username });
    if (!admin) {
      admin = new Admin({ username, password });
      await admin.save();
    }
    
    admin.lastLogin = new Date();
    await admin.save();
    
    res.json({
      success: true,
      message: 'Login successful',
      username: admin.username
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Dashboard stats
app.get('/api/admin/dashboard/stats', async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalProducts,
      totalReviews,
      pendingReviews
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'delivered' }),
      Product.countDocuments(),
      Review.countDocuments(),
      Review.countDocuments({ isApproved: false })
    ]);
    
    const deliveredOrdersList = await Order.find({ status: 'delivered' });
    const totalRevenue = deliveredOrdersList.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    res.json({
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue,
      totalProducts,
      totalReviews,
      pendingReviews,
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ADMIN PRODUCTS API
// ============================================

// Get all products
app.get('/api/admin/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create product with Cloudinary
app.post('/api/admin/products', async (req, res) => {
  try {
    const productData = req.body;
    
    // Process color images
    if (productData.colors && Array.isArray(productData.colors)) {
      for (let i = 0; i < productData.colors.length; i++) {
        const color = productData.colors[i];
        
        if (color.imageFile && color.imageFile.startsWith('data:image')) {
          const imageUrl = await uploadToCloudinary(color.imageFile, 'products/colors');
          if (imageUrl) {
            color.image = imageUrl;
          }
          delete color.imageFile;
        }
      }
    }
    
    const product = new Product(productData);
    await product.save();
    
    res.json({
      success: true,
      message: 'পণ্য সফলভাবে যোগ করা হয়েছে',
      product
    });
  } catch (error) {
    console.error('Product create error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update product
app.put('/api/admin/products/:id', async (req, res) => {
  try {
    const productData = req.body;
    
    // Process color images
    if (productData.colors && Array.isArray(productData.colors)) {
      for (let i = 0; i < productData.colors.length; i++) {
        const color = productData.colors[i];
        
        if (color.imageFile && color.imageFile.startsWith('data:image')) {
          const imageUrl = await uploadToCloudinary(color.imageFile, 'products/colors');
          if (imageUrl) {
            color.image = imageUrl;
          }
          delete color.imageFile;
        }
      }
    }
    
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

// Delete product
app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'পণ্য ডিলিট হয়েছে' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ADMIN ORDERS API
// ============================================

app.get('/api/admin/orders', async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/orders/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true }
    );
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ADMIN REVIEWS API
// ============================================

app.get('/api/admin/reviews', async (req, res) => {
  try {
    const { approved } = req.query;
    const query = {};
    if (approved !== undefined) {
      query.isApproved = approved === 'true';
    }
    const reviews = await Review.find(query).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/reviews/:id/approve', async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/reviews/:id', async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ADMIN SLIDERS API with Cloudinary
// ============================================

app.get('/api/admin/sliders', async (req, res) => {
  try {
    const sliders = await Slider.find().sort({ slideNumber: 1 });
    res.json(sliders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/sliders', async (req, res) => {
  try {
    const sliderData = req.body;
    
    // Upload image to Cloudinary
    if (sliderData.imageFile && sliderData.imageFile.startsWith('data:image')) {
      const imageUrl = await uploadToCloudinary(sliderData.imageFile, 'sliders');
      if (imageUrl) {
        sliderData.imageUrl = imageUrl;
      }
      delete sliderData.imageFile;
    }
    
    const slider = new Slider(sliderData);
    await slider.save();
    
    res.json({
      success: true,
      message: 'স্লাইডার যোগ করা হয়েছে',
      slider
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/sliders/:id', async (req, res) => {
  try {
    const sliderData = req.body;
    
    // Upload new image if provided
    if (sliderData.imageFile && sliderData.imageFile.startsWith('data:image')) {
      const imageUrl = await uploadToCloudinary(sliderData.imageFile, 'sliders');
      if (imageUrl) {
        sliderData.imageUrl = imageUrl;
      }
      delete sliderData.imageFile;
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

// ============================================
// ADMIN SETTINGS API
// ============================================

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

app.put('/api/admin/settings', async (req, res) => {
  try {
    let settings = await WebsiteSettings.findOne();
    if (!settings) {
      settings = new WebsiteSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    settings.updatedAt = new Date();
    await settings.save();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ADMIN NOTIFICATIONS API
// ============================================

app.get('/api/admin/notifications', async (req, res) => {
  try {
    const [unreadOrders, unreadReviews] = await Promise.all([
      Order.find({ isRead: false }).sort({ createdAt: -1 }).limit(10),
      Review.find({ isRead: false }).sort({ createdAt: -1 }).limit(10)
    ]);
    
    res.json({ unreadOrders, unreadReviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/notifications/read', async (req, res) => {
  try {
    const { type, id } = req.body;
    
    if (type === 'order' && id) {
      await Order.findByIdAndUpdate(id, { isRead: true });
    } else if (type === 'review' && id) {
      await Review.findByIdAndUpdate(id, { isRead: true });
    } else if (type === 'all') {
      await Order.updateMany({ isRead: false }, { isRead: true });
      await Review.updateMany({ isRead: false }, { isRead: true });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// UPLOAD ENDPOINTS
// ============================================

app.post('/api/upload', async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    
    const image = req.files.image;
    const folder = req.body.folder || 'uploads';
    
    const imageUrl = await uploadToCloudinary(image, folder);
    
    if (!imageUrl) {
      return res.status(500).json({ error: 'Upload failed' });
    }
    
    res.json({
      success: true,
      url: imageUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload/base64', async (req, res) => {
  try {
    const { base64, folder } = req.body;
    
    if (!base64) {
      return res.status(400).json({ error: 'No base64 data' });
    }
    
    const imageUrl = await uploadToCloudinary(base64, folder || 'uploads');
    
    if (!imageUrl) {
      return res.status(500).json({ error: 'Upload failed' });
    }
    
    res.json({
      success: true,
      url: imageUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// INITIALIZE DATABASE
// ============================================

async function initializeDatabase() {
  try {
    // Create default admin
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      await Admin.create({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123'
      });
      console.log('✅ Default admin created');
    }
    
    // Create default settings
    const settingsCount = await WebsiteSettings.countDocuments();
    if (settingsCount === 0) {
      await WebsiteSettings.create({});
      console.log('✅ Default settings created');
    }
    
    // Create sample products if none exist
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      await Product.create([
        {
          name: "রয়েল ব্লু পাঞ্জাবি",
          description: "উচ্চমানের সুতি কাপড়, প্রিমিয়াম ফিনিশিং, আরামদায়ক ফিট",
          category: "panjabi",
          colors: [{
            name: "রয়েল ব্লু",
            code: "#4169E1",
            image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800"
          }],
          size: "S, M, L, XL, XXL",
          regularPrice: 1890,
          offerPrice: 1390,
          offerPercentage: 26,
          isActive: true
        },
        {
          name: "প্রিমিয়াম কটন টি-শার্ট",
          description: "১০০% সুতি কাপড়, আরামদায়ক ফিট, প্রিমিয়াম কোয়ালিটি",
          category: "tshirt",
          colors: [{
            name: "কালো",
            code: "#000000",
            image: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=800"
          }],
          size: "S, M, L, XL, XXL",
          regularPrice: 990,
          offerPrice: 690,
          offerPercentage: 30,
          isActive: true
        }
      ]);
      console.log('✅ Sample products created');
    }
    
    // Create sample sliders
    const sliderCount = await Slider.countDocuments();
    if (sliderCount === 0) {
      await Slider.create([
        {
          slideNumber: 1,
          title: "রয়েল ট্রাস্ট BD",
          subtitle: "প্রিমিয়াম পাঞ্জাবি",
          description: "উচ্চমানের পাঞ্জাবি ও ফ্যাশনেবল পোশাক",
          imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1600",
          badgeText: "সীমিত সময়ের অফার",
          badgeColor: "red",
          price: 1390,
          originalPrice: 1890,
          isActive: true
        }
      ]);
      console.log('✅ Sample sliders created');
    }
    
    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
  }
}

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`☁️ Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME || 'Not configured'}\n`);
  
  await initializeDatabase();
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});