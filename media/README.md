# 🎨 Media Assets Library for Infamous Freight Enterprises

> **Complete visual identity, branding assets, technical diagrams, and promotional materials**
>
> Last Updated: February 19, 2026

---

## 📁 Directory Structure

```
media/
├── branding/              # Logo, wordmark, color palette
│   ├── logo/             # SVG and PNG logos in various sizes
│   ├── wordmark/         # Text-only branding
│   ├── favicon/          # Website favicons
│   └── colors/           # Brand color specifications
├── diagrams/             # Technical architecture diagrams
│   ├── architecture/     # System architecture
│   ├── flows/            # User flows and process diagrams
│   ├── database/         # Database schemas and ERDs
│   └── deployment/       # Infrastructure diagrams
├── screenshots/          # Application screenshots
│   ├── web/              # Web app screenshots
│   ├── mobile/           # Mobile app screenshots
│   └── api/              # API documentation screenshots
├── videos/               # Video content
│   ├── demos/            # Product demonstration videos
│   ├── tutorials/        # How-to tutorials
│   ├── promotional/      # Marketing videos
│   └── storyboards/      # Video planning storyboards
├── social/               # Social media assets
│   ├── og-images/        # Open Graph images
│   ├── twitter-cards/    # Twitter card images
│   ├── linkedin/         # LinkedIn post images
│   └── templates/        # Social media templates
├── presentations/        # Pitch decks and presentations
├── mockups/              # UI/UX mockups and wireframes
└── scripts/              # Asset generation scripts
```

---

## 🎨 Brand Identity

### Primary Logo
- **Format:** SVG (vector), PNG (raster)
- **Sizes:** 512x512, 256x256, 128x128, 64x64, 32x32
- **Variations:** Full color, white, black, monochrome
- **Usage:** Website header, app icon, documentation

### Color Palette

#### Primary Colors
- **Freight Blue:** `#1E3A8A` (RGB: 30, 58, 138)
- **Dynamic Orange:** `#F97316` (RGB: 249, 115, 22)
- **Professional Gray:** `#1F2937` (RGB: 31, 41, 55)

#### Secondary Colors
- **Success Green:** `#10B981` (RGB: 16, 185, 129)
- **Warning Yellow:** `#FBBF24` (RGB: 251, 191, 36)
- **Error Red:** `#EF4444` (RGB: 239, 68, 68)
- **Info Cyan:** `#06B6D4` (RGB: 6, 182, 212)

#### Neutral Colors
- **White:** `#FFFFFF`
- **Light Gray:** `#F3F4F6`
- **Medium Gray:** `#9CA3AF`
- **Dark Gray:** `#374151`
- **Black:** `#111827`

### Typography
- **Headings:** Inter Bold (700)
- **Body:** Inter Regular (400)
- **Code:** Fira Code

---

## 📐 Asset Specifications

### Logo Specifications
| Asset | Size | Format | Usage |
|-------|------|--------|-------|
| App Icon | 1024x1024 | PNG | iOS/Android app icon |
| Favicon | 32x32, 16x16 | ICO/PNG | Website favicon |
| Header Logo | 200x60 | SVG/PNG | Website header |
| Footer Logo | 150x45 | SVG/PNG | Website footer |
| Email Logo | 600x180 | PNG | Email templates |
| Social Profile | 400x400 | PNG | Social media profiles |

### Screenshot Specifications
| Type | Size | Format | DPI |
|------|------|--------|-----|
| Desktop | 1920x1080 | PNG | 72 |
| Tablet | 1024x768 | PNG | 72 |
| Mobile | 375x667 | PNG | 144 |
| API Docs | 1280x720 | PNG | 72 |

### Video Specifications
| Type | Resolution | Format | FPS | Duration |
|------|------------|--------|-----|----------|
| Product Demo | 1920x1080 | MP4 | 30 | 2-5 min |
| Tutorial | 1280x720 | MP4 | 30 | 5-10 min |
| Social Teaser | 1080x1080 | MP4 | 30 | 15-30 sec |
| YouTube | 1920x1080 | MP4 | 60 | Variable |

### Social Media Specifications
| Platform | Image Size | Aspect Ratio |
|----------|------------|--------------|
| Open Graph | 1200x630 | 1.91:1 |
| Twitter Card | 1200x600 | 2:1 |
| LinkedIn | 1200x627 | 1.91:1 |
| Instagram Post | 1080x1080 | 1:1 |
| Instagram Story | 1080x1920 | 9:16 |
| Facebook Post | 1200x630 | 1.91:1 |

---

## 🎬 Video Content Plan

### 1. Product Demo Videos
- **Homepage Overview** (2 min) - Landing page walkthrough
- **Shipment Creation** (3 min) - Creating a shipment from start to finish
- **Real-time Tracking** (2 min) - Live tracking features
- **Analytics Dashboard** (3 min) - Business intelligence features
- **Mobile App Demo** (4 min) - Mobile app features

### 2. Tutorial Videos
- **Getting Started** (5 min) - Account setup and first shipment
- **API Integration** (8 min) - Integrating with the API
- **Webhook Setup** (6 min) - Configuring webhooks
- **Advanced Features** (10 min) - AI commands, voice, analytics

