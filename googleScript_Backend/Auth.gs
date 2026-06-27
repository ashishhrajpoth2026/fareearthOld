/*************************************************
 * US STORE - AUTH MODULE
 * FILE: Auth.gs
 *************************************************/

const ADMIN_SESSION_TTL_MINUTES = 60;

const OTP_VERIFY_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const OTP_VERIFY_MAX_ATTEMPTS = 5; // max 5 attempts per window

/*************************************************
 * ADMIN LOGIN
 *************************************************/
function adminLogin(data) {

  try {

    const email =
      String(data.email || "")
      .trim()
      .toLowerCase();

    const password =
      String(data.password || "");

    if (!email || !password) {

      return {
        success: false,
        message: "Email and password required"
      };

    }

    const sheet =
      getSheet(SHEETS.ADMINS);

    const rows =
      sheet.getDataRange()
      .getValues();

    for (let i = 1; i < rows.length; i++) {

      const rowEmail =
        String(rows[i][0] || "")
        .trim()
        .toLowerCase();

      const rowPassword =
        String(rows[i][1] || "");

      const adminName =
        rows[i][2] || "Administrator";

      if (
        rowEmail === email &&
        rowPassword === password
      ) {

        const token =
          createSessionToken();

        saveAdminSession(
          rowEmail,
          token,
          adminName
        );

        return {

          success: true,

          token: token,

          admin: {

            name: adminName,

            email: rowEmail

          }

        };

      }

    }

    return {

      success: false,

      message:
        "Invalid email or password"

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
 * SEND OTP (with invalidation of old OTPs)
 *************************************************/
function sendOTP(email) {

  try {

    email =
      String(email || "")
      .trim()
      .toLowerCase();

    if (!email) {

      return {

        success: false,

        message:
          "Email required"

      };

    }

    const adminSheet =
      getSheet(
        SHEETS.ADMINS
      );

    const admins =
      adminSheet
      .getDataRange()
      .getValues();

    let exists = false;

    for (
      let i = 1;
      i < admins.length;
      i++
    ) {

      const rowEmail =
        String(admins[i][0])
        .trim()
        .toLowerCase();

      if (
        rowEmail === email
      ) {

        exists = true;
        break;

      }

    }

    if (!exists) {

      return {

        success: false,

        message:
          "Email not registered"

      };

    }

    // Acquire distributed lock to prevent race conditions
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000); // Wait up to 10 seconds for lock
    } catch (e) {
      return {
        success: false,
        message: "System busy, please try again"
      };
    }

    try {
      const otpSheet =
        getSheet(
          SHEETS.OTP
        );

      // Delete ALL existing OTPs for this email (prevents old OTP reuse)
      const rows = otpSheet.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 1; i--) {
        const rowEmail = String(rows[i][0] || "").trim().toLowerCase();
        if (rowEmail === email) {
          otpSheet.deleteRow(i + 1);
        }
      }

      const otp =
        generateOTP();

      const expiry =
        new Date(
          new Date().getTime() +
          (5 * 60 * 1000)
        );

      // New sheet structure: Email, OTP, Expiry, CreatedAt, Used(boolean), UsedAt
      otpSheet.appendRow([
        email,
        otp,
        expiry,
        new Date(),
        false,  // Used flag - false means not used yet
        ""      // UsedAt - empty means not used
      ]);

      // Send the OTP email and capture result
      const emailSent =
        sendOTPEmail(
          email,
          otp
        );

      if (!emailSent) {

        Logger.log(
          "WARNING: OTP saved to sheet but sendOTPEmail returned false for " + email
        );

        // Return success anyway since OTP is in the sheet
        return {

          success: true,

          warning: true,

          message: "OTP generated. Please check your email inbox (including spam folder). If not received, contact support."

        };

      }

      return {

        success: true,

        message:
          "OTP sent successfully"

      };

    } finally {
      lock.releaseLock();
    }

  } catch (err) {

    return {

      success: false,

      message:
        err.toString()

    };

  }

}

/*************************************************
 * VERIFY OTP (with single-use enforcement & rate limiting)
 *************************************************/
