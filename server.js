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

// ✅ ক্লাউডিনারি কনফিগারেশন
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dorpsn4nf',
  api_key: process.env.CLOUDINARY_API_KEY || '185325533762674',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Z6Dk5ZgVpFVXHlXFPli8MhmLMyg',
  secure: true
});

// ✅ মিডলওয়্যার
app.use(cors({
  origin: [
    'https://hilarious-rolypoly-c0d8ff.netlify.app',
    'https://fancy-hamster-878a22.netlify.app',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
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

// ✅ আপলোড ডিরেক্টরি
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ✅ MongoDB কানেকশন
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jahirkhanlavaa_db_user:F08lxNuvuuJTnVwK@cluster0.w1uufvt.mongodb.net/RoyalTrustBD?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// ============================================
// স্কিমা ডেফিনিশন
// ============================================

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['panjabi', 'tshirt', 'three-piece', 'fitness'],
    default: 'panjabi'
  },
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
  hasVariants: { type: Boolean, default: true },
  features: [String],
  createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  productCategory: { type: String },
  color: { type: String, default: 'ডিফল্ট' },
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
  slideNumber: { type: Number, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  badgeText: { type: String },
  badgeColor: { 
    type: String,
    enum: ['red', 'blue', 'green', 'purple', 'amber'],
    default: 'red'
  },
  price: { type: Number },
  originalPrice: { type: Number },
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
  lastLogin: { type: Date }
});

// ============================================
// মডেল
// ============================================

const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Review = mongoose.model('Review', reviewSchema);
const Slider = mongoose.model('Slider', sliderSchema);
const WebsiteSettings = mongoose.model('WebsiteSettings', websiteSettingsSchema);
const Admin = mongoose.model('Admin', adminSchema);

// ============================================
// হেল্পার ফাংশন
// ============================================

function generateOrderId() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RT${timestamp}${random}`;
}

// ✅ ক্লাউডিনারি আপলোড ফাংশন
const uploadBase64ToCloudinary = async (base64String, folder = 'products') => {
  try {
    console.log(`☁️ Cloudinary আপলোড শুরু (${folder})`);
    
    const result = await cloudinary.uploader.upload(base64String, {
      folder: `royal_trust/${folder}`,
      resource_type: 'auto',
      timeout: 60000,
      transformation: [
        { width: 1200, height: 800, crop: "limit" },
        { quality: "auto:good" }
      ]
    });
    
    console.log(`✅ Cloudinary আপলোড সফল: ${result.secure_url.substring(0, 50)}...`);
    return result.secure_url;
    
  } catch (error) {
    console.error('❌ Cloudinary ত্রুটি:', error.message);
    
    // ফলব্যাক লোকাল স্টোরেজ
    try {
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `${folder}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, buffer);
      return `/uploads/${filename}`;
    } catch (fallbackError) {
      console.error('❌ ফলব্যাক ত্রুটি:', fallbackError.message);
      return folder === 'sliders' 
        ? 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1600'
        : 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800';
    }
  }
};

// ✅ ইমেইল নোটিফিকেশন
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'jahirkhan.lavaa@gmail.com',
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmailNotification(subject, message) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('📧 ইমেইল কনফিগার করা নেই');
    return;
  }
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: subject,
      html: message
    });
    console.log('✅ ইমেইল পাঠানো হয়েছে');
  } catch (error) {
    console.error('❌ ইমেইল ত্রুটি:', error.message);
  }
}

// ============================================
// হেলথ চেক ও টেস্ট এন্ডপয়েন্ট
// ============================================

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Royal Trust BD API',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
    uptime: process.uptime()
  });
});

