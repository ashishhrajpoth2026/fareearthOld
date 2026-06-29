/**
 * =============================================================================
 * FAREEARTH - Application Core Module
 * =============================================================================
 * Handles global layout components (header/footer), cart management,
 * navigation, and utility functions.
 * 
 * @author Fareearth Dev Team
 * @version 2.1.0
 */

document.addEventListener("DOMContentLoaded", () => {
    initializeGlobalLayoutComponents();
});

/**
 * Returns the correct base path for asset loading.
 * 
 * For custom domain (fareearth.in): always returns '/' since all assets
 * are served from the root.
 * 
 * For GitHub Pages subpath (username.github.io/repo/): detects the repo
 * name from the URL path and returns it as the base path.
 * 
 * Detection logic:
 * - If hostname contains 'github.io', check if first path segment looks
 *   like a repo name (no file extension) and use it as base path.
 * - For all other cases (custom domain, local dev), return '/'.
 */
function getBasePath() {
    var path = window.location.pathname;
    var parts = path.split('/').filter(Boolean);

    // Only use subpath detection for GitHub Pages (username.github.io/repo)
    if (window.location.hostname.indexOf('github.io') !== -1) {
        if (parts.length > 0 && 
            parts[0].indexOf('.html') === -1 && 
            parts[0].indexOf('.') === -1) {
            return '/' + parts[0] + '/';
        }
    }

    // Custom domain (fareearth.in), local development, or any other case
    return '/';
}

async function initializeGlobalLayoutComponents() {
    const headerPortal = document.getElementById("header-portal");
    const footerPortal = document.getElementById("footer-portal");

    const basePath = getBasePath();

    if (headerPortal) {
        await fetchComponentElement(basePath + "assets/components/header.html", headerPortal);
        bindHeaderEventModules();
        highlightActiveNavItem();
    }
    if (footerPortal) {
        await fetchComponentElement(basePath + "assets/components/footer.html", footerPortal);
    }
    
    updateCartCount();
    showVerificationBanner();
}

