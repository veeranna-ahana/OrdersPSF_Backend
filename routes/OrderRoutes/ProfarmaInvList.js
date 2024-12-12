const ProfarmaInvListRouter = require("express").Router();
const { misQuery, setupQuery, misQueryMod } = require("../../helpers/dbconn");

ProfarmaInvListRouter.post("/getProfarmaMain", async (req, res, next) => {
  try {
    misQueryMod(
      `SELECT * FROM magodmis.profarma_main where OrderNo = '${req.body.OrderNo}' order by ProfarmaID desc`,
      (err, data) => {
        if (err) {
          console.log(err);
        } else {
          res.send(data);
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

ProfarmaInvListRouter.post("/getProfarmaDetails", async (req, res, next) => {
  try {
    misQueryMod(
      `SELECT 
            *
        FROM
            magodmis.profarma_main
                JOIN
            magodmis.profarmadetails ON magodmis.profarma_main.ProfarmaID = magodmis.profarmadetails.ProfarmaID
        WHERE
            OrderNo = '${req.body.OrderNo}'`,
      (err, data) => {
        if (err) {
          console.log(err);
        } else {
          res.send(data);
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

ProfarmaInvListRouter.post("/postCreateInvoice", async (req, res, next) => {
  let flag;
  try {
    misQueryMod(
      `INSERT INTO magodmis.profarma_main (InvType, OrderNo, OrderDate, Cust_Code, Cust_Name, Cust_Address, Cust_Place, Cust_State, Cust_StateId, PIN_Code, DelAddress, GSTNo, PO_No, PO_Date, Net_Total, AssessableValue, InvTotal, GrandTotal, Status)
      VALUES ('${req.body.profarmaMainData.InvType}', '${
        req.body.profarmaMainData.OrderNo
      }', '${req.body.profarmaMainData.OrderDate.split("T")[0]}', '${
        req.body.profarmaMainData.Cust_Code
      }', '${req.body.profarmaMainData.Cust_Name}', '${
        req.body.profarmaMainData.Cust_Address
      }', '${req.body.profarmaMainData.Cust_Place}', '${
        req.body.profarmaMainData.Cust_State
      }', '${req.body.profarmaMainData.Cust_StateId}', '${
        req.body.profarmaMainData.PIN_Code
      }', '${req.body.profarmaMainData.DelAddress}', '${
        req.body.profarmaMainData.GSTNo
      }', '${req.body.profarmaMainData.PO_No}', '${
        req.body.profarmaMainData.PO_Date.split("T")[0]
      }', '${parseFloat(req.body.profarmaMainData.Net_Total).toFixed(
        2
      )}', '${parseFloat(req.body.profarmaMainData.AssessableValue).toFixed(
        2
      )}', '${parseFloat(req.body.profarmaMainData.InvTotal).toFixed(
        2
      )}', '${parseFloat(req.body.profarmaMainData.GrandTotal).toFixed(2)}', '${
        req.body.profarmaMainData.Status
      }'
      
      )`,
      (err, mainInsertData) => {
        if (err) {
          flag = false;
          console.log(err);
        } else {
          // console.log("mainInsertData", mainInsertData.insertId);
          // res.send(data);
          flag = true;

          for (let i = 0; i < req.body.profarmaDetailsData?.length; i++) {
            const element = req.body.profarmaDetailsData[i];

            try {
              misQueryMod(
                `SELECT 
                    magodmis.mtrlgrades.Excise_Cl_No
                FROM
                    magodmis.mtrl_data
                        JOIN
                    magodmis.mtrlgrades ON magodmis.mtrl_data.MtrlGradeID = magodmis.mtrlgrades.MtrlGradeID
                WHERE
                    magodmis.mtrl_data.Mtrl_Code = '${element.Mtrl_Code}'`,
                (err, exciseClNoData) => {
                  if (err) {
                    flag = false;

                    console.log(err);
                  } else {
                    // console.log("exicse");
                    // console.log("exciseClNoData", exciseClNoData[0].Excise_Cl_No);
                    flag = true;

                    try {
                      misQueryMod(
                        `INSERT INTO magodmis.profarmadetails (ProfarmaID, ProFarmaSrl, Dwg_No, Mtrl, Qty, Unit_Rate, DC_Srl_Amt, Excise_CL_no) VALUES ('${
                          mainInsertData.insertId
                        }', '${i + 1}', '${element.DwgName}', '${
                          element.Mtrl_Code
                        }', '${element.Qty_Ordered}', '${(
                          parseFloat(element.JWCost) +
                          parseFloat(element.MtrlCost)
                        ).toFixed(2)}', '${(
                          parseFloat(element.Qty_Ordered) *
                          (parseFloat(element.JWCost) +
                            parseFloat(element.MtrlCost))
                        ).toFixed(2)}', '${exciseClNoData[0].Excise_Cl_No}')`,
                        (err, detailsInsertData) => {
                          if (err) {
                            flag = false;

                            console.log(err);
                          } else {
                            flag = true;

                            // console.log("detailsInsertData", detailsInsertData);
                          }
                        }
                      );
                    } catch (error) {
                      next(error);
                    }
                  }
                }
              );
            } catch (error) {
              next(error);
            }
          }

          // console.log("flag", flag);
          if (flag) {
            res.send({
              flag: flag,
              message: "Profarma Invoice Created",
            });
          } else {
            res.send({
              flag: false,
              message: "uncaught backend error",
            });
          }
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

ProfarmaInvListRouter.post("/postDeleteInvoice", async (req, res, next) => {
  // console.log("delete invoice...", req.body);
  try {
    misQueryMod(
      `DELETE FROM magodmis.profarma_main WHERE (ProfarmaID = '${req.body.ProfarmaID}')`,
      (err, deleteMainData) => {
        if (err) {
          console.log(err);
        } else {
          try {
            misQueryMod(
              `DELETE FROM magodmis.profarmadetails WHERE (ProfarmaID = '${req.body.ProfarmaID}')`,
              (err, deleteDetailsData) => {
                if (err) {
                  console.log(err);
                } else {
                  res.send({
                    flag: true,
                    message: "Profarma Invoice Delete",
                  });
                }
              }
            );
          } catch (error) {
            next(error);
          }
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

module.exports = ProfarmaInvListRouter;
