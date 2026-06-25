/*************************************************
 * US STORE - AUTH MODULE
 * FILE: Auth.gs
 *************************************************/

const ADMIN_SESSION_TTL_MINUTES = 60;

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
 * SEND OTP
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

    const otp =
      generateOTP();

    const expiry =
      new Date(
        new Date().getTime() +
        (5 * 60 * 1000)
      );

    const otpSheet =
      getSheet(
        SHEETS.OTP
      );

    otpSheet.appendRow([

      email,

      otp,

      expiry,

      new Date()

    ]);

    sendOTPEmail(
      email,
      otp
    );

    return {

      success: true,

      message:
        "OTP sent successfully"

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
 * VERIFY OTP
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

      if (
        rowEmail === email &&
        rowOTP === otp
      ) {

        if (
          now > expiry
        ) {

          return {

            success: false,

            message:
              "OTP expired"

          };

        }

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

    return {

      success: false,

      message:
        "Invalid OTP"

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
 * DELETE EXPIRED OTPs
 *************************************************/
function cleanExpiredOTPs() {

  const sheet =
    getSheet(
      SHEETS.OTP
    );

  const rows =
    sheet
    .getDataRange()
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

    if (
      expiry < now
    ) {

      sheet.deleteRow(
        i + 1
      );

    }

  }

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