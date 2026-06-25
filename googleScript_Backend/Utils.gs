/*************************************************
 * US STORE - UTILITY MODULE
 * FILE: Utils.gs
 *************************************************/

/*************************************************
 * UUID GENERATOR
 *************************************************/
function generateUUID() {

  return Utilities.getUuid();

}

/*************************************************
 * RANDOM STRING
 *************************************************/
function generateRandomString(
  length
) {

  length =
    length || 10;

  const chars =

    "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +

    "abcdefghijklmnopqrstuvwxyz" +

    "0123456789";

  let result = "";

  for (
    let i = 0;
    i < length;
    i++
  ) {

    result += chars.charAt(

      Math.floor(
        Math.random() *
        chars.length
      )

    );

  }

  return result;

}

/*************************************************
 * DATE FORMAT
 *************************************************/
function formatDate(
  date,
  format
) {

  format =
    format ||
    "yyyy-MM-dd HH:mm:ss";

  return Utilities.formatDate(
    new Date(date),
    Session.getScriptTimeZone(),
    format
  );

}

/*************************************************
 * TODAY STRING
 *************************************************/
function getTodayDate() {

  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );

}

/*************************************************
 * CURRENT TIMESTAMP
 *************************************************/
function getTimestamp() {

  return new Date()
    .getTime();

}

/*************************************************
 * EMAIL VALIDATION
 *************************************************/
function isValidEmail(
  email
) {

  const regex =

    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return regex.test(
    String(email || "")
      .trim()
  );

}

/*************************************************
 * PHONE VALIDATION
 *************************************************/
function isValidPhone(
  phone
) {

  phone =
    String(phone || "")
    .replace(/\D/g, "");

  return phone.length >= 8;

}

/*************************************************
 * REQUIRED FIELD
 *************************************************/
function isEmpty(
  value
) {

  return (

    value === null ||

    value === undefined ||

    String(value)
      .trim() === ""

  );

}

/*************************************************
 * SAFE NUMBER
 *************************************************/
function toNumber(
  value,
  defaultValue
) {

  defaultValue =
    defaultValue || 0;

  const number =
    Number(value);

  return isNaN(number)
    ? defaultValue
    : number;

}

/*************************************************
 * CURRENCY FORMAT
 *************************************************/
function formatCurrency(
  amount
) {

  amount =
    Number(amount || 0);

  return "$" +
    amount.toFixed(2);

}

/*************************************************
 * PERCENTAGE
 *************************************************/
function calculatePercentage(
  value,
  percentage
) {

  return Number(

    (
      Number(value) *
      Number(percentage)
    ) / 100

  );

}

/*************************************************
 * PAGINATION
 *************************************************/
function paginate(
  data,
  page,
  pageSize
) {

  page =
    Number(page || 1);

  pageSize =
    Number(pageSize || 10);

  const start =
    (page - 1) *
    pageSize;

  const end =
    start +
    pageSize;

  return {

    page:
      page,

    pageSize:
      pageSize,

    total:
      data.length,

    totalPages:
      Math.ceil(
        data.length /
        pageSize
      ),

    records:
      data.slice(
        start,
        end
      )

  };

}

/*************************************************
 * SORT ARRAY
 *************************************************/
function sortByField(
  array,
  field,
  direction
) {

  direction =
    direction || "asc";

  return array.sort(
    function(a, b) {

      if (
        direction === "desc"
      ) {

        return (
          a[field] <
          b[field]
        ) ? 1 : -1;

      }

      return (
        a[field] >
        b[field]
      ) ? 1 : -1;

    }
  );

}

/*************************************************
 * LOG INFO
 *************************************************/
function logInfo(
  message
) {

  Logger.log(
    "[INFO] " +
    message
  );

}

/*************************************************
 * LOG ERROR
 *************************************************/
function logError(
  error
) {

  Logger.log(
    "[ERROR] " +
    error
  );

}

/*************************************************
 * SANITIZE STRING
 *************************************************/
function sanitize(
  value
) {

  return String(
    value || ""
  )
  .replace(
    /</g,
    "&lt;"
  )
  .replace(
    />/g,
    "&gt;"
  )
  .trim();

}

/*************************************************
 * PARSE JSON SAFELY
 *************************************************/
function parseJSON(
  value
) {

  try {

    return JSON.parse(
      value
    );

  } catch (err) {

    return null;

  }

}

/*************************************************
 * SETTINGS HELPER
 *************************************************/
function getSetting(
  key,
  defaultValue
) {

  try {

    const sheet =
      getSheet(
        SHEETS.SETTINGS
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
        String(key)
      ) {

        return rows[i][1];

      }

    }

    return defaultValue;

  } catch (err) {

    return defaultValue;

  }

}

/*************************************************
 * SAVE SETTING
 *************************************************/
function saveSetting(
  key,
  value
) {

  const sheet =
    getSheet(
      SHEETS.SETTINGS
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
      String(key)
    ) {

      sheet
      .getRange(
        i + 1,
        2
      )
      .setValue(
        value
      );

      return true;

    }

  }

  sheet.appendRow([
    key,
    value
  ]);

  return true;

}

/*************************************************
 * API SUCCESS RESPONSE
 *************************************************/
function successResponse(
  data
) {

  return {

    success: true,

    data: data

  };

}

/*************************************************
 * API ERROR RESPONSE
 *************************************************/
function errorResponse(
  message
) {

  return {

    success: false,

    message: message

  };

}

/*************************************************
 * HEALTH CHECK
 *************************************************/
function systemHealth() {

  return {

    success: true,

    timestamp:
      new Date(),

    spreadsheet:
      SHEET_ID,

    status:
      "Running"

  };

}
