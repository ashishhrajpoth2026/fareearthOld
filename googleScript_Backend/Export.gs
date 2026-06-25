/*************************************************
 * US STORE - EXPORT MODULE
 * FILE: Export.gs
 * 
 * IMPORTANT: This module does NOT use DriveApp.
 * All exports return CSV content directly in the 
 * JSON response. The frontend handles downloading.
 * 
 * If you see "DriveApp.createFile" error:
 * 1. Go to Extensions > Apps Script
 * 2. Click Deploy > Manage Deployments
 * 3. Create a NEW deployment (or update existing)
 * 4. When prompted, authorize the new scopes
 * 5. Copy the new deployment URL to your config
 *************************************************/

/*************************************************
 * FORMAT PRODUCTS FOR EXPORT
 * Parses the JSON products string and returns 
 * "P001 — Luxury Watch Collection | P002 — Product Name" format
 *************************************************/
function formatProductsForExport(productsRaw) {
  if (!productsRaw) return "";
  
  var items = [];
  
  // Try to parse as JSON
  if (typeof productsRaw === "string") {
    try {
      items = JSON.parse(productsRaw);
    } catch(e) {
      // If it's not valid JSON, return it as-is (might already be plain text)
      return productsRaw;
    }
  } else if (Array.isArray(productsRaw)) {
    items = productsRaw;
  } else {
    return String(productsRaw);
  }
  
  if (!items.length) return "";
  
  // Format each product as "P001 — Luxury Watch Collection"
  var formatted = items.map(function(item) {
    var id = item.productId || item.id || "";
    var name = item.productName || item.name || "";
    if (id && name) {
      return id + " \u2014 " + name;
    } else if (id) {
      return id;
    } else if (name) {
      return name;
    }
    return "";
  });
  
  // Filter out empty strings and join with " | "
  formatted = formatted.filter(function(f) { return f !== ""; });
  return formatted.join(" | ");
}

/*************************************************
 * EXPORT ORDERS CSV
 *************************************************/
