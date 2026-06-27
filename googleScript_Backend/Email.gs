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
    "https://ashishhrajpoth2026.github.io/fareearth",

  FROM_NAME:
    "Fly On Earth Store",

  REPLY_TO:
    "projectweebstudio@gmail.com"

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
      STORE_INFO.FROM_NAME +
      " - Login OTP";

    const htmlBody =
      buildOTPEmailHTML(otp);

    const textBody =
      "Your One Time Password (OTP) is: " + otp + "\n\n" +
      "This OTP will expire in 5 minutes.\n\n" +
      "If you did not request this OTP, please ignore this email.\n\n" +
      STORE_INFO.NAME + "\n" +
      STORE_INFO.WEBSITE;

    // Validate email before attempting send
    if (!email || !email.includes('@')) {
      Logger.log("sendOTPEmail called with invalid email: " + email);
      return false;
    }

    // Log the attempt
    Logger.log("Attempting to send OTP email to: " + email);

    // Try GmailApp first (uses Gmail's sending capabilities which often have better deliverability)
    try {

      GmailApp.sendEmail(
        email,
        subject,
        textBody,
        {
          htmlBody: htmlBody,
          name: STORE_INFO.FROM_NAME,
          replyTo: STORE_INFO.REPLY_TO
        }
      );

      Logger.log(
        "GmailApp.sendEmail succeeded for OTP to " + email
      );

      return true;

    } catch (gmailAppErr) {

      Logger.log(
        "GmailApp failed for OTP to " + email + ": " + gmailAppErr.toString()
      );

      // Fallback to MailApp
      try {

        MailApp.sendEmail({
          to: email,
          subject: subject,
          htmlBody: htmlBody,
          replyTo: STORE_INFO.REPLY_TO
        });

        Logger.log(
          "MailApp.sendEmail fallback succeeded for OTP to " + email
        );

        return true;

      } catch (mailAppErr) {

        Logger.log(
          "MailApp fallback also failed for OTP to " + email + ": " + mailAppErr.toString()
        );

        return false;

      }

    }

  } catch (err) {

    Logger.log(
      "sendOTPEmail unexpected error: " + err.toString()
    );

    return false;

  }

}

/*************************************************
 * BUILD OTP EMAIL HTML
 *************************************************/
function buildOTPEmailHTML(otp) {

  const style = [
    "body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;background-color:#f4f4f4}",
    ".container{max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)}",
    ".header{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px 24px;text-align:center}",
    ".header h1{color:#ffffff;margin:0;font-size:22px;font-weight:700}",
    ".body{padding:32px 24px;color:#333333;font-size:15px;line-height:1.6}",
    ".otp-box{background:#f8f9fa;border:2px dashed #b9935a;border-radius:10px;padding:20px;text-align:center;margin:20px 0}",
    ".otp-code{font-size:36px;font-weight:800;letter-spacing:6px;color:#1a1a2e;font-family:'Courier New',monospace}",
    ".expiry{color:#888888;font-size:13px;text-align:center;margin-top:16px}",
    ".footer{background:#f8f9fa;padding:20px 24px;text-align:center;color:#888888;font-size:12px;border-top:1px solid #eeeeee}",
    ".footer a{color:#b9935a;text-decoration:none}"
  ].join("");

  return (
    "<!DOCTYPE html>" +
    "<html><head><meta charset='UTF-8'>" +
    "<style>" + style + "</style>" +
    "</head><body>" +
    "<div class='container'>" +
      "<div class='header'>" +
        "<h1>" + STORE_INFO.NAME + "</h1>" +
      "</div>" +
      "<div class='body'>" +
        "<p style='margin-top:0'>Hello,</p>" +
        "<p>You requested a one-time password to access your admin account.</p>" +
        "<div class='otp-box'>" +
          "<p style='margin:0 0 8px 0;color:#666;font-size:13px'>Your One-Time Password</p>" +
          "<div class='otp-code'>" + otp + "</div>" +
        "</div>" +
        "<p class='expiry'>⏱ This OTP will expire in <strong>5 minutes</strong></p>" +
        "<p style='margin-top:20px;padding-top:16px;border-top:1px solid #eee;color:#999;font-size:13px'>" +
          "If you did not request this code, no action is needed. Please ignore this email." +
        "</p>" +
      "</div>" +
      "<div class='footer'>" +
        "<p style='margin:0'>&copy; " + new Date().getFullYear() + " " + STORE_INFO.NAME + "</p>" +
        "<p style='margin:4px 0 0 0'>" +
          "<a href='" + STORE_INFO.WEBSITE + "'>" + STORE_INFO.WEBSITE + "</a>" +
        "</p>" +
      "</div>" +
    "</div>" +
    "</body></html>"
  );

}