async function fetchComponentElement(url, targetElement) {
    try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP error loading: ${url}`);
        const htmlContent = await response.text();
        targetElement.innerHTML = htmlContent;
    } catch (error) {
        console.error("Component load error:", error);
    }
}

function showVerificationBanner() {
    const banner = document.getElementById("verification-banner");
    if (banner) {
        // Show the banner briefly on page load, then fade out
        banner.style.display = "block";
        setTimeout(() => {
            banner.style.transition = "opacity 0.5s ease";
            banner.style.opacity = "0";
            setTimeout(() => {
                banner.style.display = "none";
                banner.style.opacity = "1";
            }, 500);
        }, 3000);
    }
}

function bindHeaderEventModules() {
    const toggleBtn = document.getElementById("menu-toggle-button");
    const navMenu = document.getElementById("primary-nav-menu");
    const header = document.querySelector(".app-header");
    const announcementBar = document.getElementById("announcement-bar");
    const announcementClose = document.getElementById("announcement-close");

    if (toggleBtn && navMenu) {
        toggleBtn.addEventListener("click", () => {
            const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
            toggleBtn.setAttribute("aria-expanded", !isExpanded);
            navMenu.classList.toggle("active");
        });

        navMenu.querySelectorAll(".nav-item").forEach(link => {
            link.addEventListener("click", () => {
                toggleBtn.setAttribute("aria-expanded", "false");
                navMenu.classList.remove("active");
            });
        });
    }

    if (header) {
        window.addEventListener("scroll", () => {
            header.classList.toggle("scrolled", window.scrollY > 20);
        }, { passive: true });
    }

    if (announcementBar && announcementClose) {
        if (sessionStorage.getItem("announcement_dismissed")) {
            announcementBar.classList.add("hidden");
        }

        announcementClose.addEventListener("click", () => {
            announcementBar.classList.add("hidden");
            sessionStorage.setItem("announcement_dismissed", "true");
        });
    }
}

function highlightActiveNavItem() {
    let currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
    
    let pageName = "index";
    if (currentPath === "/") {
        pageName = "index";
    } else {
        pageName = currentPath.replace(/^\//, "").replace(/\.html$/, "").replace(/\.php$/, "");
    }

    document.querySelectorAll(".nav-item[data-page]").forEach(item => {
        if (item.dataset.page === pageName) {
            item.classList.add("active");
        }
    });
}

function getCacheRecord(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (err) {
        return null;
    }
}

function setCacheRecord(key, value) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify({
                timestamp: Date.now(),
                data: value
            })
        );
    } catch (err) {
        console.warn("Cache write failed:", err);
    }
}

function isCacheValid(record, ttlMinutes) {
    if (!record || !record.timestamp) {
        return false;
    }
    const age = Date.now() - record.timestamp;
    return age < ttlMinutes * 60 * 1000;
}

function updateCartCount() {
    try {
        const cartItems = JSON.parse(localStorage.getItem("shopping_cart")) 
                       || JSON.parse(localStorage.getItem("cart")) 
                       || [];
                       
        const badge = document.getElementById("cart-count");

        if (badge) {
            const aggregateQuantity = cartItems.reduce((acc, current) => acc + (Number(current.quantity) || Number(current.qty) || 1), 0);
            badge.textContent = aggregateQuantity;
        }

        syncCartButtons();
    } catch (error) {
        console.error("Error updating cart UI:", error);
    }
}

function syncCartButtons() {
    try {
        const wrappers = document.querySelectorAll(".cart-btn-wrapper");
        if (wrappers.length === 0) return;

        const cart = JSON.parse(localStorage.getItem("cart") || "[]");

        wrappers.forEach(wrapper => {
            const id = wrapper.getAttribute("data-id");
            const name = wrapper.getAttribute("data-name");
            const price = parseFloat(wrapper.getAttribute("data-price") || "0");
            const image = wrapper.getAttribute("data-image");
            const isDetail = wrapper.getAttribute("data-is-detail") === "true";

            const cartItem = cart.find(item => item.id === id);
            const qty = cartItem ? (cartItem.qty || 1) : 0;

            if (qty === 0) {
                if (isDetail) {
                    wrapper.innerHTML = `
                        <button class="btn btn-primary" style="width: 100%;" onclick="inlineAddToCart('${id}', '${name.replace(/'/g, "\\'")}', ${price}, '${image}')">
                            Add to Cart
                        </button>
                    `;
                } else {
                    wrapper.innerHTML = `
                        <button class="btn-add-cart" onclick="inlineAddToCart('${id}', '${name.replace(/'/g, "\\'")}', ${price}, '${image}')">
                            Add to Cart
                        </button>
                    `;
                }
            } else {
                if (isDetail) {
                    wrapper.innerHTML = `
                        <div class="inline-qty-control detail-qty-control">
                            <span class="qty-text">Added</span>
                            <button class="qty-control-btn inc-btn" onclick="inlineChangeQty('${id}', 1)" aria-label="Increase quantity">+</button>
                            <span class="qty-count">(${qty})</span>
                            <button class="qty-control-btn dec-btn" onclick="inlineChangeQty('${id}', -1)" aria-label="Decrease quantity">-</button>
                        </div>
                    `;
                } else {
                    wrapper.innerHTML = `
                        <div class="inline-qty-control card-qty-control">
                            <span class="qty-text">Added</span>
                            <button class="qty-control-btn inc-btn" onclick="inlineChangeQty('${id}', 1)" aria-label="Increase quantity">+</button>
                            <span class="qty-count">(${qty})</span>
                            <button class="qty-control-btn dec-btn" onclick="inlineChangeQty('${id}', -1)" aria-label="Decrease quantity">-</button>
                        </div>
                    `;
                }
            }
        });
    } catch (err) {
        console.error("Error syncing cart buttons:", err);
    }
}

function inlineAddToCart(id, name, price, image) {
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find(p => p.id === id);

    if (existing) {
        existing.qty = (existing.qty || 1) + 1;
    } else {
        cart.push({ id, name, price, image, qty: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

function inlineChangeQty(id, delta) {
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingIndex = cart.findIndex(p => p.id === id);

    if (existingIndex > -1) {
        const item = cart[existingIndex];
        const newQty = (item.qty || 1) + delta;
        if (newQty <= 0) {
            cart.splice(existingIndex, 1);
        } else {
            item.qty = newQty;
        }
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

function clearAllClientStorage() {
    try {
        localStorage.clear();
        sessionStorage.clear();

        if (window.caches && caches.keys) {
            caches.keys()
                .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
                .catch((cacheError) => {
                    console.warn("Cache cleanup failed:", cacheError);
                });
        }

        updateCartCount();
        return true;
    } catch (error) {
        console.error("Failed to clear client storage:", error);
        return false;
    }
}

function initLazyLoadImages() {
    document.querySelectorAll("img[data-src]:not([src^='http'])").forEach(img => {
        if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
            img.classList.remove("lazy-load");
        }
    });
}

/**
 * Global image error handler - replaces broken images with a placeholder.
 * Attach via: <img onerror="handleImageError(this)" ...>
 */
function handleImageError(img) {
    if (img.dataset.fallbackAttempted) return;
    img.dataset.fallbackAttempted = "true";
    
    // Use a simple SVG placeholder as fallback
    img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f4f4f5' width='400' height='400'/%3E%3Ctext fill='%2371717a' font-family='Arial' font-size='16' text-anchor='middle' x='200' y='200'%3EImage Unavailable%3C/text%3E%3C/svg%3E";
    img.style.objectFit = "contain";
    img.style.background = "#f4f4f5";
}

function addToCart(id, name, price, image) {
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find(p => p.id === id);
    let qtyInCart = 1;

    if (existing) {
        existing.qty = (existing.qty || 1) + 1;
        qtyInCart = existing.qty;
    } else {
        cart.push({ id, name, price, image, qty: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    showToast(`Added ${name} to cart! (${qtyInCart} in cart)`);
}

function buyNow(id, name, price, image) {
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find(p => p.id === id);

    if (existing) {
        existing.qty = (existing.qty || 1) + 1;
    } else {
        cart.push({ id, name, price, image, qty: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    window.location.href = getBasePath() + "checkout";
}

function showToast(message) {
    const existing = document.getElementById("cart-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "cart-toast";
    toast.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>${message}</span>
    `;
    toast.style.cssText = `
        position:fixed; bottom:32px; left:50%; transform:translateX(-50%) translateY(20px);
        background:#09090b; color:#ffffff; padding:14px 22px; border-radius:12px;
        display:flex; align-items:center; gap:10px; font-size:14px; font-weight:500;
        box-shadow:0 8px 32px rgba(0,0,0,0.25); z-index:9999;
        opacity:0; transition:opacity 0.25s ease, transform 0.25s ease;
        border:1px solid rgba(185,147,90,0.3);
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateX(-50%) translateY(0)";
    });

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(-50%) translateY(10px)";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}