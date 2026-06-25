/*************************************************
 * US STORE - ORDERS MODULE
 * FILE: Orders.gs
 *************************************************/

/*************************************************
 * PLACE ORDER
 *************************************************/
function placeOrder(data) {

  try {

    if (!data.customerName) {
      return {
        success: false,
        message: "Customer name required"
      };
    }

    if (!data.email) {
      return {
        success: false,
        message: "Email required"
      };
    }

    if (!data.products || data.products.length === 0) {
      return {
        success: false,
        message: "Cart is empty"
      };
    }

    const addressStreet =
      String(data.addressStreet || data.address || "").trim();
    const city =
      String(data.city || "").trim();
    const state =
      String(data.state || "").trim();
    const zipcode =
      String(data.zipcode || "").trim();

    if (!addressStreet) {
      return {
        success: false,
        message: "Street address required"
      };
    }

    if (!city) {
      return {
        success: false,
        message: "City required"
      };
    }

    if (!state) {
      return {
        success: false,
        message: "State required"
      };
    }

    if (!zipcode) {
      return {
        success: false,
        message: "Zip code required"
      };
    }

    const settings = getStoreSettings();

    const subtotal =
      Number(data.subtotal || 0);

    const tax =
      calculateTax(
        subtotal,
        settings.taxRate
      );

    const shipping =
      calculateShipping(
        subtotal,
        settings.shippingCharge,
        settings.freeShippingAbove
      );

    const grandTotal =
      subtotal +
      tax +
      shipping;

    const orderId =
      generateOrderId();

    const sheet =
      getSheet(
        SHEETS.ORDERS
      );

    ensureOrderSheetHeaders(sheet);

    sheet.appendRow([

      orderId,

      new Date(),

      data.customerName,

      data.email,

      data.phone || "",

      addressStreet,

      city,

      state,

      zipcode,

      JSON.stringify(
        data.products
      ),

      subtotal,

      tax,

      shipping,

      grandTotal,

      "Pending"

    ]);

    try {

      const emailSent = sendOrderConfirmationEmail(
        data.email,
        orderId,
        data.customerName,
        grandTotal
      );

      if (!emailSent) {
        Logger.log("Warning: Order confirmation email failed to send for order " + orderId);
      }

    } catch (mailError) {

      Logger.log(
        "Email error for order " + orderId + ": " + mailError.toString()
      );

    }

    return {

      success: true,

      orderId: orderId,

      subtotal: subtotal,

      tax: tax,

      shipping: shipping,

      total: grandTotal,

      message:
        "Order placed successfully"

    };

  } catch (err) {

    return {

      success: false,

      message:
        err.toString()

    };

  }

}

function parseOrderRow(row) {
  const isExtended = row.length >= 15;
  const addressStreet = String(row[5] || "");
  const city = isExtended ? String(row[6] || "") : "";
  const state = isExtended ? String(row[7] || "") : "";
  const zipcode = isExtended ? String(row[8] || "") : "";
  const productsIndex = isExtended ? 9 : 6;
  const subtotalIndex = isExtended ? 10 : 7;
  const taxIndex = isExtended ? 11 : 8;
  const shippingIndex = isExtended ? 12 : 9;
  const totalIndex = isExtended ? 13 : 10;
  const statusIndex = isExtended ? 14 : 11;

  const fullAddress = [addressStreet, city, state, zipcode].filter(Boolean).join(", ");

  // Safely parse numeric values, check if the source is actually a number
  // Products JSON string may end up in wrong column for malformed rows
  function safeNumber(val) {
    if (val === undefined || val === null || val === "") return 0;
    const num = Number(val);
    if (isNaN(num)) return 0;
    return num;
  }

  // Check if subtotal contains products JSON (happens on misaligned rows)
  let rawSubtotal = row[subtotalIndex];
  if (typeof rawSubtotal === "string" && rawSubtotal.indexOf("[") === 0) {
    rawSubtotal = 0;
  }

  return {
    orderId: row[0],
    orderDate: row[1],
    customerName: row[2],
    email: row[3],
    phone: row[4],
    addressStreet: addressStreet,
    city: city,
    state: state,
    zipcode: zipcode,
    address: fullAddress || addressStreet,
    products: row[productsIndex],
    subtotal: safeNumber(rawSubtotal),
    tax: safeNumber(row[taxIndex]),
    shipping: safeNumber(row[shippingIndex]),
    total: safeNumber(row[totalIndex]),
    status: String(row[statusIndex] || ""),
    fullAddress: fullAddress
  };
}

function ensureOrderSheetHeaders(sheet) {
  const expected = [
    "OrderID",
    "OrderDate",
    "CustomerName",
    "Email",
    "Phone",
    "Street",
    "City",
    "State",
    "Zipcode",
    "Products",
    "Subtotal",
    "Tax",
    "Shipping",
    "GrandTotal",
    "Status"
  ];

  const headerRange = sheet.getRange(1, 1, 1, expected.length);
  const values = headerRange.getValues()[0];

  let needsUpdate = false;
  for (let i = 0; i < expected.length; i++) {
    if (String(values[i] || "") !== expected[i]) {
      needsUpdate = true;
      break;
    }
  }

  if (needsUpdate) {
    headerRange.setValues([expected]);
  }
}

