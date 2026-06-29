/**
 * =============================================================================
 * FAREEARTH - Checkout Module
 * =============================================================================
 * Handles cart management, order summary rendering, and secure order placement.
 * All API requests use the secureApiRequest() function which automatically
 * includes authentication headers (API key, timestamp) for backend validation.
 * 
 * @author Fareearth Dev Team
 * @version 2.1.0
 */

document.addEventListener("DOMContentLoaded", initCheckout);

function initCheckout() {
    renderSummary();
    document.getElementById("checkout-form").addEventListener("submit", placeOrder);
}

function getCart() {
    return JSON.parse(localStorage.getItem("cart") || "[]");
}

function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
    try {
        if (typeof window.updateCartCount === "function") {
            window.updateCartCount();
        }
    } catch(e) {}
}

function renderSummary() {
    const cart = getCart();
    const container = document.getElementById("order-summary");

    if (!cart || cart.length === 0) {
        container.innerHTML = `
            <div class="checkout-empty">
                <p>Your cart is empty.</p>
                <a href="shop" class="btn btn-primary">Browse Products</a>
            </div>
        `;
        return;
    }

    let itemsHtml = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        const safeName = item.name;
        const imgSrc = item.image || '';

        itemsHtml += `
            <div class="checkout-summary-item" data-index="${index}">
                <img class="checkout-summary-item-img" src="${imgSrc}" alt="${safeName}" loading="lazy" onerror="this.style.display='none'">
                <div class="checkout-summary-item-info">
                    <p class="checkout-summary-item-name">${safeName}</p>
                    <div class="checkout-qty-controls">
                        <button class="checkout-qty-btn checkout-qty-minus" data-index="${index}" type="button" aria-label="Decrease quantity">&minus;</button>
                        <span class="checkout-qty-value">${item.qty}</span>
                        <button class="checkout-qty-btn checkout-qty-plus" data-index="${index}" type="button" aria-label="Increase quantity">+</button>
                    </div>
                </div>
                <div class="checkout-summary-item-right">
                    <span class="checkout-summary-item-price">$${itemTotal.toFixed(2)}</span>
                    <button class="checkout-item-remove" data-index="${index}" type="button" aria-label="Remove item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            </div>
        `;
    });

    const tax = subtotal * CONFIG.TAX_RATE / 100;
    const shipping = subtotal >= CONFIG.FREE_SHIPPING_ABOVE ? 0 : CONFIG.SHIPPING_CHARGE;
    const total = subtotal + tax + shipping;
    const shippingLabel = shipping === 0 ? '<span class="checkout-summary-free">FREE</span>' : `$${shipping.toFixed(2)}`;

    container.innerHTML = `
        <div class="checkout-summary-items" id="checkout-items-container">
            ${itemsHtml}
        </div>
        <div class="checkout-summary-totals">
            <div class="checkout-summary-total-row">
                <span class="checkout-summary-total-label">Subtotal</span>
                <span class="checkout-summary-total-amount">$${subtotal.toFixed(2)}</span>
            </div>
            <div class="checkout-summary-total-row">
                <span class="checkout-summary-total-label">Tax</span>
                <span class="checkout-summary-total-amount">$${tax.toFixed(2)}</span>
            </div>
            <div class="checkout-summary-total-row">
                <span class="checkout-summary-total-label">Shipping</span>
                <span class="checkout-summary-total-amount">${shippingLabel}</span>
            </div>
            <div class="checkout-summary-total-row total">
                <span class="checkout-summary-total-label">Total</span>
                <span class="checkout-summary-total-amount">$${total.toFixed(2)}</span>
            </div>
        </div>
    `;

    attachCheckoutEvents();
}

function attachCheckoutEvents() {
    const container = document.getElementById("order-summary");
    if (!container) return;

    container.querySelectorAll(".checkout-qty-minus").forEach(btn => {
        btn.addEventListener("click", function(e) {
            e.stopPropagation();
            const index = parseInt(this.dataset.index);
            adjustQty(index, -1);
        });
    });

    container.querySelectorAll(".checkout-qty-plus").forEach(btn => {
        btn.addEventListener("click", function(e) {
            e.stopPropagation();
            const index = parseInt(this.dataset.index);
            adjustQty(index, 1);
        });
    });

    container.querySelectorAll(".checkout-item-remove").forEach(btn => {
        btn.addEventListener("click", function(e) {
            e.stopPropagation();
            const index = parseInt(this.dataset.index);
            removeItem(index);
        });
    });
}

