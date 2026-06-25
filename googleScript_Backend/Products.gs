/*************************************************
 * US STORE - PRODUCTS MODULE
 * FILE: Products.gs
 *************************************************/

/*************************************************
 * GET ALL PRODUCTS
 *************************************************/
function getProducts() {

  try {

    const sheet =
      getSheet(
        SHEETS.PRODUCTS
      );

    const rows =
      sheet
      .getDataRange()
      .getValues();

    const products = [];

    for (
      let i = 1;
      i < rows.length;
      i++
    ) {

      if (
        String(rows[i][9] || "Active")
        !== "Active"
      ) {
        continue;
      }

      products.push({

        productId:
          rows[i][0],

        productName:
          rows[i][1],

        category:
          rows[i][2],

        price:
          Number(rows[i][3]),

        rating:
          Number(rows[i][4]),

        reviews:
          Number(rows[i][5]),

        image:
          rows[i][6],

        description:
          rows[i][7],

        trending:
          rows[i][8],

        status:
          rows[i][9]

      });

    }

    return {

      success: true,

      count:
        products.length,

      products: products

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
 * GET SINGLE PRODUCT
 *************************************************/
function getProduct(
  productId
) {

  try {

    const sheet =
      getSheet(
        SHEETS.PRODUCTS
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
        String(productId)
      ) {

        return {

          success: true,

          product: {

            productId:
              rows[i][0],

            productName:
              rows[i][1],

            category:
              rows[i][2],

            price:
              Number(rows[i][3]),

            rating:
              Number(rows[i][4]),

            reviews:
              Number(rows[i][5]),

            image:
              rows[i][6],

            description:
              rows[i][7],

            trending:
              rows[i][8],

            status:
              rows[i][9]

          }

        };

      }

    }

    return {

      success: false,

      message:
        "Product not found"

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
 * ADD PRODUCT
 *************************************************/
function addProduct(
  data
) {

  try {

    const validation =
      validateProduct(data);

    if (
      !validation.success
    ) {
      return validation;
    }

    const sheet =
      getSheet(
        SHEETS.PRODUCTS
      );

    const productId =
      generateProductId();

    sheet.appendRow([

      productId,

      data.productName,

      data.category,

      Number(data.price),

      Number(
        data.rating || 0
      ),

      Number(
        data.reviews || 0
      ),

      data.image || "",

      data.description || "",

      data.trending || "No",

      "Active"

    ]);

    return {

      success: true,

      productId:
        productId,

      message:
        "Product added successfully"

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
 * UPDATE PRODUCT
 *************************************************/
function updateProduct(
  data
) {

  try {

    const sheet =
      getSheet(
        SHEETS.PRODUCTS
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
        String(data.productId)

      ) {

        sheet
        .getRange(
          i + 1,
          2,
          1,
          9
        )
        .setValues([[
          data.productName,
          data.category,
          Number(data.price),
          Number(data.rating),
          Number(data.reviews),
          data.image,
          data.description,
          data.trending,
          data.status
        ]]);

        return {

          success: true,

          message:
            "Product updated"

        };

      }

    }

    return {

      success: false,

      message:
        "Product not found"

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
 * DELETE PRODUCT
 * SOFT DELETE
 *************************************************/
function deleteProduct(
  productId
) {

  try {

    const sheet =
      getSheet(
        SHEETS.PRODUCTS
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
        String(productId)

      ) {

        sheet
        .getRange(
          i + 1,
          10
        )
        .setValue(
          "Deleted"
        );

        return {

          success: true,

          message:
            "Product deleted"

        };

      }

    }

    return {

      success: false,

      message:
        "Product not found"

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
 * SEARCH PRODUCTS
 *************************************************/
function searchProducts(
  keyword
) {

  try {

    keyword =
      String(keyword || "")
      .toLowerCase();

    const result =
      getProducts();

    if (
      !result.success
    ) {
      return result;
    }

    const products =
      result.products.filter(
        product =>

          product.productName
          .toLowerCase()
          .includes(keyword)

          ||

          product.category
          .toLowerCase()
          .includes(keyword)

      );

    return {

      success: true,

      count:
        products.length,

      products:
        products

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
 * GET PRODUCTS BY CATEGORY
 *************************************************/
function getProductsByCategory(
  category
) {

  try {

    const result =
      getProducts();

    const products =
      result.products.filter(
        product =>

          String(
            product.category
          ).toLowerCase()

          ===

          String(
            category
          ).toLowerCase()

      );

    return {

      success: true,

      products:
        products

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
 * GET TRENDING PRODUCTS
 *************************************************/
function getTrendingProducts() {

  try {

    const result =
      getProducts();

    const products =
      result.products.filter(
        product =>

          String(
            product.trending
          ).toLowerCase()

          === "yes"

      );

    return {

      success: true,

      products:
        products

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
 * PRODUCT VALIDATION
 *************************************************/
function validateProduct(
  data
) {

  if (
    !data.productName
  ) {

    return {

      success: false,

      message:
        "Product name required"

    };

  }

  if (
    !data.category
  ) {

    return {

      success: false,

      message:
        "Category required"

    };

  }

  if (
    !data.price
  ) {

    return {

      success: false,

      message:
        "Price required"

    };

  }

  return {

    success: true

  };

}

/*************************************************
 * PRODUCT ID GENERATOR
 *************************************************/
function generateProductId() {

  const sheet =
    getSheet(
      SHEETS.PRODUCTS
    );

  const lastRow =
    sheet.getLastRow();

  const nextId =
    Math.max(
      lastRow,
      1
    );

  return (
    "P" +
    Utilities
    .formatString(
      "%04d",
      nextId
    )
  );

}

/*************************************************
 * GET PRODUCT COUNT
 *************************************************/
function getProductCount() {

  const result =
    getProducts();

  return {

    success: true,

    totalProducts:
      result.products.length

  };

}