function verifyOTP(
  email,
  otp
) {

  try {

    email =
      String(email || "")
      .trim()
      .toLowerCase();

    otp =
      String(otp || "")
      .trim();

    if (!email || !otp) {
      return {
        success: false,
        message: "Email and OTP required"
      };
    }

    // --- Rate limiting check ---
    const rateCheck = checkOTPRateLimit(email);
    if (!rateCheck.allowed) {
      return {
        success: false,
        message: "Too many verification attempts. Please request a new OTP and try again later."
      };
    }

    // Acquire distributed lock to prevent race conditions
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000); // Wait up to 10 seconds for lock
    } catch (e) {
      return {
        success: false,
        message: "System busy, please try again"
      };
    }

    try {
      const sheet =
        getSheet(
          SHEETS.OTP
        );

      const rows =
        sheet.getDataRange()
        .getValues();

      const now =
        new Date();

      for (
        let i =
        rows.length - 1;
        i >= 1;
        i--
      ) {

        const rowEmail =
          String(rows[i][0])
          .trim()
          .toLowerCase();

        const rowOTP =
          String(rows[i][1])
          .trim();

        const expiry =
          new Date(
            rows[i][2]
          );

        const isUsed =
          rows[i][4] === true || rows[i][4] === "true" || rows[i][4] === true;

        const createdAt =
          rows[i][3] ? new Date(rows[i][3]) : null;

        if (
          rowEmail === email &&
          rowOTP === otp
        ) {

          // CRITICAL: Check if OTP was already used (prevent replay attack)
          if (isUsed) {
            // OTP already used - log this for security monitoring
            Logger.log(
              "SECURITY: Replay attack detected - OTP already used. Email: " + email + ", OTP: " + otp
            );

            // Also record this attempt in the sheet
            if (createdAt) {
              trackFailedAttempt(email, "OTP_ALREADY_USED");
            }

            return {
              success: false,
              message: "This OTP has already been used. Please request a new OTP."
            };
          }

          // Check if OTP expired
          if (
            now > expiry
          ) {

            return {

              success: false,

              message:
                "OTP expired"

            };

          }

          // --- CRITICAL FIX: Mark OTP as used BEFORE creating session ---
          // This prevents the same OTP from being used twice even if
          // two requests hit at the exact same time.
          
          // Mark the OTP row as used
          sheet.getRange(i + 1, 5).setValue(true);  // Used = true
          sheet.getRange(i + 1, 6).setValue(new Date()); // UsedAt = now
          
          // Immediately flush changes
          SpreadsheetApp.flush();

          // Now create session (OTP is already marked used)
          const adminRecord =
            getAdminByEmail(email);

          const token =
            createSessionToken();

          saveAdminSession(
            email,
            token,
            adminRecord.name || "Administrator"
          );

          return {

            success: true,

            token:
              token,

            admin: {
              name: adminRecord.name || "Administrator",
              email: email
            },

            message:
              "OTP verified"

          };

        }

      }

      // Track failed attempt for rate limiting
      trackFailedAttempt(email, "INVALID_OTP");

      return {

        success: false,

        message:
          "Invalid OTP"

      };

    } finally {
      lock.releaseLock();
    }

  } catch (err) {

    return {

      success: false,

      message:
        err.toString()

    };

  }

}

/*************************************************
 * RATE LIMIT TRACKING FOR OTP VERIFICATION
 *************************************************/
function trackFailedAttempt(email, reason) {
  try {
    const props = PropertiesService.getScriptProperties();
    const key = "OTP_RATE_" + email;
    const now = Date.now();
    
    let attempts = [];
    const stored = props.getProperty(key);
    if (stored) {
      try {
        attempts = JSON.parse(stored);
      } catch (e) {
        attempts = [];
      }
    }
    
    // Remove attempts outside the window
    attempts = attempts.filter(ts => (now - ts) < OTP_VERIFY_RATE_LIMIT_WINDOW_MS);
    
    // Add current attempt
    attempts.push(now);
    
    // Store back
    props.setProperty(key, JSON.stringify(attempts));
    
    // Log for security
    Logger.log("SECURITY: OTP verification failed for " + email + " - Reason: " + reason + " - Attempts in window: " + attempts.length);
    
  } catch (e) {
    // Fail silently for rate tracking
    Logger.log("Rate tracking error: " + e.toString());
  }
}

function checkOTPRateLimit(email) {
  try {
    const props = PropertiesService.getScriptProperties();
    const key = "OTP_RATE_" + email;
    const now = Date.now();
    
    const stored = props.getProperty(key);
    if (!stored) {
      return { allowed: true, attempts: 0 };
    }
    
    let attempts = [];
    try {
      attempts = JSON.parse(stored);
    } catch (e) {
      return { allowed: true, attempts: 0 };
    }
    
    // Remove expired entries
    attempts = attempts.filter(ts => (now - ts) < OTP_VERIFY_RATE_LIMIT_WINDOW_MS);
    
    if (attempts.length >= OTP_VERIFY_MAX_ATTEMPTS) {
      Logger.log("SECURITY: Rate limit exceeded for " + email + " - Attempts: " + attempts.length);
      return { allowed: false, attempts: attempts.length };
    }
    
    return { allowed: true, attempts: attempts.length };
  } catch (e) {
    return { allowed: true, attempts: 0 };
  }
}

/*************************************************
 * GENERATE OTP
 *************************************************/
function generateOTP() {

  return Math.floor(

    100000 +

    Math.random() *

    900000

  ).toString();

}

/*************************************************
 * GENERATE SESSION TOKEN
 *************************************************/
function createSessionToken() {

  return Utilities.getUuid() +

    "-" +

    new Date()
    .getTime();

}

function getAdminByEmail(email) {
  const sheet = getSheet(SHEETS.ADMINS);
  const rows = sheet.getDataRange().getValues();

  const normalized =
    String(email || "")
    .trim()
    .toLowerCase();

  for (let i = 1; i < rows.length; i++) {
    const rowEmail =
      String(rows[i][0] || "")
      .trim()
      .toLowerCase();

    if (rowEmail === normalized) {
      return {
        email: rowEmail,
        password: String(rows[i][1] || ""),
        name: rows[i][2] || "Administrator"
      };
    }
  }

  return {
    email: normalized,
    password: "",
    name: "Administrator"
  };
}

