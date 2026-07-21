# Setup Instructions

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn

## Installation Steps

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to:
```
http://localhost:5173
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Header.jsx   # Top navigation bar
│   ├── Navigation.jsx # Menu navigation
│   ├── Footer.jsx   # Footer with contact info
│   ├── NewsBar.jsx  # Top news ticker
│   └── Layout.jsx   # Main layout wrapper
├── pages/           # Page components
│   ├── Home.jsx
│   ├── About.jsx
│   ├── Contact.jsx
│   ├── RequestProduct.jsx
│   ├── ProductList.jsx
│   ├── ProductDetail.jsx
│   ├── Cart.jsx
│   └── Wishlist.jsx
├── context/         # React Context providers
│   ├── CartContext.jsx
│   └── WishlistContext.jsx
├── data/            # Data files
│   └── products.js  # Product data
├── App.jsx          # Main app component with routing
├── main.jsx         # Entry point
└── index.css        # Global styles
```

## Features Implemented

✅ Home page with news bar, header, navigation, image slider, and product tiles
✅ Product listing page with filters and sorting
✅ Product detail page with image carousel
✅ Shopping cart functionality
✅ Wishlist functionality
✅ Contact Us page with form
✅ About Us page with scholar story
✅ Request a Product page
✅ Responsive design
✅ Indian traditional font styling
✅ Cream, brown, and purple color theme

## Notes

- Product images are currently using placeholder divs with emojis. Replace with actual product images.
- Map integration on Contact page needs Google Maps API or similar service.
- Form submissions currently just log to console - integrate with backend API.
- Delivery pincode check is simplified - integrate with actual delivery service API.