### 3. Promotional Videos
- **Product Teaser** (30 sec) - Quick feature showcase
- **Customer Testimonials** (2 min) - Success stories
- **Company Story** (3 min) - About Infamous Freight

---

## 📊 Technical Diagrams Needed

### Architecture Diagrams
- [ ] System Architecture Overview
- [ ] Microservices Architecture
- [ ] Data Flow Diagram
- [ ] Infrastructure Topology
- [ ] Security Architecture
- [ ] API Architecture

### Database Diagrams
- [ ] Entity Relationship Diagram (ERD)
- [ ] Database Schema
- [ ] Data Model

### Process Flow Diagrams
- [ ] User Registration Flow
- [ ] Shipment Creation Flow
- [ ] Payment Processing Flow
- [ ] Webhook Event Flow
- [ ] CI/CD Pipeline Flow

### Deployment Diagrams
- [ ] Production Infrastructure
- [ ] Staging Environment
- [ ] Development Setup
- [ ] Multi-region Deployment

---

## 🖼️ Screenshot Plan

### Web Application
- [ ] Landing Page
- [ ] Dashboard
- [ ] Shipment List
- [ ] Shipment Details
- [ ] Create Shipment Form
- [ ] Real-time Tracking Map
- [ ] Analytics Dashboard
- [ ] User Profile
- [ ] Settings Page
- [ ] API Documentation

### Mobile Application
- [ ] Splash Screen
- [ ] Login Screen
- [ ] Home Dashboard
- [ ] Shipment List (Mobile)
- [ ] Shipment Details (Mobile)
- [ ] QR Code Scanner
- [ ] Push Notifications
- [ ] Offline Mode

### API Documentation
- [ ] Swagger UI
- [ ] Endpoint Examples
- [ ] Response Examples
- [ ] Authentication Flow

---

## 🚀 Asset Generation Scripts

### Available Scripts
```bash
# Generate all branding assets
npm run media:generate-branding

# Generate technical diagrams
npm run media:generate-diagrams

# Capture screenshots (with Playwright)
npm run media:screenshots

# Generate video from storyboard
npm run media:generate-video <storyboard-name>

# Optimize all images
npm run media:optimize

# Generate social media variants
npm run media:social
```

---

## 📦 Asset Delivery

### For Development
- Assets available in `/media` directory
- Optimized for web delivery (< 100KB each)
- SVG preferred for logos and icons

### For Production
- Hosted on CDN (Cloudflare R2 / AWS S3)
- Optimized with WebP/AVIF formats
- Responsive image sets generated

### For Marketing
- High-resolution print-ready files
- PDF vector formats
- Brand guidelines package

---

## 🎯 Usage Guidelines

### Logo Usage
✅ **DO:**
- Use official logo files from this directory
- Maintain clear space around logo (minimum: logo height)
- Use approved color variations only
- Ensure minimum size: 32px height for digital, 0.5" for print

❌ **DON'T:**
- Distort or stretch the logo
- Change logo colors outside brand palette
- Add effects (shadows, gradients, outlines)
- Place logo on busy backgrounds

### Photography Style
- **Modern and Clean:** Professional, high-quality images
- **Consistent Lighting:** Natural, bright lighting
- **Authentic:** Real people, real scenarios
- **On-brand:** Incorporate brand colors subtly

### Video Style
- **Concise:** Get to the point quickly
- **Professional:** High-quality production
- **Engaging:** Dynamic cuts, music, narration
- **Branded:** Logo watermark, brand colors

---

## 📋 Asset Checklist

### Essential Assets (MVP)
- [x] Primary Logo (SVG)
- [x] Favicon (ICO)
- [x] Color Palette Definition
- [ ] Homepage Screenshot
- [ ] Dashboard Screenshot
- [ ] Product Demo Video (2 min)
- [ ] Open Graph Image

### Nice-to-Have Assets
- [ ] Animated Logo
- [ ] Icon Set
- [ ] Illustration Set
- [ ] Empty State Images
- [ ] Loading Animations
- [ ] Tutorial Videos
- [ ] Customer Testimonial Videos

### Advanced Assets
- [ ] 3D Product Renders
- [ ] Interactive Demos
- [ ] Animated Explainer Videos
- [ ] AR/VR Assets

---

## 🔗 External Resources

### Design Tools
- **Figma:** UI/UX design and prototyping
- **Canva:** Social media graphics
- **Adobe Creative Suite:** Professional design work
- **Mermaid:** Diagram generation from code
- **Excalidraw:** Hand-drawn style diagrams

### Stock Resources (if needed)
- **Unsplash:** Free stock photography
- **Pexels:** Free stock videos
- **IconScout:** Icon libraries
- **Google Fonts:** Typography

---

## 📞 Contact

For media asset requests or questions:
- **Design Team:** design@infamousfreight.com
- **Marketing Team:** marketing@infamousfreight.com
- **Documentation:** docs@infamousfreight.com

---

**Version:** 1.0.0  
**Last Updated:** February 19, 2026  
**Maintained by:** Infamous Freight Design Team
