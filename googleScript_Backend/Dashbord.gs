/*************************************************
 * US STORE - DASHBOARD MODULE
 * FILE: Dashboard.gs
 *************************************************/

/*************************************************
 * DASHBOARD STATS
 *************************************************/
function getDashboardStats() {

  try {

    const ordersResult = getOrders();

    if (!ordersResult.success) {

      return {
        success: false,
        message: "Unable to load orders"
      };

    }

    const orders =
      ordersResult.orders;

    let totalRevenue = 0;
    let pendingOrders = 0;
    let processingOrders = 0;
    let shippedOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;

    const today =
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "yyyy-MM-dd"
      );

    let todayOrders = 0;
    let todayRevenue = 0;

    orders.forEach(function(order) {

      const total =
        Number(order.total || 0);

      totalRevenue += total;

      const orderDate =
        Utilities.formatDate(
          new Date(order.orderDate),
          Session.getScriptTimeZone(),
          "yyyy-MM-dd"
        );

      if (orderDate === today) {

        todayOrders++;
        todayRevenue += total;

      }

      switch (String(order.status)) {

        case "Pending":
          pendingOrders++;
          break;

        case "Processing":
          processingOrders++;
          break;

        case "Shipped":
          shippedOrders++;
          break;

        case "Delivered":
          deliveredOrders++;
          break;

        case "Cancelled":
          cancelledOrders++;
          break;

      }

    });

    return {

      success: true,

      stats: {

        totalOrders:
          orders.length,

        todayOrders:
          todayOrders,

        totalRevenue:
          Number(
            totalRevenue.toFixed(2)
          ),

        todayRevenue:
          Number(
            todayRevenue.toFixed(2)
          ),

        pendingOrders:
          pendingOrders,

        processingOrders:
          processingOrders,

        shippedOrders:
          shippedOrders,

        deliveredOrders:
          deliveredOrders,

        cancelledOrders:
          cancelledOrders

      }

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
 * MONTHLY REVENUE
 *************************************************/
function getMonthlyRevenue() {

  try {

    const ordersResult =
      getOrders();

    if (!ordersResult.success) {

      return {
        success: false
      };

    }

    const months = {};

    ordersResult.orders.forEach(
      function(order) {

        const date =
          new Date(
            order.orderDate
          );

        const monthKey =
          Utilities.formatDate(
            date,
            Session.getScriptTimeZone(),
            "yyyy-MM"
          );

        if (
          !months[monthKey]
        ) {

          months[monthKey] = 0;

        }

        months[monthKey] +=
          Number(
            order.total || 0
          );

      }
    );

    const result = [];

    Object.keys(months)
      .sort()
      .forEach(function(key) {

        result.push({

          month: key,

          revenue:
            Number(
              months[key]
              .toFixed(2)
            )

        });

      });

    return {

      success: true,

      revenue:
        result

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
 * TOP CUSTOMERS
 *************************************************/
function getTopCustomers() {

  try {

    const ordersResult =
      getOrders();

    const customers = {};

    ordersResult.orders.forEach(
      function(order) {

        const email =
          order.email;

        if (
          !customers[email]
        ) {

          customers[email] = {

            customer:
              order.customerName,

            email:
              email,

            total: 0,

            orders: 0

          };

        }

        customers[email].orders++;

        customers[email].total +=
          Number(
            order.total || 0
          );

      }
    );

    const result =
      Object.values(
        customers
      )
      .sort(function(a, b) {

        return (
          b.total -
          a.total
        );

      })
      .slice(0, 10);

    return {

      success: true,

      customers:
        result

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
 * RECENT ORDERS
 *************************************************/
function getRecentOrders(limit) {

  try {

    limit =
      Number(limit || 10);

    const result =
      getOrders();

    if (!result.success) {

      return result;

    }

    const recent =
      result.orders
      .sort(function(a, b) {

        return (
          new Date(
            b.orderDate
          ) -
          new Date(
            a.orderDate
          )
        );

      })
      .slice(0, limit);

    return {

      success: true,

      orders:
        recent

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
 * ORDER STATUS REPORT
 *************************************************/
function getOrderStatusReport() {

  try {

    const result =
      getOrders();

    if (!result.success) {

      return result;

    }

    const report = {

      Pending: 0,

      Processing: 0,

      Shipped: 0,

      Delivered: 0,

      Cancelled: 0

    };

    result.orders.forEach(
      function(order) {

        const status =
          String(
            order.status
          );

        if (
          report[status] !==
          undefined
        ) {

          report[status]++;

        }

      }
    );

    return {

      success: true,

      report:
        report

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
 * SALES SUMMARY
 *************************************************/
function getSalesSummary() {

  try {

    const stats =
      getDashboardStats();

    const monthly =
      getMonthlyRevenue();

    return {

      success: true,

      dashboard:
        stats.stats,

      monthly:
        monthly.revenue

    };

  } catch (err) {

    return {

      success: false,

      message:
        err.toString()

    };

  }

}