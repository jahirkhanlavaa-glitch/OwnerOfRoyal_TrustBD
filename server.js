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

// ============================================
// ✅ Cloudinary Configuration
// ============================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dorpsn4nf',
  api_key: process.env.CLOUDINARY_API_KEY || '185325533762674',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Z6Dk5ZgVpFVXHlXFPli8MhmLMyg',
  secure: true
});

// ============================================
// ✅ Middleware Configuration
// ============================================
app.use(cors({
  origin: [
    'https://hilarious-rolypoly-c0d8ff.netlify.app',  // Frontend
    'https://fancy-hamster-878a22.netlify.app',      // Admin Panel
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

// Create uploads directory for local fallback
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ============================================
// ✅ MongoDB Connection
// ============================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jahirkhanlavaa_db_user:F08lxNuvuuJTnVwK@cluster0.w1uufvt.mongodb.net/RoyalTrustBD?appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected Successfully!'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// ============================================
// ✅ Database Schemas
// ============================================

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['panjabi', 'tshirt', 'three-piece', 'fitness', 'others'],
    default: 'others'
  },
  colors: [{
    name: String,
    code: String,
    image: String,
    isBase64: { type: Boolean, default: false }
  }],
  size: { type: String, required: true },
  regularPrice: { type: Number, required: true },
  offerPrice: { type: Number, required: true },
  offerPercentage: { type: Number, required: true },
  features: [String], // For fitness products
  hasVariants: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Order Schema
const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  productCategory: { type: String },
  color: { type: String, required: true },
  size: { type: String, required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  notes: { type: String },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Review Schema
const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  text: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  isApproved: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Slider Schema
const sliderSchema = new mongoose.Schema({
  slideNumber: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  isBase64: { type: Boolean, default: false },
  badgeText: { type: String },
  badgeColor: { 
    type: String, 
    enum: ['red', 'blue', 'green', 'yellow', 'purple', 'amber'],
    default: 'red'
  },
  price: { type: Number },
  originalPrice: { type: Number },
  isActive: { type: Boolean, default: true }
});

// Website Settings Schema
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

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  lastLogin: { type: Date }
});

// ============================================
// ✅ Database Models
// ============================================
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Review = mongoose.model('Review', reviewSchema);
const Slider = mongoose.model('Slider', sliderSchema);
const WebsiteSettings = mongoose.model('WebsiteSettings', websiteSettingsSchema);
const Admin = mongoose.model('Admin', adminSchema);

// ============================================
// ✅ Helper Functions
// ============================================

// Generate unique order ID
function generateOrderId() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RT${timestamp}${random}`;
}

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'jahirkhan.lavaa@gmail.com',
    pass: process.env.EMAIL_PASS || 'wwpr rhhi eclw vmvm'
  }
});

// Send email notification (async)
async function sendEmailNotification(subject, message) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'jahirkhan.lavaa@gmail.com',
      to: 'jahirkhan.lavaa@gmail.com',
      subject: subject,
      html: message
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Email sending failed:', error);
      } else {
        console.log('✅ Email notification sent:', info.messageId);
      }
    });
  } catch (error) {
    console.error('❌ Email setup error:', error);
  }
}

// Upload Base64 to Cloudinary
const uploadBase64ToCloudinary = async (base64String, folder = 'products') => {
  try {
    console.log(`📤 Cloudinary - ${folder} ফোল্ডারে আপলোড শুরু...`);
    
    const result = await cloudinary.uploader.upload(base64String, {
      folder: `royal_trust/${folder}`,
      resource_type: 'auto',
      timeout: 60000,
      transformation: [
        { width: 1200, height: 800, crop: "limit" },
        { quality: "auto:good" }
      ]
    });
    
    console.log(`✅ Cloudinary আপলোড সফল: ${result.secure_url.substring(0, 60)}...`);
    return result.secure_url;
    
  } catch (error) {
    console.error('❌ Cloudinary আপলোড ত্রুটি:', error.message);
    
    // Fallback: Save locally
    try {
      console.log('🔄 Local ফাইল সিস্টেমে সেভ করার চেষ্টা...');
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      const filename = `${folder}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
      const filepath = path.join(uploadsDir, filename);
      
      fs.writeFileSync(filepath, buffer);
      console.log(`✅ Local ফাইল সেভ হয়েছে: ${filepath}`);
      
      return `/uploads/${filename}`;
    } catch (fallbackError) {
      console.error('❌ Fallback ত্রুটি:', fallbackError.message);
      
      // Default images
      if (folder.includes('slider')) {
        return 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80';
      } else {
        return 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
      }
    }
  }
};

