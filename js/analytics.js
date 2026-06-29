/**
 * =============================================================================
 * FAREEARTH - Google Analytics 4 (GA4) Integration
 * =============================================================================
 * 
 * Google Analytics tracking for Fareearth e-commerce platform.
 * Replace GA_MEASUREMENT_ID with your actual GA4 measurement ID.
 * 
 * @author Fareearth Dev Team
 * @version 1.0.0
 */

// =============================================================================
// CONFIGURATION
// =============================================================================
// Replace with your actual GA4 Measurement ID from Google Analytics
// Format: G-XXXXXXXXXX
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

// =============================================================================
// GA4 Initialization
// =============================================================================
(function() {
    // Don't load if already loaded or if measurement ID is placeholder
    if (window.gaLoaded || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') return;
    
    // Load the gtag script
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(script);
    
    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
        send_page_view: true,
        anonymize_ip: true
    });
    
    window.gaLoaded = true;
    window.gtag = gtag;
})();

// =============================================================================
// Event Tracking Helpers
// =============================================================================

/**
 * Track a custom event in GA4
 * @param {string} eventName - The event name
 * @param {object} eventParams - Optional event parameters
 */
function trackEvent(eventName, eventParams = {}) {
    if (window.gtag && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
        try {
            window.gtag('event', eventName, eventParams);
        } catch (e) {
            console.warn('GA4 event tracking failed:', e);
        }
    }
}

/**
 * Track a product view event
 * @param {object} product - Product object with id, name, price, category
 */
function trackProductView(product) {
    trackEvent('view_item', {
        currency: 'USD',
        value: product.price || 0,
        items: [{
            item_id: product.productId || product.id,
            item_name: product.productName || product.name,
            price: product.price || 0,
            item_category: product.category || 'General'
        }]
    });
}

/**
 * Track add to cart event
 * @param {object} product - Product object
 * @param {number} quantity - Quantity added
 */
function trackAddToCart(product, quantity = 1) {
    trackEvent('add_to_cart', {
        currency: 'USD',
        value: (product.price || 0) * quantity,
        items: [{
            item_id: product.productId || product.id,
            item_name: product.productName || product.name,
            price: product.price || 0,
            quantity: quantity,
            item_category: product.category || 'General'
        }]
    });
}

/**
 * Track purchase event
 * @param {object} orderData - Order data with transaction_id, value, items
 */
function trackPurchase(orderData) {
    trackEvent('purchase', {
        transaction_id: orderData.orderId || orderData.transaction_id,
        value: orderData.total || orderData.value || 0,
        currency: 'USD',
        tax: orderData.tax || 0,
        shipping: orderData.shipping || 0,
        items: orderData.items || []
    });
}

/**
 * Track begin checkout event
 * @param {array} items - Cart items
 * @param {number} value - Cart total value
 */
function trackBeginCheckout(items, value) {
    trackEvent('begin_checkout', {
        currency: 'USD',
        value: value || 0,
        items: items || []
    });
}