/*************************************************
 * CHECK EMAIL QUOTA
 *************************************************/
function checkMailQuota() {

  try {

    return {
      mailAppRemaining: MailApp.getRemainingDailyQuota(),
      gmailAppRemaining: "Use Logger to check (GmailApp has no getRemainingDailyQuota)"
    };

  } catch (err) {

    return {
      error: err.toString()
    };

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

    try {

      MailApp.sendEmail({

        to: email,

        subject: subject,

        htmlBody: htmlBody

      });

    } catch (mailAppErr) {

      Logger.log(
        "MailApp failed for order confirmation to " + email + ": " + mailAppErr.toString()
      );

      // Fallback to GmailApp
      GmailApp.sendEmail(

        email,

        subject,

        "",

        {
          htmlBody: htmlBody
        }

      );

    }

    notifyAdminNewOrder(
      orderId,
      customerName,
      total
    );

    return true;

  } catch (err) {

    Logger.log(
      "sendOrderConfirmationEmail error: " + err.toString()
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

    try {

      MailApp.sendEmail({

        to:
          STORE_INFO.ADMIN_EMAIL,

        subject: subject,

        htmlBody: htmlBody

      });

    } catch (mailAppErr) {

      Logger.log(
        "MailApp failed for admin notification: " + mailAppErr.toString()
      );

      GmailApp.sendEmail(

        STORE_INFO.ADMIN_EMAIL,

        subject,

        "",

        {
          htmlBody: htmlBody
        }

      );

    }

    return true;

  } catch (err) {

    Logger.log(
      "notifyAdminNewOrder error: " + err.toString()
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

    try {

      MailApp.sendEmail({

        to: email,

        subject: subject,

        htmlBody: htmlBody

      });

    } catch (mailAppErr) {

      Logger.log(
        "MailApp failed for status email to " + email + ": " + mailAppErr.toString()
      );

      GmailApp.sendEmail(

        email,

        subject,

        "",

        {
          htmlBody: htmlBody
        }

      );

    }

    return true;

  } catch (err) {

    Logger.log(
      "sendOrderStatusEmail error: " + err.toString()
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

    try {

      MailApp.sendEmail({

        to:
          STORE_INFO.ADMIN_EMAIL,

        subject: subject,

        htmlBody: htmlBody

      });

    } catch (mailAppErr) {

      Logger.log(
        "MailApp failed for contact notification: " + mailAppErr.toString()
      );

      GmailApp.sendEmail(

        STORE_INFO.ADMIN_EMAIL,

        subject,

        "",

        {
          htmlBody: htmlBody
        }

      );

    }

    return true;

  } catch (err) {

    Logger.log(
      "sendContactNotification error: " + err.toString()
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

    try {

      MailApp.sendEmail({

        to: email,

        subject: subject,

        htmlBody: htmlBody

      });

    } catch (mailAppErr) {

      Logger.log(
        "MailApp failed for welcome email to " + email + ": " + mailAppErr.toString()
      );

      GmailApp.sendEmail(

        email,

        subject,

        "",

        {
          htmlBody: htmlBody
        }

      );

    }

    return true;

  } catch (err) {

    Logger.log(
      "sendWelcomeEmail error: " + err.toString()
    );

    return false;

  }

}

/*************************************************
 * TEST EMAIL
 *************************************************/
function testEmail() {

  try {

    const recipient =
      STORE_INFO.ADMIN_EMAIL;

    MailApp.sendEmail({

      to: recipient,

      subject:
        "Fly On Earth Email Test",

      htmlBody:
        "<h2>Email System Working</h2>"

    });

    return {
      success: true,
      message: "Test email sent to " + recipient
    };

  } catch (err) {

    // Fallback to GmailApp
    try {

      const recipient =
        STORE_INFO.ADMIN_EMAIL;

      GmailApp.sendEmail(

        recipient,

        "Fly On Earth Email Test (GmailApp)",

        "",

        {
          htmlBody: "<h2>Email System Working (GmailApp Fallback)</h2>"
        }

      );

      return {
        success: true,
        message: "Test email sent via GmailApp fallback to " + recipient
      };

    } catch (gmailErr) {

      return {
        success: false,
        message: "MailApp: " + err.toString() + " | GmailApp: " + gmailErr.toString()
      };

    }

  }

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

    try {

      MailApp.sendEmail({

        to: to,

        subject: subject,

        htmlBody: htmlBody

      });

    } catch (mailAppErr) {

      Logger.log(
        "MailApp failed for generic email to " + to + ": " + mailAppErr.toString()
      );

      GmailApp.sendEmail(

        to,

        subject,

        "",

        {
          htmlBody: htmlBody
        }

      );

    }

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