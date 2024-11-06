const OrderListRouter = require("express").Router();
var createError = require("http-errors");

const {
  misQueryMod,
  setupQuery,
  misQuery,
  mchQueryMod,
} = require("../../helpers/dbconn");

OrderListRouter.post(`/getOrderListByType`, async (req, res, next) => {
  let query = `SELECT 
                  *,
                  DATE_FORMAT(Order_Date, '%d/%m/%Y') AS Printable_Order_Date,
                  DATE_FORMAT(Delivery_Date, '%d/%m/%Y') AS Printable_Delivery_Date
                FROM
                  magodmis.order_list
                      INNER JOIN
                  magodmis.cust_data ON magodmis.order_list.Cust_Code = magodmis.cust_data.Cust_Code
                WHERE
                  Type = '${req.body.type}'`;

  if (req.body.Order_Status !== "All") {
    query = query + ` AND Order_Status = '${req.body.Order_Status}'`;
  }

  if (req.body.Order_Ref) {
    query = query + ` AND Order_Ref = '${req.body.Order_Ref}'`;
  }

  query = query + ` ORDER BY Order_No DESC`;
  try {
    misQueryMod(query, (err, data) => {
      if (err) {
        console.log("err", err);
      } else {
        res.send(data);
      }
    });
  } catch (error) {
    next(error);
  }
});

OrderListRouter.post(
  `/getOrderListByTypeGroupedCustomer`,
  async (req, res, next) => {
    let query = `SELECT 
                    magodmis.cust_data.*
                  FROM
                    magodmis.order_list
                        INNER JOIN
                    magodmis.cust_data ON magodmis.order_list.Cust_Code = magodmis.cust_data.Cust_Code
                  WHERE
                    Type = '${req.body.type}'`;

    if (req.body.Order_Status !== "All") {
      query = query + ` AND Order_Status = '${req.body.Order_Status}'`;
    }

    if (req.body.Order_Ref) {
      query = query + ` AND Order_Ref = '${req.body.Order_Ref}'`;
    }

    query =
      query +
      `  GROUP BY magodmis.cust_data.Cust_Code ORDER BY magodmis.cust_data.Cust_name`;
    try {
      misQueryMod(query, (err, data) => {
        if (err) {
          console.log("err", err);
        } else {
          res.send(data);
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = OrderListRouter;
