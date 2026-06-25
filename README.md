# Fly On Earth — Premium E-Commerce Store

A modern, static e-commerce website for gaming chairs and premium products, built with vanilla HTML, CSS, and JavaScript. Designed for deployment on GitHub Pages.

## 🚀 Live Demo

[https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/](https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/)

## ✨ Features

- **Responsive Design** — Works seamlessly on desktop, tablet, and mobile
- **Product Catalog** — Browse products with search, filter by category, and sort by price
- **Shopping Cart** — Add/remove items, adjust quantities, persists in localStorage
- **Secure Checkout** — Order form with Google Apps Script backend integration
- **Admin Dashboard** — Login-protected panel to manage orders, view leads, and export data
- **Preloader Animation** — First-visit loading animation with smooth transition
- **Clean URLs** — 404 fallback handles clean URL navigation on GitHub Pages

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| HTML5 | Semantic page structure |
| CSS3 | Responsive styling, animations |
| Vanilla JavaScript | Client-side logic & interactivity |
| Google Apps Script | Backend API (orders, auth, contact forms) |
| GitHub Pages | Static hosting |

## 📁 Project Structure

```
├── index.html              # Home page
├── shop.html               # Product listing with filters
├── product.html            # Product detail page
├── cart.html               # Shopping cart
├── checkout.html           # Order checkout
├── about.html              # About us
├── contact.html            # Contact form
├── success.html            # Order confirmation
├── refund-policy.html      # Refund policy
├── terms-and-conditions.html
├── privacy-policy.html
├── admin-login.html        # Admin authentication
├── admin-dashboard.html    # Order management
├── 404.html                # Clean URL fallback
├── products.json           # Product data
│
├── css/
│   ├── style.css           # Main stylesheet
│   ├── preloader.css       # Preloader animation styles
│   └── admin.css           # Admin dashboard styles
│
├── js/
│   ├── config.js           # App configuration
│   ├── app.js              # Core layout, cart, toast
│   ├── preloader.js        # First-visit preloader
│   ├── productService.js   # Product data service
│   ├── home.js             # Home page rendering
│   ├── shop.js             # Shop page rendering
│   ├── product.js          # Product detail rendering
│   ├── cart.js             # Cart page logic
│   ├── checkout.js         # Checkout logic
│   └── admin.js            # Admin dashboard logic
│
├── assets/components/
│   ├── header.html         # Global header (injected via JS)
│   └── footer.html         # Global footer (injected via JS)
│
└── images/
    ├── logon.jpg           # Nav logo (dark background)
    └── logop.jpg           # Preloader logo
```

## 🚀 Deployment

### Deploy to GitHub Pages

1. **Create a GitHub repository** (public)
2. **Push your code**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```
3. **Enable GitHub Pages**:
   - Go to repository **Settings → Pages**
   - Select branch: `main`, folder: `/ (root)`
   - Click **Save**

Your site will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### Custom Domain (Optional)

Add a CNAME record pointing `yourdomain.com` to `YOUR_USERNAME.github.io` and configure in repository Settings → Pages.

## 📦 Updating Products

Edit `products.json` to add, remove, or modify products. Commit and push — GitHub Pages auto-deploys within 1-2 minutes.

## 🔧 Configuration

Edit `js/config.js` to update:
- `API_URL` — Google Apps Script deployment URL
- `TAX_RATE` — Tax percentage
- `SHIPPING_CHARGE` — Flat shipping rate
- `FREE_SHIPPING_ABOVE` — Free shipping threshold
- `CURRENCY` — Currency symbol
- `STORE_NAME` — Store display name

## 📄 License

All rights reserved. This project is proprietary software.

---

Built with ❤️ by FareEarth