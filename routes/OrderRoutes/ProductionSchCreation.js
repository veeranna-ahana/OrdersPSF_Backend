/** @format */

const ProductionSchCreationRouter = require("express").Router();
const { misQuery, setupQuery, misQueryMod } = require("../../helpers/dbconn");

//Create Schedule
// ProductionSchCreationRouter.post(`/createProductionSchedule`, async (req, res, next) => {
//   // console.log("selectedItem is",req.body.selectedItems)
//   const count = req.body.selectedItems.length; // Assuming selectedItems is an array of items to be scheduled

//   const scheduleType = req.body.OrderData.Type === 'Service' ? req.body.OrderData.Type : req.body.scheduleType;

//   let insertquery1 = `INSERT INTO magodmis.orderschedule(Order_No, PO, Cust_Code, ScheduleDate, Delivery_date,
//                 SalesContact, Dealing_Engineer, ScheduleType, Type, Internal, Schedule_Status,schTgtDate)
//                 VALUES ('${req.body.OrderData.Order_No}','${req.body.OrderData.Purchase_Order}','${req.body.OrderData.Cust_Code}',now(),adddate(curdate(), INTERVAL 2 DAY), '${req.body.OrderData.SalesContact}', '${req.body.OrderData.Dealing_Engineer}','${scheduleType}','${req.body.OrderData.Type}','0','Created',now())`;

//   misQuery(insertquery1, (result, err1) => {
//     if (err1) {
//       console.log("Error inserting into orderschedule:", err1);
//       return res
//         .status(500)
//         .json({
//           message: "Error occurred while inserting into orderschedule",
//         });
//     } else {
//       const scheduleId = result.insertId; // Get the insertId
//       // Loop through selectedItems array
//       req.body.selectedItems.forEach((selectedItem) => {
//         // Fetch QtyToSchedule for the current OrderDetailId
//         let selectQtyToScheduleQuery = `SELECT  CAST(o1.Qty_Ordered AS SIGNED) - CAST(o1.QtyScheduled AS SIGNED) AS QtyToSchedule
//                           FROM  magodmis.Order_details o1
//                           WHERE  o1.OrderDetailId='${selectedItem.OrderDetailId}'`;

