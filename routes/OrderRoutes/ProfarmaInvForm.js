const ProfarmaInvFormRouter = require("express").Router();
const { misQuery, setupQuery, misQueryMod } = require("../../helpers/dbconn");

ProfarmaInvFormRouter.post("/getTaxData", async (req, res, next) => {
  // get the cust details
  try {
    misQueryMod(
      `SELECT * FROM magodmis.cust_data where Cust_Code =${req.body.Cust_Code}`,
      (err, custData) => {
        if (err) {
          logger.error(err);
        } else {
          // console.log("Cust_Code", req.body);
          // console.log("custData[0].StateId", custData[0].StateId);
          let query = "";
          // console.log("custData", custData[0]);
          if (custData[0].IsGovtOrg) {
            // console.log("IsGovtOrg");
            query = `SELECT 
                          *
                      FROM
                          magod_setup.taxdb
                      WHERE
                          EffectiveTO >= NOW() AND TaxID IS NULL`;
          } else if (custData[0].IsForiegn) {
            // console.log("IsForiegn");
            query = `SELECT 
                          *
                      FROM
                          magod_setup.taxdb
                      WHERE
                          EffectiveTO >= NOW() AND IGST != 0 
                      ORDER BY TaxName DESC
                          `;
          } else if (
            custData[0].GSTNo === null ||
            custData[0].GSTNo === undefined ||
            custData[0].GSTNo === "null" ||
            custData[0].GSTNo === "" ||
            custData[0].GSTNo.length === 0
          ) {
            // console.log("GSTNo");
            query = `SELECT 
                          *
                      FROM
                          magod_setup.taxdb
                      WHERE
                          EffectiveTO >= NOW() AND IGST = 0
                              AND UnderGroup != 'INCOMETAX'`;
          } else if (
            parseInt(req.body.unitStateID) != parseInt(custData[0].StateId)
          ) {
            // console.log("unitStateID");
            query = `SELECT 
                          *
                      FROM
                          magod_setup.taxdb
                      WHERE
                          EffectiveTO >= NOW() AND IGST != 0
                              AND UnderGroup != 'INCOMETAX'`;
          } else if (req.body.unitGST === custData[0].GSTNo) {
            // console.log("unitGST");
            query = `SELECT 
                          *
                      FROM
                          magod_setup.taxdb
                      WHERE
                          EffectiveTO >= NOW() AND TaxID IS NULL`;
          } else {
            // console.log("else");
            query = `SELECT 
                          *
                      FROM
                          magod_setup.taxdb
                      WHERE
                          EffectiveTO >= NOW() AND IGST = 0
                              AND UnderGroup != 'INCOMETAX'`;
          }

          try {
            misQueryMod(query, (err, data) => {
              if (err) logger.error(err);
              res.send(data);
              // console.log("data", data);
              // console.log("query", query);
            });
          } catch (error) {
            next(error);
          }
        }
        // res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// ProfarmaInvFormRouter.get("/getTaxData", async (req, res, next) => {
//   try {
//     misQueryMod(
//       `SELECT
//             *
//         FROM
//             magod_setup.taxdb
//         WHERE
//             UnderGroup NOT LIKE '%INCOMETAX%'
//                 AND IGST = 0
//                 AND EffectiveTO >= NOW()`,
//       (err, data) => {
//         if (err) {
//           console.log(err);
//         } else {
//           res.send(data);
//         }
//       }
//     );
//   } catch (error) {
//     next(error);
//   }
// });

ProfarmaInvFormRouter.post("/getProfarmaFormMain", async (req, res, next) => {
  //   console.log("req.body.ProfarmaID", req.body.ProfarmaID);
  try {
    misQueryMod(
      `SELECT *, DATE_FORMAT(ProformaDate, '%d/%m/%Y') AS Printable_ProformaDate FROM magodmis.profarma_main where ProfarmaID = '${req.body.ProfarmaID}'`,
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

ProfarmaInvFormRouter.post(
  "/getProfarmaFormDetails",
  async (req, res, next) => {
    //   console.log("req.body.ProfarmaID", req.body.ProfarmaID);
    try {
      misQueryMod(
        `SELECT * FROM magodmis.profarmadetails where ProfarmaID = '${req.body.ProfarmaID}'`,
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
  }
);

ProfarmaInvFormRouter.post("/getProfarmaFormTaxes", async (req, res, next) => {
  //   console.log("req.body.ProfarmaID", req.body.ProfarmaID);
  try {
    misQueryMod(
      `SELECT * FROM magodmis.profarmataxtable WHERE ProfarmaID = '${req.body.ProfarmaID}'`,
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

ProfarmaInvFormRouter.post("/postSaveInvoice", async (req, res, next) => {
  // console.log("post save invoice", req.body);

  // update main table

  try {
    misQueryMod(
      `UPDATE magodmis.profarma_main
      SET
          TaxAmount = '${parseFloat(
            req.body.profarmaMainData.TaxAmount || 0
          ).toFixed(2)}',
          Net_Total = '${parseFloat(
            req.body.profarmaMainData.Net_Total || 0
          ).toFixed(2)}',
          Discount = '${parseFloat(
            req.body.profarmaMainData.Discount || 0
          ).toFixed(2)}',
          AssessableValue = '${parseFloat(
            req.body.profarmaMainData.AssessableValue || 0
          ).toFixed(2)}',
          Del_Chg = '${parseFloat(
            req.body.profarmaMainData.Del_Chg || 0
          ).toFixed(2)}',
          InvTotal = '${parseFloat(
            req.body.profarmaMainData.InvTotal || 0
          ).toFixed(2)}',
          Round_Off = '${parseFloat(
            req.body.profarmaMainData.Round_Off || 0
          ).toFixed(2)}',
          GrandTotal = '${parseFloat(
            req.body.profarmaMainData.GrandTotal || 0
          ).toFixed(2)}'
      WHERE
          (ProfarmaID = '${req.body.profarmaMainData.ProfarmaID}')`,
      (err, udpateMainData) => {
        if (err) {
          console.log(err);
        } else {
          // update details
          for (let i = 0; i < req.body.profarmaDetailsData.length; i++) {
            const element = req.body.profarmaDetailsData[i];

            try {
              misQueryMod(
                `UPDATE magodmis.profarmadetails SET Qty = '${parseInt(
                  element.Qty || 0
                )}', Unit_Rate = '${parseFloat(element.Unit_Rate || 0).toFixed(
                  2
                )}', DC_Srl_Amt = '${parseFloat(
                  element.DC_Srl_Amt || 0
                ).toFixed(2)}' WHERE (ProfarmaDetailID = '${
                  element.ProfarmaDetailID
                }')`,
                (err, udpateDetailsData) => {
                  if (err) {
                    console.log(err);
                  } else {
                  }
                }
              );
            } catch (error) {
              next(error);
            }
          }

          // delete tax data
          try {
            misQueryMod(
              `DELETE FROM magodmis.profarmataxtable WHERE (ProfarmaID = '${req.body.profarmaMainData.ProfarmaID}')`,
              (err, data) => {
                if (err) {
                  console.log(err);
                } else {
                }
              }
            );
          } catch (error) {
            next(error);
          }

          // insert tax data

          for (let i = 0; i < req.body.profarmaTaxData.length; i++) {
            const element = req.body.profarmaTaxData[i];

            try {
              misQueryMod(
                `INSERT INTO magodmis.profarmataxtable (ProfarmaID, TaxID, Tax_Name, TaxOn, TaxableAmount, TaxPercent, TaxAmt) VALUES ('${
                  element.ProfarmaID
                }', '${element.TaxID}', '${element.Tax_Name}', '${
                  element.TaxOn
                }', '${parseFloat(element.TaxableAmount).toFixed(
                  2
                )}', '${parseFloat(element.TaxPercent).toFixed(
                  2
                )}', '${parseFloat(element.TaxAmt).toFixed(2)}')`,
                (err, insertTaxData) => {
                  if (err) {
                    console.log(err);
                  } else {
                  }
                }
              );
            } catch (error) {
              next(error);
            }
          }

          res.send({
            flag: true,
            message: "Invoice saved successfully",
          });
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

// ProfarmaInvFormRouter.post(
//   "/postInvFormCreateInvoice",
//   async (req, res, next) => {
//     //   console.log("req.body.ProfarmaID", req.body.ProfarmaID);
//     try {
//       misQueryMod(
//         `UPDATE magodmis.profarma_main SET ProformaInvNo = '${req.body.series}', ProformaDate = now(), Status='Invoiced' WHERE (ProfarmaID = '${req.body.ProfarmaID}')`,
//         (err, data) => {
//           if (err) {
//             console.log(err);
//           } else {
//             res.send(data);
//           }
//         }
//       );
//     } catch (error) {
//       next(error);
//     }
//   }
// );

ProfarmaInvFormRouter.post(
  "/postInvFormCreateInvoice",
  async (req, res, next) => {
    // const DCStatus = "Dispatched";

    try {
      misQueryMod(
        `SELECT 
          *
        FROM
          magod_setup.year_prefix_suffix
        WHERE
          UnitName = '${req.body.runningNoData.UnitName}' AND SrlType = '${req.body.runningNoData.SrlType}'`,
        (err, yearPrefixSuffixData) => {
          if (err) {
            logger.error(err);
          } else {
            // console.log("yearPrefixSuffixData", yearPrefixSuffixData[0]);

            misQueryMod(
              `SELECT * FROM magod_setup.magod_runningno WHERE Id = '${req.body.runningNoData.Id}'`,
              (err, runningNoData) => {
                if (err) {
                  logger.error(err);
                } else {
                  let newRunningNo = (
                    parseInt(runningNoData[0].Running_No) + 1
                  ).toString();

                  for (let i = 0; i < runningNoData[0].Length; i++) {
                    // const element = newRunningNo[i];

                    if (newRunningNo.length < runningNoData[0].Length) {
                      newRunningNo = 0 + newRunningNo;
                    }
                  }
                  let newRunningNoWithPS =
                    (yearPrefixSuffixData[0].Prefix || "") +
                    newRunningNo +
                    (yearPrefixSuffixData[0].Suffix || "");

                  // console.log("newRunningNo", newRunningNo);
                  // console.log("newRunningNoWithPS", newRunningNoWithPS);

                  let newRunningNoWithPSAndFin =
                    runningNoData[0].Period + "/" + newRunningNoWithPS;

                  // update register

                  try {
                    misQueryMod(
                      `UPDATE magodmis.profarma_main SET ProformaInvNo = '${newRunningNoWithPSAndFin}', ProformaDate = now(), Status='Invoiced' WHERE (ProfarmaID = '${req.body.ProfarmaID}')`,
                      (err, data) => {
                        if (err) {
                          console.log(err);
                        } else {
                          misQueryMod(
                            `UPDATE magod_setup.magod_runningno SET Running_No = '${parseInt(
                              newRunningNo
                            )}', Prefix = '${
                              yearPrefixSuffixData[0].Prefix || ""
                            }', Suffix = '${
                              yearPrefixSuffixData[0].Suffix || ""
                            }' WHERE (Id = '${req.body.runningNoData.Id}')`,
                            (err, updateRunningNo) => {
                              if (err) {
                                logger.error(err);
                              } else {
                                console.log("updated running no");
                                res.send({
                                  flag: true,
                                  message: "Proforma Invoice Created",
                                });
                              }
                            }
                          );
                        }
                      }
                    );
                  } catch (error) {
                    next(error);
                  }
                }
              }
            );
          }
        }
      );
    } catch (error) {
      next(error);
    }
  }
);
module.exports = ProfarmaInvFormRouter;
