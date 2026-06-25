/*************************************************
 * US STORE - EMAIL MODULE
 * FILE: Email.gs
 *************************************************/

const STORE_INFO = {

  NAME: "Fly On Earth",

  SUPPORT_EMAIL:
    "projectweebstudio@gmail.com",

  ADMIN_EMAIL:
    "projectweebstudio@gmail.com",

  WEBSITE:
    "https://ashishhrajpoth2026.github.io/fareearth"

};

/*************************************************
 * SEND OTP EMAIL
 *************************************************/
function sendOTPEmail(
  email,
  otp
) {

  try {

    const subject =
      STORE_INFO.NAME +
      " - Login OTP";

    const htmlBody =

      "<div style='font-family:Arial'>" +

      "<h2>" +
      STORE_INFO.NAME +
      "</h2>" +

      "<p>Your One Time Password is:</p>" +

      "<h1>" +
      otp +
      "</h1>" +

      "<p>This OTP will expire in 5 minutes.</p>" +

      "<p>If you did not request this OTP, ignore this email.</p>" +

      "</div>";

    MailApp.sendEmail({

      to: email,

      subject: subject,

      htmlBody: htmlBody

    });

    return true;

  } catch (err) {

    Logger.log(
      err.toString()
    );

    return false;

  }

}

/*************************************************
 * ORDER CONFIRMATION EMAIL
 *************************************************/
function sendOrderConfirmationEmail(
  email,
  orderId,
  customerName,
  total
) {

  try {

    const subject =
      "Order Confirmation - " +
      orderId;

    const htmlBody =

      "<div style='font-family:Arial'>" +

      "<h2>Thank You For Your Order</h2>" +

      "<p>Hello " +
      customerName +
      ",</p>" +

      "<p>Your order has been placed successfully.</p>" +

      "<p><strong>Order ID:</strong> " +
      orderId +
      "</p>" +

      "<p><strong>Total:</strong> $" +
      Number(total).toFixed(2) +
      "</p>" +

      "<p>Status: Pending</p>" +

      "<p>We will notify you once your order is processed.</p>" +

      "<br>" +

      "<p>" +
      STORE_INFO.NAME +
      "</p>" +

      "</div>";

    MailApp.sendEmail({

      to: email,

      subject: subject,

      htmlBody: htmlBody

    });

    notifyAdminNewOrder(
      orderId,
      customerName,
      total
    );

    return true;

  } catch (err) {

    Logger.log(
      err.toString()
    );

    return false;

  }

}

/*************************************************
 * ADMIN ORDER NOTIFICATION
 *************************************************/
function notifyAdminNewOrder(
  orderId,
  customerName,
  total
) {

  try {

    const subject =
      "New Order Received - " +
      orderId;

    const htmlBody =

      "<h2>New Order Received</h2>" +

      "<p><strong>Order ID:</strong> " +
      orderId +
      "</p>" +

      "<p><strong>Customer:</strong> " +
      customerName +
      "</p>" +

      "<p><strong>Total:</strong> $" +
      Number(total).toFixed(2) +
      "</p>";

    MailApp.sendEmail({

      to:
        STORE_INFO.ADMIN_EMAIL,

      subject: subject,

      htmlBody: htmlBody

    });

    return true;

  } catch (err) {

    Logger.log(
      err.toString()
    );

    return false;

  }

}

/*************************************************
 * ORDER STATUS EMAIL
 *************************************************/
function sendOrderStatusEmail(
  email,
  orderId,
  status
) {

  try {

    const subject =
      "Order Update - " +
      orderId;

    const htmlBody =

      "<h2>Order Status Updated</h2>" +

      "<p>Your order status is now:</p>" +

      "<h3>" +
      status +
      "</h3>" +

      "<p>Order ID: " +
      orderId +
      "</p>";

    MailApp.sendEmail({

      to: email,

      subject: subject,

      htmlBody: htmlBody

    });

    return true;

  } catch (err) {

    Logger.log(
      err.toString()
    );

    return false;

  }

}

/*************************************************
 * CONTACT FORM EMAIL
 *************************************************/
function sendContactNotification(
  name,
  email,
  message
) {

  try {

    const subject =
      "New Contact Form Submission";

    const htmlBody =

      "<h2>New Contact Request</h2>" +

      "<p><strong>Name:</strong> " +
      name +
      "</p>" +

      "<p><strong>Email:</strong> " +
      email +
      "</p>" +

      "<p><strong>Message:</strong></p>" +

      "<p>" +
      message +
      "</p>";

    MailApp.sendEmail({

      to:
        STORE_INFO.ADMIN_EMAIL,

      subject: subject,

      htmlBody: htmlBody

    });

    return true;

  } catch (err) {

    Logger.log(
      err.toString()
    );

    return false;

  }

}

/*************************************************
 * WELCOME EMAIL
 *************************************************/
function sendWelcomeEmail(
  email,
  name
) {

  try {

    const subject =
      "Welcome to " +
      STORE_INFO.NAME;

    const htmlBody =

      "<h2>Welcome " +
      name +
      "</h2>" +

      "<p>Thank you for joining us.</p>" +

      "<p>Visit our store:</p>" +

      "<a href='" +
      STORE_INFO.WEBSITE +
      "'>" +

      STORE_INFO.WEBSITE +

      "</a>";

    MailApp.sendEmail({

      to: email,

      subject: subject,

      htmlBody: htmlBody

    });

    return true;

  } catch (err) {

    Logger.log(
      err.toString()
    );

    return false;

  }

}

/*************************************************
 * TEST EMAIL
 *************************************************/
function testEmail() {

  MailApp.sendEmail({

    to:
      Session
      .getActiveUser()
      .getEmail(),

    subject:
      "Fly On Earth Email Test",

    htmlBody:
      "<h2>Email System Working</h2>"

  });

}

/*************************************************
 * GENERIC EMAIL
 *************************************************/
function sendEmail(
  to,
  subject,
  htmlBody
) {

  try {

    MailApp.sendEmail({

      to: to,

      subject: subject,

      htmlBody: htmlBody

    });

    return {

      success: true

    };

  } catch (err) {

    return {

      success: false,

      message:
        err.toString()

    };

  }

}