//         misQuery(selectQtyToScheduleQuery, (resultQty, err) => {
//           if (err) {
//             console.log("Error fetching QtyToSchedule:", err);
//             // Handle error if needed
//           } else {
//             if (resultQty.length > 0) {
//               const QtyToSchedule = resultQty[0].QtyToSchedule;
//               // Now you have QtyToSchedule, use it in inserquery2
//               let inserquery2 = `INSERT INTO magodmis.orderscheduledetails(ScheduleId, OrderDetailID, Order_No,
//                   Schedule_Srl, Cust_Code, Dwg_Code, DwgName, Mtrl_Code, Operation, MProcess,
//                   Mtrl_Source, PackingLevel, InspLevel, QtyScheduled, Tolerance, JWCost, MtrlCost, HasBOM)
//                   VALUES('${scheduleId}', '${selectedItem.OrderDetailId}','${selectedItem.Order_No}',
//                   '${selectedItem.Order_Srl}','${selectedItem.Cust_Code}','${selectedItem.Dwg_Code}', '${selectedItem.DwgName}', '${selectedItem.Mtrl_Code}', '${selectedItem.Operation}','${selectedItem.MProcess}',
//                   '${scheduleType}','${selectedItem.PackingLevel}', '${selectedItem.InspLevel}','${QtyToSchedule}','${selectedItem.tolerance}','${selectedItem.JWCost}','${selectedItem.MtrlCost}','${selectedItem.HasBOM}')`;
//               misQuery(inserquery2, (err2, finalresponse) => {
//                 if (err2) {
//                   // console.log("Error inserting into orderscheduledetails:", err2);
//                   // No need to return a response here, as the insertion is part of a loop
//                   // Simply log the error and continue with the next iteration
//                 } else {
//                   //   console.log("Inserted into orderscheduledetails:", finalresponse);
//                 }
//               });
//             }
//           }
//         });
//       });
//       // Return success response after the loop is finished
//       return res
//         .status(200)
//         .json({ message: "Draft Schedule Created" });
//     }
//   });
// });
ProductionSchCreationRouter.post(
  `/createProductionSchedule`,
  async (req, res, next) => {
    const count = req.body.selectedItems.length; // Assuming selectedItems is an array of items to be scheduled

    // const scheduleType = req.body.OrderData.Type === 'Service' ? req.body.OrderData.Type : req.body.scheduleType;

    let insertquery1 = `INSERT INTO magodmis.orderschedule(Order_No, PO, Cust_Code, ScheduleDate, Delivery_date,
                SalesContact, Dealing_Engineer, ScheduleType, Type, Internal, Schedule_Status,schTgtDate)
                VALUES ('${req.body.OrderData.Order_No}','${
      req.body.OrderData.Purchase_Order
    }','${
      req.body.OrderData.Cust_Code
    }',now(),adddate(curdate(), INTERVAL 2 DAY), '${
      req.body.OrderData.SalesContact
    }', '${req.body.OrderData.Dealing_Engineer}','${
      req.body.OrderData.Type === "Service"
        ? req.body.OrderData.Type
        : req.body.scheduleType
    }','${
      req.body.OrderData.Type
    }','0','Created',adddate(curdate(), INTERVAL 5 DAY))`;

    misQuery(insertquery1, (result, err1) => {
      if (err1) {
        console.log("Error inserting into orderschedule:", err1);
        return res.status(500).json({
          message: "Error occurred while inserting into orderschedule",
        });
      } else {
        const scheduleId = result.insertId; // Get the insertId
        // Loop through selectedItems array
        req.body.selectedItems.forEach((selectedItem) => {
          // Fetch QtyToSchedule for the current OrderDetailId
          let selectQtyToScheduleQuery = `SELECT  CAST(o1.Qty_Ordered AS SIGNED) - CAST(o1.QtyScheduled AS SIGNED) AS QtyToSchedule
                          FROM  magodmis.Order_details o1
                          WHERE  o1.OrderDetailId='${selectedItem.OrderDetailId}'`;

          misQuery(selectQtyToScheduleQuery, (resultQty, err) => {
            if (err) {
              console.log("Error fetching QtyToSchedule:", err);
              // Handle error if needed
            } else {
              if (resultQty.length > 0) {
                const QtyToSchedule = resultQty[0].QtyToSchedule;
                // Now you have QtyToSchedule, use it in inserquery2
                let inserquery2 = `INSERT INTO magodmis.orderscheduledetails(ScheduleId, OrderDetailID, Order_No,
                Schedule_Srl, Cust_Code, Dwg_Code, DwgName, Mtrl_Code, Operation, MProcess,
                Mtrl_Source, PackingLevel, InspLevel, QtyScheduled, Tolerance, JWCost, MtrlCost, HasBOM)
                VALUES('${scheduleId}', '${selectedItem.OrderDetailId}','${
                  selectedItem.Order_No
                }',
                '${selectedItem.Order_Srl}','${selectedItem.Cust_Code}','${
                  selectedItem.Dwg_Code
                }', '${selectedItem.DwgName}', '${selectedItem.Mtrl_Code}', '${
                  selectedItem.Operation
                }','${selectedItem.MProcess}',
                '${
                  req.body.scheduleType === "Job Work" ? "Customer" : "Magod"
                }','${selectedItem.PackingLevel}', '${
                  selectedItem.InspLevel
                }','${QtyToSchedule}','${selectedItem.tolerance}','${
                  selectedItem.JWCost
                }','${selectedItem.MtrlCost}','${selectedItem.HasBOM}')`;

                misQuery(inserquery2, (err2, finalresponse) => {
                  if (err2) {
                    // console.log("Error inserting into orderscheduledetails:", err2);
                    // No need to return a response here, as the insertion is part of a loop
                    // Simply log the error and continue with the next iteration
                  } else {
                    //   console.log("Inserted into orderscheduledetails:", finalresponse);
                  }
                });
              }
            }
          });
        });
        // Return success response after the loop is finished
        return res.status(200).json({ message: "Draft Schedule Created" });
      }
    });
  }
);

///Suspend Order
ProductionSchCreationRouter.post(`/suspendOrder`, async (req, res, next) => {
  // console.log("req.body /getFormData is",req.body);
  let query = `UPDATE magodmis.order_list o SET o.Order_Status='Suspended' WHERE o.Order_No='${req.body.OrderData.Order_No}'`;
  try {
    misQueryMod(query, (err, data) => {
      if (err) {
        console.log("err", err);
      } else {
        res.status(200).json({ message: "Success" });
      }
    });
  } catch (error) {
    next(error);
  }
});

