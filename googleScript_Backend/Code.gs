

/*************************************************
 * US STORE - MAIN API ROUTER
 * FILE: Code.gs
 *************************************************/
const SHEET_ID = "1ILHBpJpeXC2CTK5Jm1lYAaQbsbN-AEOgBdIbl8TwA-I"; 

/*************************************************
 * GET REQUEST
 *************************************************/
function doGet(e) {

  try {

    const action =
      String(e.parameter.action || "")
      .trim();

    switch (action) {

      case "getProducts":
        return jsonResponse(
          getProducts()
        );

      case "getProduct":
        return jsonResponse(
          getProduct(
            e.parameter.productId
          )
        );

      case "exportProductsJSON":
        return jsonResponse(
          exportProductsJSON()
        );

      case "apiHealthCheck":
        return jsonResponse(
          apiHealthCheck()
        );

      default:
        return jsonResponse({
          success: true,
          message: "Fly On Earth API Running"
        });

    }

  } catch (err) {

    return jsonResponse({
      success: false,
      message: err.toString()
    });

  }

}

function doOptions(e) {
  return jsonResponse({
    success: true,
    message: "CORS preflight accepted"
  });
}

/*************************************************
 * POST REQUEST
 *************************************************/
function doPost(e) {

  try {

    const request =
      JSON.parse(
        e.postData.contents
      );

    const action =
      request.action || "";

    const adminProtectedActions = new Set([
      "getOrders",
      "getDashboardStats",
      "getContactLeads",
      "updateOrderStatus",
      "generateExport",
      "exportOrdersCSV"
    ]);

    if (adminProtectedActions.has(action)) {
      const auth =
        validateAdminToken(
          request.token
        );

      if (!auth.success) {
        return jsonResponse(auth);
      }
    }

    switch (action) {

      /*************************************
       * PRODUCTS
       *************************************/

      case "getProducts":
        return jsonResponse(
          getProducts()
        );

      case "getProduct":
        return jsonResponse(
          getProduct(
            request.productId
          )
        );

      case "addProduct":
        return jsonResponse(
          addProduct(request)
        );

      case "updateProduct":
        return jsonResponse(
          updateProduct(request)
        );

      case "deleteProduct":
        return jsonResponse(
          deleteProduct(
            request.productId
          )
        );

case "searchProducts":
  return jsonResponse(
    searchProducts(
      request.keyword
    )
  );

case "getProductsByCategory":
  return jsonResponse(
    getProductsByCategory(
      request.category
    )
  );

case "getTrendingProducts":
  return jsonResponse(
    getTrendingProducts()
  );

case "exportProductsCSV":
  return jsonResponse(
    exportProductsCSV()
  );

case "exportCustomersCSV":
  return jsonResponse(
    exportCustomersCSV()
  );

case "exportRevenueReport":
  return jsonResponse(
    exportRevenueReport()
  );

case "exportProductsJSON":
  return jsonResponse(
    exportProductsJSON()
  );

case "getMonthlyRevenue":
  return jsonResponse(
    getMonthlyRevenue()
  );

case "getTopCustomers":
  return jsonResponse(
    getTopCustomers()
  );

case "getRecentOrders":
  return jsonResponse(
    getRecentOrders(
      request.limit
    )
  );
      /*************************************
       * ORDERS
       *************************************/

      case "placeOrder":
        return jsonResponse(
          placeOrder(request)
        );

      case "getOrders":
        return jsonResponse(
          getOrders()
        );

      case "getOrder":
        return jsonResponse(
          getOrder(
            request.orderId
          )
        );

      case "updateOrderStatus":
        return jsonResponse(
          updateOrderStatus(
            request.orderId,
            request.status
          )
        );

      /*************************************
       * AUTH
       *************************************/

      case "adminLogin":
        return jsonResponse(
          adminLogin(request)
        );

      case "sendOTP":
        return jsonResponse(
          sendOTP(
            request.email
          )
        );

      case "verifyOTP":
        return jsonResponse(
          verifyOTP(
            request.email,
            request.otp
          )
        );

      case "validateAdminToken":
        return jsonResponse(
          validateAdminToken(
            request.token
          )
        );

      /*************************************
       * DASHBOARD
       *************************************/

      case "getDashboardStats":
        return jsonResponse(
          getDashboardStats()
        );

      /*************************************
       * CONTACT
       *************************************/

      case "getContactLeads":
        return jsonResponse(
          getContactLeads()
        );

      case "contactForm":
        return jsonResponse(
          saveContactForm(
            request
          )
        );

      /*************************************
       * EXPORT
       *************************************/

      case "generateExport":
        return jsonResponse(
          generateExport(request)
        );

      case "exportOrdersCSV":
        return jsonResponse(
          exportOrdersCSV(request)
        );

      /*************************************
       * SYSTEM / MIGRATION
       *************************************/

      case "migrateOTPSheet":
        return jsonResponse(
          migrateOTPSheet()
        );

      case "cleanExpiredOTPs":
        return jsonResponse(
          cleanExpiredOTPs()
        );

      /*************************************
       * EMAIL DIAGNOSTICS
       *************************************/

      case "testEmail":
        return jsonResponse(
          testEmail()
        );

      case "checkEmailQuota":
        return jsonResponse(
          checkMailQuota()
        );

      default:

        return jsonResponse({
          success: false,
          message: "Invalid Action"
        });

    }

  } catch (err) {

    return jsonResponse({
      success: false,
      error: err.toString()
    });

  }

}

