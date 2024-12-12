const taskSheet = require("express").Router();
var createError = require("http-errors");
const req = require("express/lib/request");
const {
  misQuery,
  setupQuery,
  misQueryMod,
  qtnQueryMod,
  setupQueryMod,
} = require("../helpers/dbconn");
const { logger } = require("../helpers/logger");

taskSheet.get("/getData", async (req, res, next) => {
  const { ncid } = req.query;
  // console.log("ncid", req.query);

  try {
    misQueryMod(
      `SELECT * FROM magodmis.ncprograms where Ncid  = ${ncid}`,
      (err, data1) => {
        if (err) {
          logger.error(err);
          return next(err);
        }

        const ncTaskId = data1[0].NcTaskId;

        misQueryMod(
          `SELECT * FROM magodmis.orderscheduledetails where NcTaskId = ${ncTaskId}`,
          (err, data2) => {
            if (err) {
              logger.error(err);
              return next(err);
            }

            misQueryMod(
              `SELECT c2.PartId,c1.Quantity as QtyPerAssy, c2.Id As CustBOM_Id, t.Task_Part_ID,t.QtyNested*c1.Quantity
              as QtyRequired FROM magodmis.task_partslist t,magodmis.orderscheduledetails o,magodmis.cust_assy_data c,
              magodmis.cust_assy_bom_list c1,magodmis.cust_bomlist c2
              WHERE t.NcTaskId = ${ncTaskId} and t.HasBOM and t.SchDetailsId=o.SchDetailsID
              AND c.MagodCode = o.Dwg_Code AND c1.Cust_AssyId=c.Id AND c1.Cust_BOM_ListId=c2.Id`,
              (err, data3) => {
                if (err) {
                  logger.error(err);
                  return next(err);
                }

                const responseData = {
                  data1,
                  data2,
                  data3,
                };

                res.send(responseData);
              }
            );
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
});

taskSheet.post("/saveTaskSheetRegister", async (req, res, next) => {
  const {
    ncid,
    anyDeffects,
    taskDate,
    machineNo,
    programNo,
    fixtureRequirement,
    lensDistance,
    mtrlThickness,
    withFiller,
    fillerMaterial,
    batchNo,
    machinePeakPower,
    laserEquipment,
    reweldPermitted,
    fixtureNo,
    controlPlanNo,
    wpsNo,
    pfdNo,
    wiNo,
    pqrNo,
    standardOfRef,
    partInspectionQC,
    partInspectionWeldEngineer,
    partInspectionIncharge,
    partInspectionProjectManager,
    weldSettingQC,
    weldSettingWeldEngineer,
    weldSettingIncharge,

    preFlowGas,
    postFlowGas,
    designType,
    weldSide,
    gasType,
    backing,
    tackWeld,
    note,
  } = req.body;
  // console.log("Task_Date", req.body.taskDate);

  const lensDistanceValue = lensDistance !== "" ? lensDistance : "NULL";
  const mtrlThicknessValue = mtrlThickness !== "" ? mtrlThickness : "NULL";
  const machinePeakPowerValue =
    machinePeakPower !== "" ? machinePeakPower : "NULL";

  const backingValue = backing !== "" ? backing : "NULL";
  const anyDeffectsValue = anyDeffects !== "" ? anyDeffects : "NULL";
  const fixtureRequirementValue =
    fixtureRequirement !== "" ? fixtureRequirement : "NULL";
  const withFillerValue = withFiller !== "" ? withFiller : "NULL";
  const reweldPermittedValue =
    reweldPermitted !== "" ? reweldPermitted : "NULL";
  const tackWeldValue = tackWeld !== "" ? tackWeld : "NULL";

  const preFlowGasValue = preFlowGas !== "" ? preFlowGas : "NULL";
  const postFlowGasValue = postFlowGas !== "" ? postFlowGas : "NULL";

  try {
    misQueryMod(
      `SELECT COUNT(*) AS count FROM magodmis.taskSheet_register where Ncid = ${ncid}`,
      (err, data) => {
        if (err) {
          logger.error(err);
          return res.status(500).send("Error checking count");
        }
        const count = data[0].count;

        if (count === 0) {
          misQueryMod(
            `INSERT INTO magodmis.taskSheet_register (Ncid, Defects, Task_Date, Machine, NCProgramNo, Fixture_Requirement, Lens_Distance, Material_Thickness, With_Filler, Filler, Batch_No, Machine_Peak_Power, Laser_Type, Reweld_Permitted, Fixture_No, Control_Plan_No, WPS_No, PFD_No, WI_No, PQR_No, Standard_Parameter_Ref, PartInspection_QC, PartInspection_WeldEngineer, PartInspection_Incharge, PartInspection_Project_Manager, WeldSetting_QC, WeldSetting_WeldEngineer, WeldSetting_Incharge, Pre_Flow_Gas, Post_Flow_Gas, Design_Type, Weld_Side, Gas_Type, Backing, Tack_Weld, Note) VALUES (${ncid},
              ${anyDeffectsValue},
              '${taskDate}',
              '${machineNo}', '${programNo}',
              ${fixtureRequirementValue},
              ${lensDistanceValue}, ${mtrlThicknessValue},
              ${withFillerValue},
              '${fillerMaterial}', '${batchNo}', ${machinePeakPowerValue}, '${laserEquipment}',
              ${reweldPermittedValue},
              '${fixtureNo}', '${controlPlanNo}', '${wpsNo}', '${pfdNo}', '${wiNo}', '${pqrNo}', '${standardOfRef}', ${partInspectionQC}, ${partInspectionWeldEngineer}, ${partInspectionIncharge}, ${partInspectionProjectManager}, ${weldSettingQC}, ${weldSettingWeldEngineer}, ${weldSettingIncharge}, ${preFlowGasValue}, ${postFlowGasValue},
              '${designType}','${weldSide}', '${gasType}',${backingValue},${tackWeldValue},'${note}')`,
            (err, result) => {
              if (err) {
                logger.error(err);
                return res
                  .status(500)
                  .send("Error inserting data into taskSheet_register");
              }

              res.send("Data inserted successfully");
            }
          );
        } else {
          misQueryMod(
            `UPDATE magodmis.taskSheet_register SET Defects = ${anyDeffectsValue},
            Task_Date = '${taskDate}',
            Machine = '${machineNo}',
            NCProgramNo = '${programNo}',
            Fixture_Requirement = ${fixtureRequirementValue},
            Lens_Distance = ${lensDistanceValue},
            Material_Thickness = ${mtrlThicknessValue},
            With_Filler = ${withFillerValue},
            Filler = '${fillerMaterial}',
            Batch_No = '${batchNo}',
            Machine_Peak_Power = ${machinePeakPowerValue},
            Laser_Type = '${laserEquipment}',
            Reweld_Permitted = ${reweldPermittedValue},
            Fixture_No = '${fixtureNo}',
            Control_Plan_No = '${controlPlanNo}',
            WPS_No = '${wpsNo}',
            PFD_No = '${pfdNo}',
            WI_No = '${wiNo}',
            PQR_No = '${pqrNo}',
            Standard_Parameter_Ref = '${standardOfRef}',
            PartInspection_QC = ${partInspectionQC},
            PartInspection_WeldEngineer = ${partInspectionWeldEngineer},
            PartInspection_Incharge = ${partInspectionIncharge},
            PartInspection_Project_Manager = ${partInspectionProjectManager},
            WeldSetting_QC = ${weldSettingQC},
            WeldSetting_WeldEngineer = ${weldSettingWeldEngineer},
            WeldSetting_Incharge = ${weldSettingIncharge},
            Pre_Flow_Gas = ${preFlowGasValue},
            Post_Flow_Gas = ${postFlowGasValue},
            Design_Type = '${designType}',
            Weld_Side = '${weldSide}',
            Gas_Type = '${gasType}',
            Backing = ${backingValue},
            Tack_Weld = ${tackWeldValue},
            Note = '${note}'
            WHERE Ncid = ${ncid}`,
            (err, result) => {
              if (err) {
                logger.error(err);
                return res
                  .status(500)
                  .send("Error updating taskSheet_register");
              }
            }
          );

          res.send("Data inserted/updated successfully");
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

taskSheet.post("/saveSolidStateParameters", async (req, res, next) => {
  const {
    ncid,
    sspoweratfocus,
    ssfocusDia,
    sspulseDuration,
    sspulseFrequency,
    sspulseShapeNo,
    ssgasPressure,
    ssfeedRate,
    ssrpm,
    ssgasPurity,
    ssgapRange,
    ssgasFlowOrientation,
  } = req.body;

  const sspoweratfocusValue = sspoweratfocus !== "" ? sspoweratfocus : "NULL";
  const ssfocusDiaValue = ssfocusDia !== "" ? ssfocusDia : "NULL";
  const sspulseDurationValue =
    sspulseDuration !== "" ? sspulseDuration : "NULL";
  const sspulseFrequencyValue =
    sspulseFrequency !== "" ? sspulseFrequency : "NULL";
  const sspulseShapeNoValue = sspulseShapeNo !== "" ? sspulseShapeNo : "NULL";
  const ssgasPressureValue = ssgasPressure !== "" ? ssgasPressure : "NULL";
  const ssfeedRateValue = ssfeedRate !== "" ? ssfeedRate : "NULL";

  const ssrpmValue = ssrpm !== "" ? ssrpm : "NULL";
  const ssgasPurityValue = ssgasPurity !== "" ? ssgasPurity : "NULL";
  const ssgapRangeValue = ssgapRange !== "" ? ssgapRange : "NULL";
  const ssgasFlowOrientationValue =
    ssgasFlowOrientation !== "" ? ssgasFlowOrientation : "NULL";

  try {
    misQueryMod(
      `SELECT COUNT(*) AS count FROM magodmis.solidState_Parameters where Ncid = ${ncid}`,
      (err, data) => {
        if (err) {
          logger.error(err);
          return res.status(500).send("Error checking count");
        }
        const count = data[0].count;

        if (count === 0) {
          misQueryMod(
            `INSERT INTO magodmis.solidState_Parameters (Ncid, Power_at_focus,Focus_Dia, Pulse_Duration, Pulse_Frequency, Pulse_Shape_No, Gas_Pressure, Feed_Rate, RPM, Gas_Purity, Gap_Range, Gas_Flow_Orientation) VALUES (${ncid}, 
              ${sspoweratfocusValue}, ${ssfocusDiaValue}, ${sspulseDurationValue}, ${sspulseFrequencyValue}, ${sspulseShapeNoValue}, ${ssgasPressureValue}, ${ssfeedRateValue}, ${ssrpmValue}, ${ssgasPurityValue}, ${ssgapRangeValue}, ${ssgasFlowOrientationValue})`,
            (err, result) => {
              if (err) {
                logger.error(err);
                return res
                  .status(500)
                  .send("Error inserting data into solidState_Parameters");
              }

              res.send("Data inserted successfully");
            }
          );
        } else {
          misQueryMod(
            `UPDATE magodmis.solidState_Parameters SET Power_at_focus = ${sspoweratfocusValue}, 
            Focus_Dia = ${ssfocusDiaValue}, 
            Pulse_Duration = ${sspulseDurationValue}, 
            Pulse_Frequency = ${sspulseFrequencyValue}, 
            Pulse_Shape_No = ${sspulseShapeNoValue}, 
            Gas_Pressure = ${ssgasPressureValue}, 
            Feed_Rate = ${ssfeedRateValue}, 
            RPM = ${ssrpmValue}, 
            Gas_Purity = ${ssgasPurityValue}, 
            Gap_Range = ${ssgapRangeValue}, 
            Gas_Flow_Orientation = ${ssgasFlowOrientationValue}
            WHERE Ncid = ${ncid}`,
            (err, result) => {
              if (err) {
                logger.error(err);
                return res
                  .status(500)
                  .send("Error updating solidState_Parameters");
              }
            }
          );

          res.send("Data inserted/updated successfully");
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

taskSheet.post("/saveCo2Parameters", async (req, res, next) => {
  const {
    ncid,
    copowerTransmissionEfficiency,
    copower,
    cofrequency,
    cobeamDia,
    cofocus,
    cogasPressure,
    cofeedRate,
    corpm,
    cogasPurity,
    cogapRange,
    cogasFlowOrientation,
  } = req.body;

  const copowerTransmissionEfficiencyValue =
    copowerTransmissionEfficiency !== ""
      ? copowerTransmissionEfficiency
      : "NULL";
  const copowerValue = copower !== "" ? copower : "NULL";
  const cofrequencyValue = cofrequency !== "" ? cofrequency : "NULL";
  const cobeamDiaValue = cobeamDia !== "" ? cobeamDia : "NULL";
  const cofocusValue = cofocus !== "" ? cofocus : "NULL";
  const cogasPressureValue = cogasPressure !== "" ? cogasPressure : "NULL";
  const cofeedRateValue = cofeedRate !== "" ? cofeedRate : "NULL";
  const corpmValue = corpm !== "" ? corpm : "NULL";
  const cogasPurityValue = cogasPurity !== "" ? cogasPurity : "NULL";
  const cogapRangeValue = cogapRange !== "" ? cogapRange : "NULL";
  const cogasFlowOrientationValue =
    cogasFlowOrientation !== "" ? cogasFlowOrientation : "NULL";

  try {
    misQueryMod(
      `SELECT COUNT(*) AS count FROM magodmis.co2_laser_parameters where Ncid = ${ncid}`,
      (err, data) => {
        if (err) {
          logger.error(err);
          return res.status(500).send("Error checking count");
        }
        const count = data[0].count;

        if (count === 0) {
          misQueryMod(
            `INSERT INTO magodmis.co2_laser_parameters (Ncid, Power_Transmission_Efficiency,Power, Frequency, Beam_Dia, Focus, Gas_Pressure, Feed_Rate, RPM, Gas_Purity, Gap_Range, Gas_Flow_Orientation) VALUES (${ncid}, 
              ${copowerTransmissionEfficiencyValue}, ${copowerValue}, ${cofrequencyValue}, ${cobeamDiaValue}, ${cofocusValue}, ${cogasPressureValue}, ${cofeedRateValue}, ${corpmValue}, ${cogasPurityValue}, ${cogapRangeValue}, ${cogasFlowOrientationValue})`,
            (err, result) => {
              if (err) {
                logger.error(err);
                return res
                  .status(500)
                  .send(
                    "Error inserting data into magodmis.co2_laser_parameters"
                  );
              }

              res.send("Data inserted successfully");
            }
          );
        } else {
          misQueryMod(
            `UPDATE magodmis.co2_laser_parameters SET Power_Transmission_Efficiency = ${copowerTransmissionEfficiencyValue}, 
            Power = ${copowerValue}, 
            Frequency = ${cofrequencyValue}, 
            Beam_Dia = ${cobeamDiaValue}, 
            Focus = ${cofocusValue}, 
            Gas_Pressure = ${cogasPressureValue}, 
            Feed_Rate = ${cofeedRateValue}, 
            RPM = ${corpmValue},
            Gas_Purity = ${cogasPurityValue}, 
            Gap_Range = ${cogapRangeValue}, 
            Gas_Flow_Orientation = ${cogasFlowOrientationValue}
            WHERE Ncid = ${ncid}`,
            (err, result) => {
              if (err) {
                logger.error(err);
                return res
                  .status(500)
                  .send("Error updating magodmis.co2_laser_parameters");
              }
            }
          );

          res.send("Data inserted/updated successfully");
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

taskSheet.post("/insertSubAssyDetails", async (req, res, next) => {
  const { ncid, subAssy, qtyReceived } = req.body;
  try {
    misQueryMod(
      `INSERT INTO magodmis.taskSheet_details (Ncid, Sub_Assy_Part_Name, Qty_Received) VALUES (${ncid}, '${subAssy}', ${qtyReceived})`,
      async (err, result) => {
        if (err) {
          logger.error(err);
          return res
            .status(500)
            .send("Error inserting data into taskSheet_details");
        }

        misQueryMod(
          `SELECT * FROM magodmis.taskSheet_details where Ncid = ${ncid}`,
          async (err, data) => {
            if (err) {
              logger.error(err);
              return res.status(500).send("Error retrieving inserted data");
            }

            res.send(data);
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
});

taskSheet.post("/deleteSubAssyDetails", async (req, res, next) => {
  const { id } = req.body;
  try {
    misQueryMod(
      `DELETE FROM  magodmis.taskSheet_details WHERE ID = ${id};`,
      async (err, result) => {
        if (err) {
          logger.error(err);
          return res
            .status(500)
            .send("Error deleting data from taskSheet_details");
        }

        res.send(result);
      }
    );
  } catch (error) {
    next(error);
  }
});

taskSheet.post("/updateSubAssyDetails", async (req, res, next) => {
  const { ncid, id, subAssy, qtyReceived } = req.body;

  const qtyReceivedValue = qtyReceived !== "" ? qtyReceived : null;
  try {
    misQueryMod(
      `Update magodmis.taskSheet_details SET Sub_Assy_Part_Name = '${subAssy}', Qty_Received = ${qtyReceivedValue} where ID = ${id}`,
      async (err, result) => {
        if (err) {
          logger.error(err);
          return res
            .status(500)
            .send("Error updating data into taskSheet_details");
        }

        res.send(result);
      }
    );
  } catch (error) {
    next(error);
  }
});

taskSheet.post("/allTaskData", async (req, res, next) => {
  const { ncid } = req.body;
  // console.log("qtnID", req.body);

  try {
    misQueryMod(
      `SELECT * FROM magodmis.taskSheet_register where Ncid = '${ncid}'`,
      (err, taskSheet_register) => {
        if (err) {
          logger.error(err);
          return next(err);
        }

        misQueryMod(
          `SELECT * FROM magodmis.solidState_Parameters where Ncid = '${ncid}'`,
          (err, solidState_Parameters) => {
            if (err) {
              logger.error(err);
              return next(err);
            }

            misQueryMod(
              `SELECT * FROM magodmis.co2_laser_parameters where Ncid = '${ncid}'`,
              (err, co2_laser_parameters) => {
                if (err) {
                  logger.error(err);
                  return next(err);
                }

                misQueryMod(
                  `SELECT * from magodmis.taskSheet_details where Ncid = '${ncid}'`,
                  (err, taskSheet_details) => {
                    if (err) {
                      logger.error(err);
                      return next(err);
                    }

                    // Combine results into an object
                    const responseData = {
                      taskSheet_register,
                      solidState_Parameters,
                      co2_laser_parameters,
                      taskSheet_details,
                    };

                    res.send(responseData);
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
});

taskSheet.get("/getJointType", async (req, res, next) => {
  try {
    qtnQueryMod(
      `SELECT * FROM magodqtn.welding_joint_type where Current = 1`,
      (err, data) => {
        if (err) logger.error(err);
        // console.log(data);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

taskSheet.get("/getWeldSide", async (req, res, next) => {
  try {
    qtnQueryMod(
      `SELECT * FROM magodqtn.weld_side where Current = 1`,
      (err, data) => {
        if (err) logger.error(err);
        // console.log(data);
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

taskSheet.get("/getNcIdData", async (req, res, next) => {
  try {
    qtnQueryMod(`SELECT * FROM magodmis.ncprograms Limit 5000`, (err, data) => {
      if (err) logger.error(err);
      // console.log(data);
      res.send(data);
    });
  } catch (error) {
    next(error);
  }
});

module.exports = taskSheet;