function saveAdminSession(email, token, adminName) {
  const expiry = new Date(
    new Date().getTime() +
    ADMIN_SESSION_TTL_MINUTES * 60 * 1000
  );

  const session = {
    email: email,
    name: adminName,
    expiresAt: expiry.toISOString()
  };

  PropertiesService
    .getScriptProperties()
    .setProperty(
      "ADMIN_SESSION_" + token,
      JSON.stringify(session)
    );
}

function validateAdminToken(token) {
  token = String(token || "").trim();

  if (!token) {
    return {
      success: false,
      message: "Admin token required"
    };
  }

  const stored = PropertiesService
    .getScriptProperties()
    .getProperty(
      "ADMIN_SESSION_" + token
    );

  if (!stored) {
    return {
      success: false,
      message: "Invalid or expired admin token"
    };
  }

  try {
    const session = JSON.parse(stored);
    const expiresAt = new Date(session.expiresAt);

    if (new Date() > expiresAt) {
      PropertiesService
        .getScriptProperties()
        .deleteProperty("ADMIN_SESSION_" + token);

      return {
        success: false,
        message: "Admin session expired"
      };
    }

    return {
      success: true,
      admin: {
        email: session.email,
        name: session.name
      }
    };
  } catch (err) {
    return {
      success: false,
      message: "Invalid admin session"
    };
  }
}

/*************************************************
 * CHANGE PASSWORD
 *************************************************/
function changeAdminPassword(
  email,
  oldPassword,
  newPassword
) {

  try {

    const sheet =
      getSheet(
        SHEETS.ADMINS
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

        rows[i][0] === email &&

        rows[i][1] === oldPassword

      ) {

        sheet
        .getRange(
          i + 1,
          2
        )
        .setValue(
          newPassword
        );

        return {

          success: true,

          message:
            "Password updated"

        };

      }

    }

    return {

      success: false,

      message:
        "Invalid credentials"

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
 * CREATE ADMIN
 *************************************************/
function createAdmin(
  name,
  email,
  password
) {

  try {

    const sheet =
      getSheet(
        SHEETS.ADMINS
      );

    sheet.appendRow([

      email,

      password,

      name,

      new Date()

    ]);

    return {

      success: true,

      message:
        "Admin created"

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
 * DELETE EXPIRED OTPs AND CLEAN USED OTPs
 *************************************************/
function cleanExpiredOTPs() {

  try {
    const sheet =
      getSheet(
        SHEETS.OTP
      );

    if (!sheet) return;

    const rows =
      sheet.getDataRange()
      .getValues();

    const now =
      new Date();

    for (
      let i =
      rows.length - 1;
      i >= 1;
      i--
    ) {

      const expiry =
        new Date(
          rows[i][2]
        );

      const isUsed =
        rows[i][4] === true || rows[i][4] === "true" || rows[i][4] === true;

      // Delete if expired OR used (cleanup old used OTPs)
      if (
        expiry < now || isUsed
      ) {

        sheet.deleteRow(
          i + 1
        );

      }

    }
  } catch (e) {
    Logger.log("cleanExpiredOTPs error: " + e.toString());
  }

}

/*************************************************
 * MIGRATE OTP SHEET TO NEW FORMAT (add Used columns)
 * Run this once to migrate existing OTP sheet
 *************************************************/
function migrateOTPSheet() {
  const sheet = getSheet(SHEETS.OTP);
  if (!sheet) return;
  
  // Check if header exists
  const header = sheet.getRange(1, 1, 1, 4).getValues()[0];
  
  // If first cell doesn't contain header, add it
  if (header[0] !== "Email") {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, 6).setValues([["Email", "OTP", "Expiry", "CreatedAt", "Used", "UsedAt"]]);
  } else if (header.length < 6) {
    // Add new columns to existing header
    sheet.getRange(1, 5, 1, 2).setValues([["Used", "UsedAt"]]);
  }
  
  // Mark all existing un-expired OTPs as used to prevent old OTP reuse
  const rows = sheet.getDataRange().getValues();
  const now = new Date();
  
  for (let i = 1; i < rows.length; i++) {
    // Check if Used column is empty/undefined
    if (rows[i][4] === "" || rows[i][4] === undefined || rows[i][4] === null) {
      const expiry = new Date(rows[i][2]);
      if (expiry > now) {
        // Mark un-expired OTPs as used (security: invalidate all existing OTPs)
        sheet.getRange(i + 1, 5).setValue(true);
        sheet.getRange(i + 1, 6).setValue(new Date());
        Logger.log("Migration: Invalidated OTP for " + rows[i][0] + " - Security measure");
      }
    }
  }
  
  SpreadsheetApp.flush();
  
  return {
    success: true,
    message: "OTP sheet migrated. All existing OTPs have been invalidated."
  };
}

/*************************************************
 * AUTH STATUS
 *************************************************/
function authStatus() {

  return {

    success: true,

    authenticated: true,

    timestamp:
      new Date()

  };

}