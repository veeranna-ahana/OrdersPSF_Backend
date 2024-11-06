const express = require("express");
const scheduleListCombined = express.Router();
const fs = require("fs");
const path = require("path");
const { error } = require("winston");
const {
  misQuery,
  setupQuery,
  misQueryMod,
  mchQueryMod,
  productionQueryMod,
  mchQueryMod1,
} = require("../../helpers/dbconn");
const { logger } = require("../../helpers/logger");
const bodyParser = require("body-parser");
const moment = require("moment");

// create application/json parser
var jsonParser = bodyParser.json();

///////////////////////////////////////////////////
// Define the base directory path
const baseDirectory = "C:/Magod/Jigani/Wo";

scheduleListCombined.post("/files", jsonParser, async (req, res, next) => {
  // Access OrderNo from the nested structure
  const { requestData } = req.body;
  const { OrderNo } = requestData;

  if (!OrderNo) {
    return res.status(400).send("OrderNo is missing in the request data");
  }

  const orderNumber = Number(OrderNo); // Convert OrderNo to number if needed

  if (isNaN(orderNumber)) {
    return res.status(400).send("Invalid OrderNo");
  }

  // Construct the directory path with the OrderNo and 'DXF' appended
  const directoryPath = path.join(baseDirectory, orderNumber.toString(), "DXF");

  // Check if the directory exists
  if (!fs.existsSync(directoryPath)) {
    console.error(`Directory does not exist: ${directoryPath}`);
    return res.status(404).send(`Directory does not exist: ${directoryPath}`);
  }

  console.log("Received request to list files from directory:", directoryPath);

  // Read the directory to get the list of files
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error("Unable to scan directory:", err);
      return res.status(500).send("Unable to scan directory: " + err);
    }

    const fileDetails = files.map((file) => ({
      name: file,
      url: `/schedule/uploads/${orderNumber.toString()}/DXF/${file}`,
    }));

    console.log("Sending file list response");
    res.send(fileDetails);
    console.log("fileDetails is", fileDetails);
  });
});

// Serve static files in the 'uploads' directory
scheduleListCombined.use(
  "/uploads",
  express.static(baseDirectory, {
    setHeaders: function (res, path) {
      res.set("Content-Disposition", "attachment");
    },
  })
);

////////////////////