// Save uploaded file to Cloudinary
const saveUploadedFile = async (file, folder = 'products') => {
  try {
    const base64String = `data:${file.mimetype};base64,${file.data.toString('base64')}`;
    return await uploadBase64ToCloudinary(base64String, folder);
  } catch (error) {
    console.error('Error saving uploaded file:', error);
    return null;
  }
};

// ============================================
// ✅ Basic Routes & Health Check
// ============================================

app.get('/', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'Royal Trust BD API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      frontend: '/api/frontend/*',
      admin: '/api/admin/*',
      health: '/health'
    }
  });
});

app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'OK',
    database: dbStatus,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'not configured'
  });
});

// Test Cloudinary Connection
app.get('/api/test-cloudinary', async (req, res) => {
  try {
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const result = await cloudinary.uploader.upload(testImage, { folder: 'test' });
    
    res.json({
      success: true,
      message: '✅ Cloudinary কাজ করছে!',
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      url: result.secure_url
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '❌ Cloudinary ত্রুটি',
      message: error.message
    });
  }
});

// ============================================
// ✅ FRONTEND API - Public Routes
// ============================================

// ---------- Products ----------
app.get('/api/frontend/products', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Orders ----------
app.post('/api/frontend/order', async (req, res) => {
  try {
    const orderData = req.body;
    orderData.orderId = generateOrderId();
    
    const order = new Order(orderData);
    await order.save();
    
    // Send email notification (non-blocking)
    const emailSubject = `🆕 New Order Received - ${order.orderId}`;
    const emailMessage = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #dc2626;">🆕 New Order Received</h2>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 10px;">
          <p><strong>Order ID:</strong> ${order.orderId}</p>
          <p><strong>Customer Name:</strong> ${order.customerName}</p>
          <p><strong>Phone:</strong> ${order.phone}</p>
          <p><strong>Product:</strong> ${order.productName}</p>
          <p><strong>Color:</strong> ${order.color}</p>
          <p><strong>Size:</strong> ${order.size}</p>
          <p><strong>Quantity:</strong> ${order.quantity}</p>
          <p><strong>Total Price:</strong> ${order.totalPrice} টাকা</p>
          <p><strong>Address:</strong> ${order.address}</p>
          <p><strong>Order Time:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <br>
        <a href="${process.env.ADMIN_URL || 'https://fancy-hamster-878a22.netlify.app'}" 
           style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
          Login to Admin Panel
        </a>
      </div>
    `;
    
    sendEmailNotification(emailSubject, emailMessage).catch(console.error);
    
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

// ---------- Reviews ----------
app.post('/api/frontend/review', async (req, res) => {
  try {
    const review = new Review(req.body);
    await review.save();
    
    const emailSubject = `⭐ New Review Submitted by ${review.name}`;
    const emailMessage = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #f59e0b;">⭐ New Review Submitted</h2>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 10px;">
          <p><strong>Name:</strong> ${review.name}</p>
          <p><strong>Location:</strong> ${review.location}</p>
          <p><strong>Rating:</strong> ${review.rating}/5</p>
          <p><strong>Review:</strong> ${review.text}</p>
          <p><strong>Submitted At:</strong> ${new Date(review.createdAt).toLocaleString()}</p>
        </div>
        <br>
        <a href="${process.env.ADMIN_URL || 'https://fancy-hamster-878a22.netlify.app'}#reviews" 
           style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
          Approve Review
        </a>
      </div>
    `;
    
    sendEmailNotification(emailSubject, emailMessage).catch(console.error);
    
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

// ---------- Sliders ----------
app.get('/api/frontend/sliders', async (req, res) => {
  try {
    const sliders = await Slider.find({ isActive: true }).sort({ slideNumber: 1 });
    res.json(sliders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Settings ----------
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

// ============================================
// ✅ ADMIN API - Protected Routes
// ============================================

// ---------- Authentication ----------
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (username === (process.env.ADMIN_USERNAME || 'admin') && 
      password === (process.env.ADMIN_PASSWORD || 'admin123')) {
    
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

// ---------- Dashboard Stats ----------
app.get('/api/admin/dashboard/stats', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    
    const deliveredOrders = await Order.find({ status: 'delivered' });
    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    
    const totalProducts = await Product.countDocuments();
    const totalReviews = await Review.countDocuments();
    const pendingReviews = await Review.countDocuments({ isApproved: false });
    
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    const unreadOrders = await Order.countDocuments({ isRead: false });
    const unreadReviews = await Review.countDocuments({ isRead: false });
    
    res.json({
      totalOrders,
      pendingOrders,
      deliveredOrders: deliveredOrders.length,
      totalRevenue,
      totalProducts,
      totalReviews,
      pendingReviews,
      recentOrders,
      unreadOrders,
      unreadReviews
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Notifications ----------
app.get('/api/admin/notifications', async (req, res) => {
  try {
    const unreadOrders = await Order.find({ isRead: false }).sort({ createdAt: -1 });
    const unreadReviews = await Review.find({ isRead: false }).sort({ createdAt: -1 });
    
    res.json({
      unreadOrders,
      unreadReviews
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/notifications/read', async (req, res) => {
  try {
    const { type, id } = req.body;
    
    if (type === 'order') {
      await Order.findByIdAndUpdate(id, { isRead: true });
    } else if (type === 'review') {
      await Review.findByIdAndUpdate(id, { isRead: true });
    } else if (type === 'all') {
      await Order.updateMany({ isRead: false }, { isRead: true });
      await Review.updateMany({ isRead: false }, { isRead: true });
    }
    
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Image Upload ----------
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
    
    const fileUrl = await uploadBase64ToCloudinary(base64, folder);
    
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

// ---------- Products Management (Admin) ----------
app.get('/api/admin/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/products', async (req, res) => {
  try {
    const productData = req.body;
    console.log('🔄 নতুন পণ্য তৈরি শুরু...');
    
    // Handle color images with Cloudinary
    if (productData.colors && Array.isArray(productData.colors)) {
      console.log(`🎨 ${productData.colors.length} টি রং প্রসেসিং...`);
      
      for (let i = 0; i < productData.colors.length; i++) {
        let color = productData.colors[i];
        
        if (color.imageFile && color.imageFile.startsWith('data:image/')) {
          console.log(`☁️ Cloudinary - রং ${i+1} ইমেজ আপলোড...`);
          const imageUrl = await uploadBase64ToCloudinary(color.imageFile, 'products/colors');
          
          if (imageUrl) {
            color.image = imageUrl;
            color.isBase64 = false;
          }
          delete color.imageFile;
        } else if (!color.image) {
          color.image = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
        }
      }
    }
    
    // Set category if not provided
    if (!productData.category) {
      productData.category = 'others';
    }
    
    // Calculate offer percentage if not provided
    if (!productData.offerPercentage && productData.regularPrice && productData.offerPrice) {
      productData.offerPercentage = Math.round(((productData.regularPrice - productData.offerPrice) / productData.regularPrice) * 100);
    }
    
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
    res.status(500).json({ 
      error: 'পণ্য তৈরি করতে সমস্যা হয়েছে',
      details: error.message 
    });
  }
});

app.put('/api/admin/products/:id', async (req, res) => {
  try {
    const productData = req.body;
    console.log(`🔄 পণ্য ${req.params.id} আপডেট শুরু...`);
    
    // Handle color images with Cloudinary
    if (productData.colors && Array.isArray(productData.colors)) {
      for (let i = 0; i < productData.colors.length; i++) {
        let color = productData.colors[i];
        
        if (color.imageFile && color.imageFile.startsWith('data:image/')) {
          console.log(`☁️ Cloudinary - রং ${i+1} ইমেজ আপলোড...`);
          const imageUrl = await uploadBase64ToCloudinary(color.imageFile, 'products/colors');
          
          if (imageUrl) {
            color.image = imageUrl;
            color.isBase64 = false;
          }
          delete color.imageFile;
        }
      }
    }
    
    // Recalculate offer percentage
    if (productData.regularPrice && productData.offerPrice) {
      productData.offerPercentage = Math.round(((productData.regularPrice - productData.offerPrice) / productData.regularPrice) * 100);
    }
    
    const product = await Product.findByIdAndUpdate(req.params.id, productData, { new: true });
    
    console.log('✅ পণ্য সফলভাবে আপডেট হয়েছে');
    
    res.json({ 
      success: true, 
      message: 'পণ্য সফলভাবে আপডেট হয়েছে', 
      product 
    });
  } catch (error) {
    console.error('❌ পণ্য আপডেট ত্রুটি:', error);
    res.status(500).json({ 
      error: 'পণ্য আপডেট করতে সমস্যা হয়েছে',
      details: error.message 
    });
  }
});

app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'পণ্য সফলভাবে ডিলিট হয়েছে' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Orders Management (Admin) ----------
app.get('/api/admin/orders', async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) {
      query.status = status;
    }
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
      { status, notes, isRead: true },
      { new: true }
    );
    res.json({ success: true, message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Reviews Management (Admin) ----------
app.get('/api/admin/reviews', async (req, res) => {
  try {
    const { approved } = req.query;
    let query = {};
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
      { isApproved: true, isRead: true },
      { new: true }
    );
    res.json({ success: true, message: 'Review approved', review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/reviews/:id', async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- Sliders Management (Admin) ----------
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
    console.log('🔄 নতুন স্লাইডার তৈরি শুরু...');
    
    // Handle image upload to Cloudinary
    if (sliderData.imageFile && sliderData.imageFile.startsWith('data:image/')) {
      console.log('☁️ স্লাইডার ইমেজ Cloudinary তে আপলোড...');
      const imageUrl = await uploadBase64ToCloudinary(sliderData.imageFile, 'sliders');
      
      if (imageUrl) {
        sliderData.imageUrl = imageUrl;
        sliderData.isBase64 = false;
      }
      delete sliderData.imageFile;
    } else if (!sliderData.imageUrl) {
      sliderData.imageUrl = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80';
    }
    
    const slider = new Slider(sliderData);
    await slider.save();
    
    console.log('✅ স্লাইডার সফলভাবে তৈরি হয়েছে');
    
    res.json({ 
      success: true, 
      message: 'স্লাইডার সফলভাবে যোগ করা হয়েছে',
      slider 
    });
    
  } catch (error) {
    console.error('❌ স্লাইডার তৈরি ত্রুটি:', error);
    res.status(500).json({ 
      error: 'স্লাইডার তৈরি করতে সমস্যা হয়েছে',
      details: error.message 
    });
  }
});

app.put('/api/admin/sliders/:id', async (req, res) => {
  try {
    const sliderData = req.body;
    console.log(`🔄 স্লাইডার ${req.params.id} আপডেট শুরু...`);
    
    if (sliderData.imageFile && sliderData.imageFile.startsWith('data:image/')) {
      console.log('☁️ স্লাইডার ইমেজ Cloudinary তে আপলোড...');
      const imageUrl = await uploadBase64ToCloudinary(sliderData.imageFile, 'sliders');
      
      if (imageUrl) {
        sliderData.imageUrl = imageUrl;
        sliderData.isBase64 = false;
      }
      delete sliderData.imageFile;
    }
    
    const slider = await Slider.findByIdAndUpdate(
      req.params.id,
      sliderData,
      { new: true }
    );
    
    console.log('✅ স্লাইডার সফলভাবে আপডেট হয়েছে');
    
    res.json({ 
      success: true, 
      message: 'স্লাইডার আপডেট হয়েছে', 
      slider 
    });
  } catch (error) {
    console.error('❌ স্লাইডার আপডেট ত্রুটি:', error);
    res.status(500).json({ 
      error: 'স্লাইডার আপডেট করতে সমস্যা হয়েছে',
      details: error.message 
    });
  }
});

// ---------- Settings Management (Admin) ----------
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
    res.json({ success: true, message: 'Settings updated', settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ✅ Database Initialization
// ============================================

async function initializeDatabase() {
  try {
    console.log('🔄 ডাটাবেস ইনিশিয়ালাইজ করা হচ্ছে...');
    
    // Create default admin if not exists
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      await Admin.create({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123'
      });
      console.log('✅ ডিফল্ট এডমিন তৈরি করা হয়েছে');
    }
    
    // Create default settings if not exists
    const settingsCount = await WebsiteSettings.countDocuments();
    if (settingsCount === 0) {
      await WebsiteSettings.create({
        whatsappNumber: '01911465879',
        phoneNumber: '01911465879',
        footerText: 'প্রিমিয়াম পাঞ্জাবি, টি-শার্ট, থ্রি পিজ ও ফিটনেস পরিধানের নির্ভরযোগ্য ঠিকানা',
        deliveryChargeInsideDhaka: 60,
        deliveryChargeOutsideDhaka: 160,
        serviceHours: 'সকাল ৯টা - রাত ১০টা',
        homePageTitle: 'আমাদের কালেকশন',
        orderFormTitle: 'পণ্য অর্ডার ফর্ম'
      });
      console.log('✅ ডিফল্ট সেটিংস তৈরি করা হয়েছে');
    }
    
    // Create sample products if none exist
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      await Product.create([
        {
          name: "রয়েল সিল্ক পাঞ্জাবি",
          description: "উচ্চমানের সিল্ক কাপড়ে তৈরি, হাতে তৈরি এমব্রয়ডারি, ফিটিং ডিজাইন",
          category: "panjabi",
          colors: [{
            name: "লাল ও সোনালী",
            code: "#dc2626",
            image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
          }],
          size: "S, M, L, XL, XXL",
          regularPrice: 3200,
          offerPrice: 2499,
          offerPercentage: 22,
          isActive: true,
          hasVariants: true
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
          isActive: true,
          hasVariants: true
        },
        {
          name: "স্ট্রেচিং ব্যান্ড",
          description: "হাত ও কাঁধের ফ্লেক্সিবিলিটি বাড়াতে, জিম ও হোম ওয়ার্কআউটের জন্য",
          category: "fitness",
          colors: [{
            name: "কালো",
            code: "#000000",
            image: "https://images.unsplash.com/photo-1581092921461-39b9c3e7b7b5?w=800"
          }],
          size: "One Size",
          regularPrice: 690,
          offerPrice: 490,
          offerPercentage: 29,
          features: ["উচ্চমানের ল্যাটেক্স ম্যাটেরিয়াল", "হাত ও কাঁধের স্ট্রেচিং", "ফ্লেক্সিবিলিটি বৃদ্ধি"],
          hasVariants: false,
          isActive: true
        }
      ]);
      console.log('✅ স্যাম্পল পণ্য তৈরি করা হয়েছে');
    }
    
    // Create sample sliders if none exist
    const sliderCount = await Slider.countDocuments();
    if (sliderCount === 0) {
      await Slider.create([
        {
          slideNumber: 1,
          title: "রয়েল সিল্ক",
          subtitle: "পাঞ্জাবি",
          description: "হাতে তৈরি এমব্রয়ডারি, উচ্চমানের সিল্ক কাপড়, রাজকীয় অভিজ্ঞতা",
          imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
          badgeText: "প্রিমিয়াম কালেকশন",
          badgeColor: "red",
          price: 2499,
          originalPrice: 3200,
          isActive: true
        },
        {
          slideNumber: 2,
          title: "টি-শার্ট",
          subtitle: "কালেকশন",
          description: "আরামদায়ক ও ফ্যাশনেবল প্রিমিয়াম কটন টি-শার্ট",
          imageUrl: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=1600",
          badgeText: "নতুন কালেকশন",
          badgeColor: "green",
          price: 690,
          originalPrice: 990,
          isActive: true
        },
        {
          slideNumber: 3,
          title: "থ্রি পিজ",
          subtitle: "সেট",
          description: "পাঞ্জাবি + পায়জামা + কোট, সম্পূর্ণ রয়েল লুক",
          imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1600",
          badgeText: "২৪% ছাড়",
          badgeColor: "purple",
          price: 3490,
          originalPrice: 4590,
          isActive: true
        }
      ]);
      console.log('✅ স্যাম্পল স্লাইডার তৈরি করা হয়েছে');
    }
    
    console.log('✅ ডাটাবেস ইনিশিয়ালাইজেশন সম্পূর্ণ');
  } catch (error) {
    console.error('❌ ডাটাবেস ইনিশিয়ালাইজেশন ত্রুটি:', error.message);
  }
}

// ============================================
// ✅ Start Server
// ============================================

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
  console.log('\n=================================');
  console.log(`🚀 সার্ভার পোর্ট ${PORT} এ চলছে`);
  console.log('=================================');
  console.log(`📡 লোকাল: http://localhost:${PORT}`);
  console.log(`📡 হেলথ চেক: http://localhost:${PORT}/health`);
  console.log(`☁️ Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'কনফিগার্ড' : 'না'}`);
  console.log(`📧 ইমেইল: ${process.env.EMAIL_USER ? 'এনাবলড' : 'ডিসএবলড'}`);
  console.log(`📁 আপলোড ডির: ${uploadsDir}`);
  console.log('=================================\n');
  
  // Test Cloudinary connection
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      await cloudinary.uploader.upload(testImage, { folder: 'test' });
      console.log('✅ Cloudinary কানেকশন সফল!');
    } catch (error) {
      console.error('❌ Cloudinary কানেকশন ব্যর্থ:', error.message);
    }
  }
  
  // Initialize database after connection
  setTimeout(initializeDatabase, 2000);
});

// Handle graceful shutdown
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