/*************************************************
 * JSON RESPONSE
 *************************************************/
function jsonResponse(data) {

  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );

}

/*************************************************
 * DATABASE HELPERS
 *************************************************/
function getSpreadsheet() {

  return SpreadsheetApp.openById(
    SHEET_ID
  );

}

function getSheet(name) {

  return getSpreadsheet()
    .getSheetByName(name);

}

/*************************************************
 * SHEET NAMES
 *************************************************/
const SHEETS = {

  PRODUCTS: "Products",

  ORDERS: "Orders",

  ADMINS: "Admins",

  OTP: "OTP",

  SETTINGS: "Settings",

  CONTACTS: "Contacts"

};

/*************************************************
 * CONTACT FORM
 *************************************************/
function saveContactForm(data) {

  try {

    let sheet =
      getSheet(
        SHEETS.CONTACTS
      );

    if (!sheet) {

      sheet =
        getSpreadsheet()
        .insertSheet(
          SHEETS.CONTACTS
        );

      sheet.appendRow([
        "Date",
        "Name",
        "Email",
        "Subject",
        "Message"
      ]);

    }

    if (data.botField && String(data.botField || "").trim()) {
      return {
        success: false,
        message: "Spam detected"
      };
    }

    if (!data.name || data.name.trim().length < 2) {
      return {
        success: false,
        message: "Name is required"
      };
    }

    if (!data.email || data.email.trim().length < 5 || !data.email.includes("@")) {
      return {
        success: false,
        message: "A valid email address is required"
      };
    }

    if (!data.subject || data.subject.trim().length < 3) {
      return {
        success: false,
        message: "Subject is required"
      };
    }

    if (!data.message || data.message.trim().length < 10) {
      return {
        success: false,
        message: "Message must be at least 10 characters"
      };
    }

    sheet.appendRow([

      new Date(),

      data.name || "",

      data.email || "",

      data.subject || "",

      data.message || ""

    ]);

    // Send email notification to admin
    try {
      sendContactNotification(
        data.name || "",
        data.email || "",
        data.message || ""
      );
    } catch (mailError) {
      Logger.log("Contact email notification failed: " + mailError.toString());
    }

    return {

      success: true,

      message:
        "Contact form saved"

    };
  } catch (err) {
    return {
      success: false,
      message: err.toString()
    };
  }
}

function parseContactRow(row) {
  return {
    date: row[0],
    name: row[1],
    email: row[2],
    subject: row[3],
    message: row[4]
  };
}

function getContactLeads() {
  try {
    const sheet = getSheet(SHEETS.CONTACTS);
    if (!sheet) {
      return {
        success: true,
        count: 0,
        leads: []
      };
    }

    const rows = sheet.getDataRange().getValues();
    const leads = [];

    for (let i = 1; i < rows.length; i++) {
      leads.push(parseContactRow(rows[i]));
    }

    return {
      success: true,
      count: leads.length,
      leads: leads
    };
  } catch (err) {
    return {
      success: false,
      message: err.toString()
    };
  }
}

/*************************************************
 * API HEALTH CHECK
 *************************************************/
function apiHealthCheck() {

  return {

    success: true,

    version: "1.0",

    timestamp:
      new Date()

  };

}

/*************************************************
 * INITIAL DATABASE SETUP
 *************************************************/
function initializeStore() {

  const ss =
    getSpreadsheet();

  const requiredSheets = [

    "Products",

    "Orders",

    "Admins",

    "OTP",

    "Settings",

    "Contacts"

  ];

  requiredSheets.forEach(name => {

    if (
      !ss.getSheetByName(name)
    ) {

      ss.insertSheet(name);

    }

  });

  Logger.log(
    "Store Initialized"
  );

}