scheduleListCombined.get(
  "/ScheduleListOrdered",
  jsonParser,
  async (req, res, next) => {
    try {
      mchQueryMod(
        `SELECT o.*, c.Cust_name,c1.cmbSchID 
      FROM  magodmis.orderschedule o,magodmis.cust_data c,magodmis.combined_schedule c1 
      WHERE o.ScheduleType='Combined' AND OrdSchNo LIKE '99%' 
      AND (o.Schedule_Status='Tasked' OR o.Schedule_Status='Programmed' 
      OR o.Schedule_Status='Production' OR o.Schedule_Status='Processing' 
      OR o.Schedule_Status='Completed' OR o.Schedule_Status='Inspected')
      AND o.Cust_Code=c.Cust_Code AND o.ScheduleId=c1.ScheduleID`,
        (err, data) => {
          if (err) logger.error(err);
          //console.log(data)
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

scheduleListCombined.get(
  "/ScheduleListOrderedSales",
  jsonParser,
  async (req, res, next) => {
    try {
      mchQueryMod(
        `SELECT o.*, c.Cust_name,c1.cmbSchID 
      FROM  magodmis.orderschedule o,magodmis.cust_data c,magodmis.combined_schedule c1 
      WHERE o.ScheduleType='Combined' AND OrdSchNo LIKE '88%' 
      AND (o.Schedule_Status='Tasked' OR o.Schedule_Status='Programmed' 
      OR o.Schedule_Status='Production' OR o.Schedule_Status='Processing' 
      OR o.Schedule_Status='Completed' OR o.Schedule_Status='Inspected')
      AND o.Cust_Code=c.Cust_Code AND o.ScheduleId=c1.ScheduleID`,
        (err, data) => {
          if (err) logger.error(err);
          //console.log(data)
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

scheduleListCombined.get(
  "/ScheduleListClosed",
  jsonParser,
  async (req, res, next) => {
    try {
      mchQueryMod(
        `SELECT o.*, c.Cust_name,c1.cmbSchID 
      FROM  magodmis.orderschedule o,magodmis.cust_data c,magodmis.combined_schedule c1 
      WHERE o.ScheduleType='Combined' AND OrdSchNo LIKE '99%' 
      AND (o.Schedule_Status='Closed' OR o.Schedule_Status='ShortClosed' )
      AND o.Cust_Code=c.Cust_Code AND o.ScheduleId=c1.ScheduleID`,
        (err, data) => {
          if (err) logger.error(err);
          //console.log(data)
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

scheduleListCombined.get(
  "/ScheduleListClosedSales",
  jsonParser,
  async (req, res, next) => {
    try {
      mchQueryMod(
        `SELECT o.*, c.Cust_name,c1.cmbSchID 
      FROM  magodmis.orderschedule o,magodmis.cust_data c,magodmis.combined_schedule c1 
      WHERE o.ScheduleType='Combined' AND OrdSchNo LIKE '88%' 
      AND (o.Schedule_Status='Closed' OR o.Schedule_Status='ShortClosed' )
      AND o.Cust_Code=c.Cust_Code AND o.ScheduleId=c1.ScheduleID`,
        (err, data) => {
          if (err) logger.error(err);
          //console.log(data)
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

//ScheduleList Details
scheduleListCombined.post(
  "/scheduleListDetails",
  jsonParser,
  async (req, res, next) => {
    // console.log("req.ody",req.body)
    try {
      mchQueryMod(
        `SELECT o1.*, c.cmbSchId, o.SchDetailsID, o.Schedule_Srl, o.DwgName, o.Mtrl_Code, o.MProcess, o.Mtrl_Source, o.QtyScheduled, o.QtyProgrammed, o.QtyProduced, o.QtyInspected, o.QtyCleared,o.Rejections, o.Tester, o.LOC, o.Holes, o.Part_Area, o.UnitWt, o.Operation,(SELECT COUNT(*) FROM magodmis.combined_schedule_details c JOIN magodmis.orderschedule o1 ON c.scheduleId = o1.ScheduleID JOIN magodmis.orderscheduledetails o ON c.scheduleId = o.ScheduleID WHERE c.cmbSchId = '${req.body.selectedRow.cmbSchID}') AS TotalRows
     FROM  magodmis.combined_schedule_details c JOIN magodmis.orderschedule o1 ON c.scheduleId = o1.ScheduleID JOIN magodmis.orderscheduledetails o ON c.scheduleId = o.ScheduleID WHERE c.cmbSchId = '${req.body.selectedRow.cmbSchID}'`,
        (err, data) => {
          if (err) logger.error(err);
          //console.log(data)
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

///Combined Tasks Table
scheduleListCombined.post(
  "/combinedTaksTaskTable",
  jsonParser,
  async (req, res, next) => {
    try {
      mchQueryMod(
        `SELECT * FROM magodmis.nc_task_list n WHERE n.ScheduleID='${req.body.ScheduleId}'`,
        (err, data) => {
          if (err) logger.error(err);
          //console.log(data)
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

//Combined Taks After Selecting a Row in table
scheduleListCombined.post(
  "/combinedTaksShowDwgName",
  jsonParser,
  async (req, res, next) => {
    // console.log("req.body",req.body)
    try {
      mchQueryMod(
        `SELECT * from magodmis.task_partslist where TaskNo='${req.body.TaskNo}'`,
        (err, data) => {
          if (err) logger.error(err);
          //console.log(data)
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

//Original Schedule Table 1
scheduleListCombined.post(
  "/OriginalTable1",
  jsonParser,
  async (req, res, next) => {
    // console.log("req.body",req.body.selectedRow.cmbSchId);
    try {
      mchQueryMod(
        `SELECT  o.*, c.cmbSchId 
      FROM magodmis.combined_schedule_details c,magodmis.orderschedule o 
      WHERE c.cmbSchId='${req.body.selectedRow.cmbSchID}' AND c.scheduleId=o.ScheduleID`,
        (err, data) => {
          if (err) logger.error(err);
          //console.log(data)
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

//Origanl Schedule Table2
scheduleListCombined.post(
  "/OriginalTable2",
  jsonParser,
  async (req, res, next) => {
    // console.log("req.body",req.body.list);
    try {
      mchQueryMod(
        `SELECT * FROM magodmis.orderscheduledetails WHERE ScheduleId='${req.body.list.ScheduleId}'`,
        (err, data) => {
          if (err) logger.error(err);
          // console.log("data",data)
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

//Save Button

scheduleListCombined.post("/save", jsonParser, async (req, res, next) => {
  // console.log("req.body",req.body.list);
  try {
    mchQueryMod(
      `UPDATE magodmis.orderschedule  SET  Delivery_Date='${req.body.updatedSelectedRow.Delivery_Date}', Dealing_Engineer='${req.body.updatedSelectedRow.Dealing_Engineer}',Special_Instructions='${req.body.updatedSelectedRow.Special_Instructions}' where OrdSchNo='${req.body.updatedSelectedRow.OrdSchNo}'`,
      (err, data) => {
        if (err) logger.error(err);
        // console.log("data",data)
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//Onclick of Update To Original Schedule
scheduleListCombined.post(
  "/updateToOriganalSchedule",
  jsonParser,
  async (req, res, next) => {
    try {
      const scheduleId = req.body.selectedRow.ScheduleId;

      // Query to fetch rows from orderscheduledetails
      const ordersQuery = `SELECT * FROM magodmis.orderscheduledetails WHERE ScheduleId='${scheduleId}';`;
      const ordersResult = await mchQueryMod1(ordersQuery, [scheduleId]);

      // Loop through each row in the result
      for (const orderRow of ordersResult) {
        const schDetailsId = orderRow.SchDetailsID;

        // Query to fetch rows from combined_schedule_part_details
        const combinedQuery = `SELECT * FROM magodmis.combined_schedule_part_details WHERE N_SchDetailsID='${schDetailsId}';`;
        const combinedResult = await mchQueryMod1(combinedQuery, [
          schDetailsId,
        ]);

        // Loop through each row in the combinedResult
        for (const combinedRow of combinedResult) {
          const cmbSchPartID = combinedRow.cmbSchPartID;
          const cmbSchId = combinedRow.cmbSchId;
          const ScheduleID = combinedRow.ScheduleID;

          // Update query for combined_schedule_part_details and task_partslist
          const updateCombinedQuery = `
                    UPDATE magodmis.combined_schedule_part_details c, magodmis.task_partslist t 
                    SET 
                        t.LOC = c.LOC, 
                        t.Pierces = c.Holes, 
                        t.Part_Area = c.Part_Area,  
                        t.Unit_Wt = c.UnitWt,
                        t.QtyProduced = t.QtyProduced + (c.QtyCleared - c.QtyDistributed),
                        t.QtyCleared = t.QtyCleared + (c.QtyCleared - c.QtyDistributed)
                    WHERE 
                        c.cmbSchId = '${cmbSchId}' AND t.SchDetailsId = c.O_SchDetailsID AND c.cmbSchPartID = '${cmbSchPartID}';
                `;

          // Update query for setting QtyDistributed in combined_schedule_part_details
          const updateQtyDistributedQuery = `
                    UPDATE magodmis.combined_schedule_part_details c 
                    SET c.QtyDistributed = c.QtyCleared 
                    WHERE c.cmbSchPartID ='${cmbSchPartID}' ;
                `;

          // Update query for task_partslist and orderscheduledetails
          const updateTaskOrdersQuery = `
                    UPDATE magodmis.task_partslist t, magodmis.orderscheduledetails o 
                    SET 
                        o.QtyProduced = t.QtyCleared, 
                        o.LOC = t.LOC, 
                        o.Holes = t.Pierces, 
                        o.Part_Area = t.Part_Area, 
                        o.UnitWt = t.Unit_Wt 
                    WHERE 
                        o.ScheduleId = '${ScheduleID}'  AND o.SchDetailsId = t.SchDetailsId;
                `;

          // Execute the update queries with parameters
          await mchQueryMod1(updateCombinedQuery, [cmbSchId, cmbSchPartID]);
          await mchQueryMod1(updateQtyDistributedQuery, [cmbSchPartID]);
          await mchQueryMod1(updateTaskOrdersQuery, [ScheduleID]);
        }
      }

      res.send("Update completed successfully");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

//OnClick of Update Task
scheduleListCombined.post("/updateTask", jsonParser, async (req, res, next) => {
  // console.log("req.body",req.body.DwgSelect)
  try {
    // Fetch QtyDistribute from combined_schedule_part_details
    const qtyDistributeQuery = `SELECT QtyDistributed FROM magodmis.combined_schedule_part_details WHERE N_SchDetailsID='${req.body.DwgSelect.SchDetailsId}';`;
    const qtyDistributeResult = await mchQueryMod1(qtyDistributeQuery);

    // Fetch part details from task_partslist
    const partQuery = `SELECT * FROM magodmis.task_partslist WHERE SchDetailsId='${req.body.DwgSelect.SchDetailsId}';`;
    const partResult = await mchQueryMod1(partQuery);

    const qtyDistributed = qtyDistributeResult[0].QtyDistributed;
    const part = partResult[0];

    // Check condition: If part.QtyCleared < QtyDistributed
    if (part.QtyCleared < qtyDistributed) {
      const errorMsg = `Cannot Change Qty Cleared For Drawing ${part.DwgName} To ${part.QtyCleared}\n${qtyDistributed} has already been distributed to Original Schedules`;
      res.send(errorMsg);
    } else {
      // Fetch schPart details from orderscheduledetails
      const schPartQuery = `SELECT * FROM magodmis.orderscheduledetails WHERE SchDetailsID='${req.body.DwgSelect.SchDetailsId}';`;
      const schPartResult = await mchQueryMod1(schPartQuery);
      const schPart = schPartResult[0];

      // Check condition: If schPart.QtyCleared < part.QtyCleared
      if (schPart && schPart.QtyCleared < part.QtyCleared) {
        const updateSchPartQuery = `UPDATE magodmis.orderscheduledetails SET QtyCleared=${part.QtyCleared} WHERE SchDetailsID='${req.body.DwgSelect.SchDetailsId}';`;
        await mchQueryMod1(updateSchPartQuery);
      }

      // Send the result or response as needed
      const sucessmessage = `Success`;
      res.send(sucessmessage);
    }
  } catch (error) {
    next(error);
  }
});

///Distribute Parts
scheduleListCombined.post(
  "/distributeParts",
  jsonParser,
  async (req, res, next) => {
    try {
      const scheduleList = req.body.scheduleListDetailsData;

      if (!Array.isArray(scheduleList) || scheduleList.length === 0) {
        return res
          .status(400)
          .send({
            error:
              "Invalid request: scheduleListDetailsData is missing or not properly structured",
          });
      }

      for (const selectedRow of scheduleList) {
        const scheduleId = selectedRow.ScheduleId;

        if (!scheduleId) {
          console.error(
            `Missing ScheduleId for entry: ${JSON.stringify(selectedRow)}`
          );
          continue; // Skip this iteration if ScheduleId is missing
        }

        // Fetch part details from orderscheduledetails
        const partQuery = `SELECT * FROM magodmis.orderscheduledetails WHERE ScheduleId='${scheduleId}';`;
        const partResult = await mchQueryMod1(partQuery);

        for (const part of partResult) {
          if (!part.SchDetailsId) {
            console.error(`Missing SchDetailsId for ScheduleId ${scheduleId}`);
            continue; // Skip to next iteration if SchDetailsId is missing
          }

          // Fetch schPart details from combined_schedule_part_details
          const schPartQuery = `SELECT * FROM magodmis.combined_schedule_part_details WHERE N_SchDetailsID='${part.SchDetailsId}';`;
          const schPartResult = await mchQueryMod1(schPartQuery);
          const schPart = schPartResult[0];

          // Fetch TotQtyScheduled from combined_schedule_part_details
          const totQtyScheduledQuery = `SELECT QtyScheduled FROM magodmis.combined_schedule_part_details WHERE N_SchDetailsID='${part.SchDetailsId}';`;
          const totQtyScheduledResult = await mchQueryMod1(
            totQtyScheduledQuery
          );
          const TotQtyScheduled = totQtyScheduledResult[0].QtyScheduled;

          // Check condition: If TotQtyScheduled = part.QtyCleared
          if (TotQtyScheduled === part.QtyCleared) {
            // Update schPart.QtyCleared = schPart.QtyScheduled
            const updateQtyClearedQuery = `UPDATE magodmis.combined_schedule_part_details SET QtyCleared=${schPart.QtyScheduled} WHERE N_SchDetailsID='${part.SchDetailsId}'`;
            await mchQueryMod1(updateQtyClearedQuery);
          } else if (part.QtyCleared !== 0) {
            // Send response and display manual distribution message
            return res.send({
              error: "Distribute manually for " + part.DwgName,
            });
          }
        }
      }

      // Send response and display success message
      res.send({ success: "Parts Distributed" });
    } catch (error) {
      // Handle errors
      next(error);
    }
  }
);

//Print
scheduleListCombined.post(`/PrintPdf`, async (req, res, next) => {
  try {
    let query = `SELECT * FROM magodmis.orderscheduledetails where ScheduleId='${req.body.formdata.ScheduleId}';`;

    misQueryMod(query, (err, data) => {
      if (err) {
        console.log("err", err);
        res
          .status(500)
          .send({ error: "An error occurred while fetching data" });
      } else {
        if (data.length > 0) {
          // Group data by task number
          const groupedData = {};
          data.forEach((item) => {
            const TaskNo = item.TaskNo;
            if (!groupedData[TaskNo]) {
              groupedData[TaskNo] = [];
            }
            groupedData[TaskNo].push(item);
          });

          // Format grouped data
          const formattedData = [];
          for (const TaskNo in groupedData) {
            formattedData.push({
              taskNo: TaskNo,
              Mtrl_Code: groupedData[TaskNo][0].Mtrl_Code,
              Mtrl_Source: groupedData[TaskNo][0].Mtrl_Source,
              Operation: groupedData[TaskNo][0].Operation,
              otherdetails: groupedData[TaskNo],
            });
          }

          res.send(formattedData);
        } else {
          res
            .status(404)
            .send({ error: "No data found for the provided ScheduleId" });
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

//get customer name
scheduleListCombined.post(`/getCustomerNamePDF`, async (req, res, next) => {
  let query = `SELECT Cust_name FROM magodmis.cust_data  where Cust_Code='${req.body.formdata.Cust_Code}'
    `;

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

//Copy Drawing
scheduleListCombined.post("/copyDwg", async (req, res, next) => {
  try {
    const requestData = req.body.requestData;

    if (
      !requestData ||
      !requestData.selectedRow ||
      !requestData.orinalScheudledata
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request body" });
    }

    const { selectedRow, orinalScheudledata } = requestData;

    const sourceDirs = orinalScheudledata.map((data) =>
      path.join("C:", "Magod", "Jigani", "Wo", data.Order_No, "DXF")
    );
    const targetDir = path.join(
      "C:",
      "Magod",
      "Jigani",
      "Wo",
      selectedRow.Order_No,
      "DXF"
    );

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    sourceDirs.forEach((sourceDir) => {
      fs.readdir(sourceDir, (err, files) => {
        if (err) {
          console.error(`Error reading directory ${sourceDir}:`, err);
          return;
        }

        files.forEach((file) => {
          const sourceFilePath = path.join(sourceDir, file);
          const targetFilePath = path.join(targetDir, file);

          fs.copyFile(sourceFilePath, targetFilePath, (err) => {
            if (err) {
              console.error(
                `Error copying file ${sourceFilePath} to ${targetFilePath}:`,
                err
              );
            }
          });
        });
      });
    });

    res.status(200).json({
      success: true,
      message: "Files copied successfully",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = scheduleListCombined;