function exportOrdersCSV(request) {

  try {

    // Use getOrders() to get the same data as "All Orders" tab
    const ordersResult = getOrders();

    if (!ordersResult.success) {
      return ordersResult;
    }

    let orders = ordersResult.orders || [];

    Logger.log("exportOrdersCSV: total orders from getOrders() = " + orders.length);

    // Debug first order structure if available
    if (orders.length > 0) {
      Logger.log("exportOrdersCSV: first order keys = " + JSON.stringify(Object.keys(orders[0])));
      Logger.log("exportOrdersCSV: first order = " + JSON.stringify(orders[0]));
    }

    const statusFilter = String(request.status || "").trim();
    const fromDate = String(request.fromDate || "").trim();
    const toDate = String(request.toDate || "").trim();

    // Filter orders based on status and date
    let filteredOrders = orders;

    if (statusFilter) {
      filteredOrders = filteredOrders.filter(function(order) {
        return order.status === statusFilter;
      });
    }

    if (fromDate || toDate) {
      filteredOrders = filteredOrders.filter(function(order) {
        const orderDateStr = order.orderDate ? String(order.orderDate).split("T")[0] : "";
        if (fromDate && orderDateStr < fromDate) return false;
        if (toDate && orderDateStr > toDate) return false;
        return true;
      });
    }

    // Build CSV — Products column placed 2nd, right after Order ID
    const csvHeader = [
      "Order ID",
      "Products",
      "Date",
      "Customer Name",
      "Email",
      "Phone",
      "Address",
      "City",
      "State",
      "Zipcode",
      "Subtotal",
      "Tax",
      "Shipping",
      "Total",
      "Status"
    ];

    // Build CSV (BOM will be added by frontend)
    let csv = csvHeader.map(function(cell) {
      return '"' + String(cell).replace(/"/g, '""') + '"';
    }).join(",") + "\r\n";

    filteredOrders.forEach(function(order) {
      // Format products: parse JSON and show "P001 — Luxury Watch Collection | ..."
      var formattedProducts = formatProductsForExport(order.products);
      
      const row = [
        order.orderId || "",
        formattedProducts,
        order.orderDate ? String(order.orderDate).split("T")[0] : "",
        order.customerName || "",
        order.email || "",
        order.phone || "",
        order.addressStreet || "",
        order.city || "",
        order.state || "",
        order.zipcode || "",
        order.subtotal || "",
        order.tax || "",
        order.shipping || "",
        order.total || "",
        order.status || ""
      ];

      const line = row.map(function(cell) {
        return '"' + String(cell).replace(/"/g, '""') + '"';
      }).join(",");
      csv += line + "\r\n";
    });

    const fileName =
      "Orders_" +
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "yyyyMMdd_HHmmss"
      ) +
      ".csv";

    // Return CSV content directly — NO DRIVEAPP
    return {
      success: true,
      fileName: fileName,
      csvContent: csv,
      orderCount: filteredOrders.length
    };

  } catch (err) {
    return {
      success: false,
      message: err.toString()
    };
  }
}

/*************************************************
 * EXPORT REVENUE REPORT (CSV, no DriveApp)
 *************************************************/
function exportRevenueReport() {

  try {

    const stats = getDashboardStats();

    if (!stats.success) {
      return stats;
    }

    let csv =
      "Metric,Value\n" +
      "Total Orders," + stats.stats.totalOrders + "\n" +
      "Total Revenue," + stats.stats.totalRevenue + "\n" +
      "Today Orders," + stats.stats.todayOrders + "\n" +
      "Today Revenue," + stats.stats.todayRevenue + "\n" +
      "Pending Orders," + stats.stats.pendingOrders + "\n" +
      "Processing Orders," + stats.stats.processingOrders + "\n" +
      "Shipped Orders," + stats.stats.shippedOrders + "\n" +
      "Delivered Orders," + stats.stats.deliveredOrders + "\n" +
      "Cancelled Orders," + stats.stats.cancelledOrders + "\n";

    // Return CSV content directly
    return {
      success: true,
      fileName: "RevenueReport.csv",
      csvContent: csv
    };

  } catch (err) {
    return {
      success: false,
      message: err.toString()
    };
  }
}

/*************************************************
 * EXPORT PRODUCTS CSV (no DriveApp)
 *************************************************/
function exportProductsCSV() {

  try {

    const sheet = getSheet(SHEETS.PRODUCTS);
    const rows = sheet.getDataRange().getValues();

    let csv = "";
    rows.forEach(function(row) {
      csv += row
        .map(function(cell) {
          return '"' + String(cell).replace(/"/g, '""') + '"';
        })
        .join(",");
      csv += "\n";
    });

    // Return CSV content directly
    return {
      success: true,
      fileName: "Products.csv",
      csvContent: csv
    };

  } catch (err) {
    return {
      success: false,
      message: err.toString()
    };
  }
}

/*************************************************
 * EXPORT PRODUCTS JSON (no DriveApp)
 *************************************************/
function exportProductsJSON() {

  try {

    const productsResult = getProducts();

    if (!productsResult.success) {
      return productsResult;
    }

    // Return JSON data directly
    return {
      success: true,
      count: productsResult.count,
      products: productsResult.products,
      generatedAt: new Date()
    };

  } catch (err) {
    return {
      success: false,
      message: err.toString()
    };
  }
}

/*************************************************
 * EXPORT CUSTOMERS CSV (no DriveApp)
 *************************************************/
function exportCustomersCSV() {

  try {

    const result = getOrders();
    if (!result.success) {
      return result;
    }

    let csv = "Customer,Email,Phone,Total\n";

    result.orders.forEach(function(order) {
      csv +=
        '"' + (order.customerName || "") + '",' +
        '"' + (order.email || "") + '",' +
        '"' + (order.phone || "") + '",' +
        '"' + (order.total || "") + '"\n';
    });

    // Return CSV content directly
    return {
      success: true,
      fileName: "Customers.csv",
      csvContent: csv
    };

  } catch (err) {
    return {
      success: false,
      message: err.toString()
    };
  }
}

/*************************************************
 * DELETE OLD EXPORT FILES - Not needed anymore
 *************************************************/
function cleanupExports() {
  return {
    success: true,
    deleted: 0
  };
}

/*************************************************
 * EXPORT API WRAPPER
 *************************************************/
function generateExport(request) {

  const type = String(request.type || "").trim();

  if (!type) {
    return {
      success: false,
      message: "Export type is required"
    };
  }

  // Pass filter parameters through for order exports
  const filterRequest = {
    status: request.status || "",
    fromDate: request.fromDate || "",
    toDate: request.toDate || ""
  };

  switch(type) {
    case "orders":
      return exportOrdersCSV(filterRequest);
    case "products":
      return exportProductsCSV();
    case "productsJson":
      return exportProductsJSON();
    case "customers":
      return exportCustomersCSV();
    case "revenue":
      return exportRevenueReport();
    default:
      return {
        success: false,
        message: "Invalid export type: " + type
      };
  }
}