/*************************************************
 * GET ALL ORDERS
 *************************************************/
function getOrders() {

  try {

    const sheet =
      getSheet(
        SHEETS.ORDERS
      );

    const rows =
      sheet
      .getDataRange()
      .getValues();

    const orders = [];

    for (
      let i = 1;
      i < rows.length;
      i++
    ) {

      orders.push(
        parseOrderRow(rows[i])
      );

    }

    return {

      success: true,

      count:
        orders.length,

      orders:
        orders

    };

  } catch (err) {

    return {

      success: false,

      message:
        err.toString()

    };

  }

}

/*************************************************
 * GET SINGLE ORDER
 *************************************************/
function getOrder(orderId) {

  try {

    const sheet =
      getSheet(
        SHEETS.ORDERS
      );

    const rows =
      sheet
      .getDataRange()
      .getValues();

    for (
      let i = 1;
      i < rows.length;
      i++
    ) {

      if (
        String(rows[i][0]) ===
        String(orderId)
      ) {

        return {

          success: true,

          order: parseOrderRow(rows[i])

        };

      }

    }

    return {

      success: false,

      message:
        "Order not found"

    };

  } catch (err) {

    return {

      success: false,

      message:
        err.toString()

    };

  }

}

/*************************************************
 * UPDATE ORDER STATUS
 *************************************************/
function updateOrderStatus(
  orderId,
  status
) {

  try {

    const sheet =
      getSheet(
        SHEETS.ORDERS
      );

    const rows =
      sheet
      .getDataRange()
      .getValues();

    for (
      let i = 1;
      i < rows.length;
      i++
    ) {

      if (
        String(rows[i][0]) ===
        String(orderId)
      ) {

        const statusColumn =
          rows[i].length >= 15
            ? 15
            : 12;

        sheet
          .getRange(
            i + 1,
            statusColumn
          )
          .setValue(
            status
          );

        return {

          success: true,

          message:
            "Order updated"

        };

      }

    }

    return {

      success: false,

      message:
        "Order not found"

    };

  } catch (err) {

    return {

      success: false,

      message:
        err.toString()

    };

  }

}

/*************************************************
 * ORDER ID GENERATOR
 *************************************************/
function generateOrderId() {

  const sheet =
    getSheet(
      SHEETS.ORDERS
    );

  const count =
    Math.max(
      sheet.getLastRow() - 1,
      0
    ) + 1;

  const date =
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyyMMdd"
    );

  const sequence =
    Utilities.formatString(
      "%05d",
      count
    );

  return (
    "ORD" +
    date +
    sequence
  );

}

/*************************************************
 * TAX CALCULATION
 *************************************************/
function calculateTax(
  subtotal,
  taxRate
) {

  return Number(
    (
      subtotal *
      taxRate /
      100
    ).toFixed(2)
  );

}

/*************************************************
 * SHIPPING CALCULATION
 *************************************************/
function calculateShipping(
  subtotal,
  shippingCharge,
  freeShippingAbove
) {

  if (
    subtotal >=
    freeShippingAbove
  ) {

    return 0;

  }

  return Number(
    shippingCharge
  );

}

/*************************************************
 * STORE SETTINGS
 *************************************************/
function getStoreSettings() {

  const settingsSheet =
    getSheet(
      SHEETS.SETTINGS
    );

  const rows =
    settingsSheet
    .getDataRange()
    .getValues();

  const settings = {};

  for (
    let i = 1;
    i < rows.length;
    i++
  ) {

    settings[
      rows[i][0]
    ] = rows[i][1];

  }

  return {

    taxRate:
      Number(
        settings.TaxRate || 8
      ),

    shippingCharge:
      Number(
        settings.ShippingCharge || 10
      ),

    freeShippingAbove:
      Number(
        settings.FreeShippingAbove || 100
      )

  };

}

/*************************************************
 * TOTAL REVENUE
 *************************************************/
function getTotalRevenue() {

  try {

    const orders =
      getOrders();

    if (
      !orders.success
    ) {

      return 0;

    }

    let revenue = 0;

    orders.orders.forEach(
      function(order) {

        revenue +=
          Number(
            order.total
          );

      }
    );

    return revenue;

  } catch (err) {

    return 0;

  }

}

/*************************************************
 * PENDING ORDERS COUNT
 *************************************************/
function getPendingOrdersCount() {

  const result =
    getOrders();

  if (
    !result.success
  ) {

    return 0;

  }

  return result.orders.filter(
    function(order) {

      return (
        order.status ===
        "Pending"
      );

    }
  ).length;

}

/*************************************************
 * TODAY ORDERS COUNT
 *************************************************/
function getTodayOrdersCount() {

  const result =
    getOrders();

  if (
    !result.success
  ) {

    return 0;

  }

  const today =
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );

  let count = 0;

  result.orders.forEach(
    function(order) {

      const orderDate =
        Utilities.formatDate(
          new Date(
            order.orderDate
          ),
          Session.getScriptTimeZone(),
          "yyyy-MM-dd"
        );

      if (
        orderDate ===
        today
      ) {

        count++;

      }

    }
  );

  return count;

}