app.get('/api/test-cloudinary', async (req, res) => {
  try {
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const result = await cloudinary.uploader.upload(testImage, { folder: 'test' });
    res.json({ success: true, url: result.secure_url });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ফ্রন্টএন্ড পাবলিক API
// ============================================

// ✅ পণ্য
app.get('/api/frontend/products', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ অর্ডার
app.post('/api/frontend/order', async (req, res) => {
  try {
    const orderData = req.body;
    orderData.orderId = generateOrderId();
    
    const order = new Order(orderData);
    await order.save();
    
    // ইমেইল নোটিফিকেশন (নন-ব্লকিং)
    sendEmailNotification(
      `🆕 নতুন অর্ডার #${order.orderId}`,
      `<h2>নতুন অর্ডার</h2>
       <p><strong>অর্ডার আইডি:</strong> ${order.orderId}</p>
       <p><strong>নাম:</strong> ${order.customerName}</p>
       <p><strong>ফোন:</strong> ${order.phone}</p>
       <p><strong>পণ্য:</strong> ${order.productName}</p>
       <p><strong>পরিমাণ:</strong> ${order.quantity}</p>
       <p><strong>মূল্য:</strong> ${order.totalPrice} টাকা</p>`
    ).catch(() => {});
    
    res.json({
      success: true,
      message: 'অর্ডার সফল হয়েছে',
      orderId: order.orderId
    });
    
  } catch (error) {
    console.error('❌ অর্ডার ত্রুটি:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ রিভিউ
app.post('/api/frontend/review', async (req, res) => {
  try {
    const review = new Review(req.body);
    await review.save();
    
    sendEmailNotification(
      `⭐ নতুন রিভিউ - ${review.name}`,
      `<h2>নতুন রিভিউ</h2>
       <p><strong>নাম:</strong> ${review.name}</p>
       <p><strong>অবস্থান:</strong> ${review.location}</p>
       <p><strong>রেটিং:</strong> ${review.rating}/5</p>
       <p><strong>রিভিউ:</strong> ${review.text}</p>`
    ).catch(() => {});
    
    res.json({ success: true, message: 'রিভিউ জমা হয়েছে', review });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ এপ্রুভড রিভিউ
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

// ✅ স্লাইডার
app.get('/api/frontend/sliders', async (req, res) => {
  try {
    const sliders = await Slider.find({ isActive: true }).sort({ slideNumber: 1 });
    res.json(sliders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ সেটিংস
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
// এডমিন API
// ============================================

// ✅ লগইন
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
    
    res.json({ success: true, message: 'Login successful', username });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// ✅ ড্যাশবোর্ড স্ট্যাটস
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
    
    res.json({
      totalOrders,
      pendingOrders,
      deliveredOrders: deliveredOrders.length,
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

// ✅ নোটিফিকেশন
app.get('/api/admin/notifications', async (req, res) => {
  try {
    const unreadOrders = await Order.find({ isRead: false }).sort({ createdAt: -1 });
    const unreadReviews = await Review.find({ isRead: false }).sort({ createdAt: -1 });
    res.json({ unreadOrders, unreadReviews });
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
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ পণ্য ব্যবস্থাপনা (ক্লাউডিনারি সহ)
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
    console.log('📦 নতুন পণ্য তৈরি');
    
    // ক্লাউডিনারি ইমেজ আপলোড
    if (productData.colors && Array.isArray(productData.colors)) {
      for (let i = 0; i < productData.colors.length; i++) {
        const color = productData.colors[i];
        
        if (color.imageFile && color.imageFile.startsWith('data:image/')) {
          color.image = await uploadBase64ToCloudinary(color.imageFile, 'products');
          delete color.imageFile;
        }
      }
    }
    
    // ক্যাটাগরি সেট
    if (!productData.category) {
      if (productData.name?.toLowerCase().includes('পাঞ্জাবি')) productData.category = 'panjabi';
      else if (productData.name?.toLowerCase().includes('টি-শার্ট')) productData.category = 'tshirt';
      else if (productData.name?.toLowerCase().includes('থ্রি')) productData.category = 'three-piece';
      else if (productData.name?.toLowerCase().includes('ফিটনেস')) {
        productData.category = 'fitness';
        productData.hasVariants = false;
      }
    }
    
    // ফিটনেস প্রোডাক্টের জন্য ফিচার
    if (productData.category === 'fitness' && !productData.features) {
      productData.features = [
        'উচ্চমানের ম্যাটেরিয়াল',
        'টেকসই ও আরামদায়ক',
        'পেশীর শক্তি বৃদ্ধি',
        'ফ্লেক্সিবিলিটি উন্নয়ন'
      ];
    }
    
    const product = new Product(productData);
    await product.save();
    
    console.log('✅ পণ্য তৈরি সফল');
    res.json({ success: true, message: 'পণ্য যোগ হয়েছে', product });
    
  } catch (error) {
    console.error('❌ পণ্য ত্রুটি:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/products/:id', async (req, res) => {
  try {
    const productData = req.body;
    
    if (productData.colors) {
      for (let i = 0; i < productData.colors.length; i++) {
        const color = productData.colors[i];
        if (color.imageFile && color.imageFile.startsWith('data:image/')) {
          color.image = await uploadBase64ToCloudinary(color.imageFile, 'products');
          delete color.imageFile;
        }
      }
    }
    
    const product = await Product.findByIdAndUpdate(req.params.id, productData, { new: true });
    res.json({ success: true, message: 'পণ্য আপডেট হয়েছে', product });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'পণ্য ডিলিট হয়েছে' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ অর্ডার ব্যবস্থাপনা
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

// ✅ রিভিউ ব্যবস্থাপনা
app.get('/api/admin/reviews', async (req, res) => {
  try {
    const { approved } = req.query;
    const query = approved !== undefined ? { isApproved: approved === 'true' } : {};
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
    res.json({ success: true, message: 'রিভিউ ডিলিট হয়েছে' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ স্লাইডার ব্যবস্থাপনা (ক্লাউডিনারি সহ)
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
    
    if (sliderData.imageFile && sliderData.imageFile.startsWith('data:image/')) {
      sliderData.imageUrl = await uploadBase64ToCloudinary(sliderData.imageFile, 'sliders');
      delete sliderData.imageFile;
    }
    
    const slider = new Slider(sliderData);
    await slider.save();
    
    res.json({ success: true, message: 'স্লাইডার যোগ হয়েছে', slider });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/sliders/:id', async (req, res) => {
  try {
    const sliderData = req.body;
    
    if (sliderData.imageFile && sliderData.imageFile.startsWith('data:image/')) {
      sliderData.imageUrl = await uploadBase64ToCloudinary(sliderData.imageFile, 'sliders');
      delete sliderData.imageFile;
    }
    
    const slider = await Slider.findByIdAndUpdate(req.params.id, sliderData, { new: true });
    res.json({ success: true, slider });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ সেটিংস
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
// ইমেজ আপলোড এন্ডপয়েন্ট
// ============================================

app.post('/api/upload', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'কোন ফাইল নেই' });
    }
    
    const file = req.files.file;
    const folder = req.body.folder || 'general';
    
    const base64 = `data:${file.mimetype};base64,${file.data.toString('base64')}`;
    const url = await uploadBase64ToCloudinary(base64, folder);
    
    res.json({ success: true, url });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload/base64', async (req, res) => {
  try {
    const { base64, folder = 'general' } = req.body;
    
    if (!base64 || !base64.startsWith('data:image/')) {
      return res.status(400).json({ error: 'ভ্যালিড base64 ইমেজ দিন' });
    }
    
    const url = await uploadBase64ToCloudinary(base64, folder);
    res.json({ success: true, url });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ডাটাবেস ইনিশিয়ালাইজ
// ============================================

async function initializeDatabase() {
  try {
    console.log('🔄 ডাটাবেস ইনিশিয়ালাইজ...');
    
    // সেটিংস
    const settingsCount = await WebsiteSettings.countDocuments();
    if (settingsCount === 0) {
      await new WebsiteSettings().save();
      console.log('✅ ডিফল্ট সেটিংস তৈরি');
    }
    
    // স্লাইডার
    const sliderCount = await Slider.countDocuments();
    if (sliderCount === 0) {
      await Slider.insertMany([
        {
          slideNumber: 1,
          title: 'রয়েল ট্রাস্ট BD',
          subtitle: 'প্রিমিয়াম পাঞ্জাবি',
          description: 'উচ্চমানের পাঞ্জাবি ও ফ্যাশনেবল পোশাক',
          imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1600',
          badgeText: 'সীমিত সময়ের অফার',
          badgeColor: 'red',
          price: 3990,
          originalPrice: 5990,
          isActive: true
        },
        {
          slideNumber: 2,
          title: 'টি-শার্ট কালেকশন',
          subtitle: 'প্রিমিয়াম কটন',
          description: 'আরামদায়ক ও ফ্যাশনেবল টি-শার্ট',
          imageUrl: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=1600',
          badgeText: 'নতুন কালেকশন',
          badgeColor: 'green',
          price: 690,
          originalPrice: 990,
          isActive: true
        },
        {
          slideNumber: 3,
          title: 'থ্রি পিজ সেট',
          subtitle: 'রয়েল লুক',
          description: 'সম্পূর্ণ থ্রি পিজ সেট',
          imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1600',
          badgeText: '২৪% ছাড়',
          badgeColor: 'purple',
          price: 3490,
          originalPrice: 4590,
          isActive: true
        }
      ]);
      console.log('✅ ডিফল্ট স্লাইডার তৈরি');
    }
    
    // পণ্য
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      await Product.insertMany([
        {
          name: 'রয়েল ব্লু পাঞ্জাবি',
          description: 'সুতি কটন প্রিমিয়াম কোয়ালিটি',
          category: 'panjabi',
          regularPrice: 1890,
          offerPrice: 1390,
          offerPercentage: 26,
          size: 'S, M, L, XL, XXL',
          isActive: true,
          colors: [
            { name: 'রয়েল ব্লু', code: '#4169E1', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800' },
            { name: 'কালো', code: '#000000', image: 'https://images.unsplash.com/photo-1583391733956-6c882764b7df?w=800' }
          ]
        },
        {
          name: 'প্রিমিয়াম কটন টি-শার্ট',
          description: '১০০% সুতি কাপড়, আরামদায়ক ফিট',
          category: 'tshirt',
          regularPrice: 990,
          offerPrice: 690,
          offerPercentage: 30,
          size: 'S, M, L, XL, XXL',
          isActive: true,
          colors: [
            { name: 'কালো', code: '#000000', image: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=800' },
            { name: 'নেভি ব্লু', code: '#000080', image: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=800' }
          ]
        },
        {
          name: 'স্ট্রেচিং ব্যান্ড',
          description: 'হাত ও কাঁধের ফ্লেক্সিবিলিটি বাড়াতে',
          category: 'fitness',
          regularPrice: 690,
          offerPrice: 490,
          offerPercentage: 29,
          size: 'One Size',
          isActive: true,
          hasVariants: false,
          features: [
            'উচ্চমানের ল্যাটেক্স ম্যাটেরিয়াল',
            'হাত ও কাঁধের স্ট্রেচিং',
            'ফ্লেক্সিবিলিটি বৃদ্ধি',
            'পেশীর টান কমাতে সাহায্য করে'
          ]
        }
      ]);
      console.log('✅ ডিফল্ট পণ্য তৈরি');
    }
    
    console.log('✅ ডাটাবেস ইনিশিয়ালাইজ সম্পূর্ণ');
    
  } catch (error) {
    console.error('❌ ইনিশিয়ালাইজ ত্রুটি:', error.message);
  }
}

// ============================================
// সার্ভার স্টার্ট
// ============================================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log('\n=================================');
  console.log(`🚀 সার্ভার: http://localhost:${PORT}`);
  console.log(`📡 হেলথ: http://localhost:${PORT}/health`);
  console.log(`☁️ ক্লাউডিনারি: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅' : '❌'}`);
  console.log(`📧 ইমেইল: ${process.env.EMAIL_USER ? '✅' : '❌ (সেট করুন)'}`);
  console.log('=================================\n');
  
  setTimeout(initializeDatabase, 2000);
});

process.on('SIGTERM', () => {
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});