//ShortClose Order
ProductionSchCreationRouter.post(`/shortCloseOrder`, async (req, res, next) => {
  // console.log("req.body /getFormData is",req.body);
  let query = `UPDATE magodmis.order_list o SET o.Order_Status='ShortClosed' WHERE o.Order_No='${req.body.OrderData.Order_No}';`;
  try {
    misQueryMod(query, (err, data) => {
      if (err) {
        console.log("err", err);
      } else {
        res.status(200).json({ message: "Success" });
      }
    });
  } catch (error) {
    next(error);
  }
});

//ShortClose to Recoreded Status
ProductionSchCreationRouter.post(
  `/shortclosetoRecorded`,
  async (req, res, next) => {
    // console.log("req.body /getFormData is",req.body);
    let query = `UPDATE magodmis.order_list o SET o.Order_Status='Recorded' WHERE o.Order_No='${req.body.OrderData.Order_No}';`;
    try {
      misQueryMod(query, (err, data) => {
        if (err) {
          console.log("err", err);
        } else {
          res.status(200).json({ message: "Success" });
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

//Cancel Order
ProductionSchCreationRouter.post(`/cancelOrder`, async (req, res, next) => {
  // console.log("/cancelOrder",req.body.OrderData.Order_No);
  let query = `SELECT COUNT(o.ScheduleId) as count FROM magodmis.orderschedule o
               WHERE o.Order_No = '${req.body.OrderData.Order_No}' AND NOT (o.Schedule_Status='Cancelled' OR o.Schedule_Status='created')`;
  try {
    misQueryMod(query, (err, data) => {
      if (err) {
        console.log("err", err);
        return res
          .status(500)
          .send("An error occurred while processing your request.");
      } else {
        const scheduleCount = data[0].count;

        if (scheduleCount > 0) {
          return res.status(200).json({
            message:
              "Cancel all schedules before attempting to cancel the order",
          });
        } else {
          let detailQuery = `SELECT * FROM magodmis.order_details WHERE Order_No='${req.body.OrderData.Order_No}'`;
          misQueryMod(detailQuery, (detailErr, detailData) => {
            if (detailErr) {
              console.log("detailErr", detailErr);
              return res
                .status(500)
                .send("An error occurred while processing your request.");
            } else {
              for (const detail of detailData) {
                if (detail.QtyScheduled > 0) {
                  return res.status(200).json({
                    message: "Cancel schedules before cancelling the order",
                  });
                }
              }
              let updateQuery = `UPDATE magodmis.order_list o SET o.Order_Status='Cancelled' WHERE o.Order_No='${req.body.OrderData.Order_No}'`;
              misQueryMod(updateQuery, (updateErr, updateResult) => {
                if (updateErr) {
                  console.log("updateErr", updateErr);
                  return res
                    .status(500)
                    .send("An error occurred while processing your request.");
                } else {
                  return res
                    .status(200)
                    .json({ message: "Order cancelled successfully" });
                }
              });
            }
          });
        }
      }
    });
  } catch (error) {
    console.log("catch error", error);
    return res
      .status(500)
      .send("An error occurred while processing your request.");
  }
});

//Cancel to Recorded
ProductionSchCreationRouter.post(`/canceltoRecord`, async (req, res, next) => {
  let query = `UPDATE magodmis.order_list o SET o.Order_Status='Recorded' WHERE o.Order_No='${req.body.OrderData.Order_No}'`;
  try {
    misQueryMod(query, (err, data) => {
      if (err) {
        console.log("err", err);
      } else {
        res.status(200).json({ message: "Success" });
      }
    });
  } catch (error) {
    next(error);
  }
});

//get ScheduleList data based on  Schedule Type
ProductionSchCreationRouter.post(
  `/schedulelistbasedonScheduleType`,
  async (req, res, next) => {
    // console.log("scheduleType",req.body.scheduleType,req.body.OrderData.Order_No)
    let query = `Select * from  magodmis.orderschedule WHERE Order_No='${req.body.OrderData.Order_No}' and ScheduleType='${req.body.scheduleType}'`;
    try {
      misQueryMod(query, (err, data) => {
        if (err) {
          console.log("err", err);
        } else {
          res.send(data);
          //   console.log("data is",data);
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = ProductionSchCreationRouter;