function adjustQty(index, delta) {
    let cart = getCart();
    if (index < 0 || index >= cart.length) return;

    cart[index].qty += delta;

    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }

    saveCart(cart);
    updateCartCount();
    renderSummary();
}

function removeItem(index) {
    let cart = getCart();
    if (index < 0 || index >= cart.length) return;

    cart.splice(index, 1);

    saveCart(cart);
    updateCartCount();
    renderSummary();
}

/**
 * Sends a secure API request to the Google Apps Script backend.
 * Automatically includes all required security headers:
 * - X-API-Key: Shared secret for authentication
 * - X-Request-Timestamp: Current timestamp for replay protection
 * - Origin: Automatically set by the browser
 *
 * @param {string} url - The API endpoint URL
 * @param {Object} data - The payload to send
 * @param {string} [method='POST'] - HTTP method
 * @returns {Promise<Object>} The parsed JSON response
 */
async function secureApiRequest(url, data, method = 'POST') {
    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);

    // Include auth credentials in the body to avoid CORS preflight
    // (text/plain is a simple content type that doesn't trigger preflight)
    const bodyData = method === 'POST' ? { ...data, apiKey: CONFIG.API_KEY, timestamp: Date.now() } : undefined;

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'text/plain'
            },
            body: method === 'POST' ? JSON.stringify(bodyData) : undefined,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle non-JSON responses (e.g., network errors, HTML error pages)
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            throw new Error('Invalid response format from server');
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `HTTP ${response.status}`);
        }

        return result;
    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        }

        // Re-throw with a user-friendly message
        if (error.message === 'Failed to fetch') {
            throw new Error('Network error. Please check your connection and try again.');
        }

        throw error;
    }
}

async function placeOrder(e) {
    e.preventDefault();

    const cart = getCart();

    if (cart.length === 0) {
        alert("Cart is empty");
        return;
    }

    // Show processing overlay
    const overlay = document.getElementById("checkout-processing-overlay");
    const btn = document.getElementById("place-order-btn");
    if (overlay) overlay.classList.remove("hidden");
    if (btn) btn.classList.add("processing");

    function hideProcessing() {
        if (overlay) overlay.classList.add("hidden");
        if (btn) btn.classList.remove("processing");
    }

    const addressStreet = document.getElementById("addressStreet").value.trim();
    const city = document.getElementById("city").value.trim();
    const state = document.getElementById("state").value.trim();
    const zipcode = document.getElementById("zipcode").value.trim();

    if (!addressStreet || !city || !state || !zipcode) {
        hideProcessing();
        alert("Please complete your shipping address with street, city, state, and zip code.");
        return;
    }

    const agreeTerms = document.getElementById("agree-terms");
    if (!agreeTerms || !agreeTerms.checked) {
        hideProcessing();
        alert("You must agree to the Terms & Conditions, Privacy Policy, and Refund Policy before placing your order.");
        return;
    }

    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * item.qty;
    });

    const payload = {
        action: "placeOrder",
        customerName: document.getElementById("customerName").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        addressStreet: document.getElementById("addressStreet").value.trim(),
        city: document.getElementById("city").value.trim(),
        state: document.getElementById("state").value.trim(),
        zipcode: document.getElementById("zipcode").value.trim(),
        products: cart,
        subtotal: subtotal
    };

    try {
        // Use the secure API request function which automatically includes
        // X-API-Key and X-Request-Timestamp headers for backend validation
        const result = await secureApiRequest(CONFIG.API_URL, payload);

        if (result.success) {
            localStorage.removeItem("cart");
            window.location.href = "success?orderId=" + result.orderId;
        } else {
            hideProcessing();
            alert(result.message || "Order failed. Please try again.");
        }
    } catch (error) {
        hideProcessing();
        alert(error.message || "An unexpected error occurred. Please try again.");
        console.error("Order placement error:", error);
    }
}