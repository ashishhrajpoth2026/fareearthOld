/**
 * =============================================================================
 * FAREEARTH - Frontend Configuration (Production)
 * =============================================================================
 * 
 * Central configuration for the Fareearth e-commerce platform.
 * All settings should be reviewed and updated for production deployment.
 * 
 * @author Fareearth Dev Team
 * @version 2.1.0
 */

const CONFIG = {
    // =========================================================================
    // API & Backend
    // =========================================================================
    
    /** Google Apps Script Web App URL (deployed production endpoint) */
    API_URL: "https://script.google.com/macros/s/AKfycbzyyppjWMwm8c4mD9UQXpqZx3IlNRn4ciQqbw-wRO8kRaKmK15Cz4GwCemu0Dj8_SuA/exec",
    
    /** Local products JSON file (fallback/static data source) */
    PRODUCTS_JSON_URL: "products.json",
    
    // =========================================================================
    // Store Settings
    // =========================================================================
    
    /** Tax rate percentage (e.g., 8 = 8%) */
    TAX_RATE: 8,
    
    /** Flat shipping charge for orders below free shipping threshold */
    SHIPPING_CHARGE: 10,
    
    /** Orders at or above this amount get free shipping */
    FREE_SHIPPING_ABOVE: 100,
    
    /** Currency symbol for display */
    CURRENCY: "$",
    
    /** Store display name */
    STORE_NAME: "Fareearth",

    /** Store domain (no trailing slash) */
    STORE_DOMAIN: "https://fareearth.in",
    
    // =========================================================================
    // SECURITY CONFIGURATION (IMPORTANT)
    // =========================================================================
    // Generate a unique API key using the generateApiKey() function in Code.gs,
    // then update BOTH this file and the backend Code.gs with the same key.
    // This key must match exactly on both frontend and backend.
    // NEVER commit this key to public repositories.
    // =========================================================================
    
    /** Shared secret API key for frontend-backend authentication */
    API_KEY: "fe_sk_live_8a3f7e2d9c1b5f4e8a0d3c6b7f2e9a1c",

    /** Request timeout in milliseconds */
    REQUEST_TIMEOUT_MS: 15000,

    /** Maximum age of a request timestamp in milliseconds (must match backend) */
    REQUEST_MAX_AGE_MS: 5 * 60 * 1000,

    // =========================================================================
    // Cache TTL Settings
    // =========================================================================
    
    /** Session cache TTL for products (in minutes) */
    PRODUCTS_CACHE_TTL_MINUTES: 30,
    
    /** Dashboard cache TTL (in milliseconds) */
    DASHBOARD_CACHE_TTL_MS: 5 * 60 * 1000
};