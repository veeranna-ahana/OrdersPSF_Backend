const NCprogramRoter = require("express").Router();
var createError = require("http-errors");

const {
    misQueryMod,
    setupQuery,
    misQuery,
    mchQueryMod,
} = require("../../helpers/dbconn");

NCprogramRoter.post(`/getFormData`, async (req, res, next) => {
    let query = `SELECT n.*,t.DwgName as AssyName FROM magodmis.nc_task_list n,magodmis.task_partslist t 
    WHERE n.NcTaskId='${req.body.rowselectTaskMaterial.NcTaskId}' AND t.NcTaskId=n.NcTaskId`;
    try {
        misQueryMod(query, (err, data) => {
            if (err) {
                console.log("err", err);
            } else {
                res.send(data);
                //   console.log("data",data)
            }
        });
    } catch (error) {
        next(error);
    }
});


NCprogramRoter.post(`/getMachines`, async (req, res, next) => {
    // console.log("req.body /getMachines is",req.body);
    let query = `SELECT m.RefProcess,  m1.* FROM machine_data.machine_process_list m, machine_data.machine_list m1 
    WHERE m.RefProcess='${req.body.NCprogramForm.Operation}' AND m1.Machine_srl=m.Machine_srl`;
    try {
        misQueryMod(query, (err, data) => {
            if (err) {
                console.log("err", err);
            } else {
                res.send(data);
                //   console.log("data",data)
            }
        });
    } catch (error) {
        next(error);
    }
});

//ADD NCPROGRAM
NCprogramRoter.post('/addProgram', async (req, res, next) => {
    try {
        const { NCprogramForm, HasBOM } = req.body;

        if (!NCprogramForm || !NCprogramForm[0]) {
            return res.status(400).json({ error: "NCprogramForm is missing or empty" });
        }

        const { NcTaskId, TaskNo } = NCprogramForm[0];


        // Check if Quantity Tasked has already been programmed
        const checkQuantityQuery = `SELECT * FROM magodmis.task_partslist WHERE NcTaskId='${NcTaskId}'`;
        misQueryMod(checkQuantityQuery, (err, quantityData) => {
            if (err) {
                console.log("Error while checking quantity:", err);
                return res.status(500).json({ error: "Internal server error" });
            } else if (!quantityData || quantityData.length === 0) {
                return res.status(400).json({ error: "No quantity data found for the provided NcTaskId" });
            } else {
                const { QtyToNest, QtyNested } = quantityData[0];

                if (QtyToNest === QtyNested) {
                    return res.status(400).json({ message: "Quantity Tasked has already been programmed" });
                } else {
                    // Get the running number
                    const getRunningNoQuery = `SELECT Running_No FROM magod_setup.magod_runningno WHERE SrlType='NcProgramNo'`;
                    misQueryMod(getRunningNoQuery, (runningNoErr, runningNoData) => {
                        if (runningNoErr) {
                            console.log("Error while fetching running number:", runningNoErr);
                            return res.status(500).json({ error: "Internal server error" });
                        } else if (!runningNoData || runningNoData.length === 0) {
                            return res.status(400).json({ error: "No running number data found" });
                        } else {
                            const nextNCProgramNo = parseInt(runningNoData[0]?.Running_No) + 1;
                            // console.log("Next NC Program No:", nextNCProgramNo);

                            // Fetch existing NC program data for the provided NcTaskId
                            const existingNCProgramQuery = `SELECT * FROM magodmis.nc_task_list WHERE NcTaskId='${NcTaskId}'`;
                            misQueryMod(existingNCProgramQuery, (existingErr, existingData) => {
                                if (existingErr) {
                                    console.log("Error while fetching existing NC program data:", existingErr);
                                    return res.status(500).json({ error: "Internal server error" });
                                } else if (!existingData || existingData.length === 0) {
                                    return res.status(400).json({ error: "No existing NC program data found" });
                                } else {
                                    // console.log("Existing NC program data:", existingData[0]);

                                    // Fetch task parts list data for the provided NcTaskId
                                    const taskPartsListQuery = `SELECT * FROM magodmis.task_partslist WHERE NcTaskId='${NcTaskId}'`;
                                    misQueryMod(taskPartsListQuery, (taskPartsErr, taskPartsData) => {
                                        if (taskPartsErr) {
                                            console.log("Error while fetching task parts list data:", taskPartsErr);
                                            return res.status(500).json({ error: "Internal server error" });
                                        } else if (!taskPartsData || taskPartsData.length === 0) {
                                            return res.status(400).json({ message: "No task parts data found for the provided NcTaskId" });
                                        } else {

                                            // Insert into ncprograms table
                                            const insertNCProgramQuery = `INSERT INTO magodmis.ncprograms(
                                                NcTaskId, TaskNo, NCProgramNo, Qty, TotalParts, Machine, Mprocess, Operation, Mtrl_code, Cust_code, CustMtrl, DeliveryDate, pstatus, NoOfDwgs, HasBOM, Shape
                                            ) VALUES(
                                                '${NcTaskId}', '${TaskNo}', '${nextNCProgramNo}', '${taskPartsData[0].QtyToNest}', '${existingData[0].TotalParts}', '${req.body.selectedMachine}', '${existingData[0].MProcess}', '${existingData[0].Operation}', '${existingData[0].Mtrl_Code}', '${existingData[0].Cust_Code}', '${existingData[0].CustMtrl}', '${new Date(existingData[0].DeliveryDate).toISOString().slice(0, 19).replace('T', ' ')}', 'Created', '${existingData[0].NoOfDwgs}', '${taskPartsData[0].HasBOM}', 'Units'
                                            )`;
                                            // console.log("insertNCProgramQuery is", insertNCProgramQuery);

                                            misQueryMod(insertNCProgramQuery, (ncProgramErr, ncProgramResult) => {
                                                if (ncProgramErr) {
                                                    console.log("Error while inserting into ncprograms:", ncProgramErr);
                                                    return res.status(500).json({ error: "Internal server error" });
                                                } else {
                                                    // console.log("NC Program inserted successfully:", ncProgramResult);
                                                    const lastInsertId = ncProgramResult.insertId;

                                                    console.log("Task  data:", taskPartsData[0]);


                                                    console.log("Task taskPartsData[0].QtyToNest data:", taskPartsData[0].QtyNested);


                                                    // Insert into ncprogram_partslist
                                                    const insertPartsListQuery = `INSERT INTO magodmis.ncprogram_partslist(
                                                        NcProgramNo, TaskNo, DwgName, PartID, QtyNested, Sheets, TotQtyNested, Task_Part_Id, NCId, HasBOM
                                                    ) VALUES(
                                                        '${nextNCProgramNo}', '${TaskNo}', '${req.body.NCprogramForm[0].AssyName}', '1', '1', '${taskPartsData[0].QtyToNest}', '${taskPartsData[0].QtyToNest}', '${taskPartsData[0].Task_Part_ID}', '${lastInsertId}', '${taskPartsData[0].HasBOM}'
                                                    )`;


                                                    misQueryMod(insertPartsListQuery, (partsListErr, partsListResult) => {
                                                        if (partsListErr) {
                                                            console.log("Error while inserting into ncprogram_partslist:", partsListErr);
                                                            return res.status(500).json({ error: "Internal server error" });
                                                        } else {
                                                            // console.log("NC Program parts list inserted successfully:", partsListResult);

                                                            // Update magodmis.task_partslist
                                                            const updateTaskPartsListQuery = `UPDATE magodmis.task_partslist t, 
                                                                (SELECT Sum(n.TotQtyNested-n.QtyRejected) as TotalQtyNested, n.Task_Part_Id 
                                                                 FROM magodmis.ncprogram_partslist n, magodmis.ncprograms n1 
                                                                 WHERE n.NCId=n1.NCId AND n1.NcTaskId='${NcTaskId}' 
                                                                 GROUP BY n.Task_Part_Id) as A 
                                                                 SET t.QtyNested=A.TotalQtyNested 
                                                                 WHERE A.Task_Part_Id=t.Task_Part_ID AND t.NcTaskId='${NcTaskId}'`;

                                                            misQueryMod(updateTaskPartsListQuery, (updateErr, updateResult) => {
                                                                if (updateErr) {
                                                                    console.log("Error while updating task parts list:", updateErr);
                                                                    return res.status(500).json({ error: "Internal server error" });
                                                                } else {
                                                                    // console.log("Task parts list updated successfully:", updateResult);

                                                                    // Update magod_setup.magod_runningno
                                                                    const updateRunningNoQuery = `UPDATE magod_setup.magod_runningno 
                                                                        SET Running_No=${nextNCProgramNo} 
                                                                        WHERE SrlType='NcProgramNo'`;

                                                                    misQueryMod(updateRunningNoQuery, (updateRunningErr, updateRunningResult) => {
                                                                        if (updateRunningErr) {
                                                                            console.log("Error while updating running number:", updateRunningErr);
                                                                            return res.status(500).json({ error: "Internal server error" });
                                                                        } else {
                                                                            // console.log("Running number updated successfully:", updateRunningResult);
                                                                            res.status(200).json({ message: "NC Program added successfully" });
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});





//getNCProgram Data
NCprogramRoter.post(`/getPrograms`, async (req, res, next) => {
    // console.log(req.body);
    const { NcTaskId } = req.body.NCprogramForm[0] || []; // Assuming NcTaskId is sent in the request body
    let query = `select * from magodmis.ncprograms where  NcTaskId='${NcTaskId}'`;
    try {
        misQueryMod(query, (err, data) => {
            if (err) {
                console.log("err", err);
            } else {
                res.send(data);
                //   console.log("data",data)
            }
        });
    } catch (error) {
        next(error);
    }
});


//MTRL ISSUE
NCprogramRoter.post(`/sendMTrlIssue`, async (req, res, next) => {
    let query = `UPDATE magodmis.ncprograms SET PStatus='Mtrl Issue' WHERE NCProgramNo='${req.body.selectedNCprogram.NCProgramNo}'`;
    try {
        misQueryMod(query, (err, data) => {
            if (err) {
                console.log("Error:", err);
                return res.status(500).json({ error: "Internal server error" });
            } else {
                return res.status(200).json({ message: "Success" });
            }
        });
    } catch (error) {
        next(error);
    }
});


//Button DELETE
NCprogramRoter.post(`/DeleteNCProgram`, async (req, res, next) => {
    let query = `DELETE FROM magodmis.ncprograms WHERE NCProgramNo='${req.body.selectedNCprogram.NCProgramNo}'`;
    try {
        misQueryMod(query, (err, data) => {
            if (err) {
                console.log("err", err);
                return res.status(500).json({ error: "Internal server error" });
            } else {
                return res.status(200).json({ message: "Success" });
                //   console.log("data",data)
            }
        });
    } catch (error) {
        next(error);
    }
});


///Save Button
NCprogramRoter.post(`/ButtonSave`, async (req, res, next) => {
    let query = `Update magodmis.nc_task_list set Machine='${req.body.selectedMachine}' WHERE NcTaskId='${req.body.NCprogramForm[0].NcTaskId}'`;
    try {
        misQueryMod(query, (err, data) => {
            if (err) {
                console.log("err", err);
            } else {
                res.send(data);
                //   console.log("data",data)
            }
        });
    } catch (error) {
        next(error);
    }
});

//getNCProram Parts Data
NCprogramRoter.post(`/NCProgramPartsData`, async (req, res, next) => {
    // Log the request body to verify the incoming data

    // Check if NCprogramForm is present and has at least one element
    if (!req.body.NCprogramForm || req.body.NCprogramForm.length === 0) {
        return res.status(400).send("Invalid request body format");
    }

    const NcTaskId = req.body.NCprogramForm[0].NcTaskId;


  
    let queryCheckBOM = `SELECT t.HasBOM FROM magodmis.task_partslist t WHERE t.NcTaskId = '${NcTaskId}'`;
  
  
    try {
      misQueryMod(queryCheckBOM, (err, bomData) => {
        if (err) {
          console.log("Error checking BOM:", err);
          return next(err);
        }
  
        if (bomData && bomData.length > 0 && bomData[0].HasBOM === 1) {
          // Query when HasBOM is 1 (true)
          let query = `SELECT c2.PartId, c1.Quantity as QtyPerAssy, c2.Id As CustBOM_Id, t.Task_Part_ID, t.QtyNested * c1.Quantity as QtyRequired 
                       FROM magodmis.task_partslist t, magodmis.orderscheduledetails o, magodmis.cust_assy_data c,
                            magodmis.cust_assy_bom_list c1, magodmis.cust_bomlist c2 
                       WHERE t.NcTaskId='${NcTaskId}' AND t.HasBOM AND t.SchDetailsId=o.SchDetailsID
                       AND c.MagodCode = o.Dwg_Code AND c1.Cust_AssyId=c.Id AND c1.Cust_BOM_ListId=c2.Id`;
  
  
          misQueryMod(query, (err, data) => {
            if (err) {
              console.log("Error executing query:", err);
              return next(err);
            }

  
            // Extracting CustBOM_Id from the result
            const custBOMIds = data.map(entry => entry.CustBOM_Id).join("','");

        
  
            // Additional query to calculate quantity available
            let additionalQuery = `SELECT SUM(CAST(m.QtyAccepted - m.QtyIssued AS SIGNED)) AS QtyAvailable 
                                   FROM magodmis.mtrl_part_receipt_details m 
                                   WHERE m.CustBOM_Id IN ('${custBOMIds}')`;
  
  
            misQueryMod(additionalQuery, (err, additionalData) => {
              if (err) {
                console.log("Error executing additional query:", err);
                return next(err);
              }
  

              // Combining data from both queries
              const responseData = {
                partsData: data,
                availableQty: additionalData[0]?.QtyAvailable || 0
              };
              res.send(responseData);
            });
          });
        } else {
          // Handle case when HasBOM is not 1 (false)
          let query = `SELECT o.DwgName as PartID, 1 as QtyPerAssy, c.Id as CustBOM_Id, t.Task_Part_ID, t.QtyToNest as QtyRequired 
                       FROM magodmis.task_partslist t, magodmis.orderscheduledetails o, magodmis.cust_bomlist c 
                       WHERE o.SchDetailsID = t.SchDetailsId AND t.NcTaskId = '${NcTaskId}' AND c.MagodPartId = o.Dwg_Code`;
  
  
          misQueryMod(query, (err, data) => {
            if (err) {
              console.log("Error executing query:", err);
              return next(err);
            }
  
  
            // Extracting CustBOM_Id from the result
            const custBOMIds = data.map(entry => entry.CustBOM_Id).join("','");
  
            // Additional query to calculate quantity available
            let additionalQuery = `SELECT SUM(CAST(m.QtyAccepted - m.QtyIssued AS SIGNED)) AS QtyAvailable 
                                   FROM magodmis.mtrl_part_receipt_details m 
                                   WHERE m.CustBOM_Id IN ('${custBOMIds}')`;
  
         
  
            misQueryMod(additionalQuery, (err, additionalData) => {
              if (err) {
                console.log("Error executing additional query:", err);
                return next(err);
              }
  
  
              // Combining data from both queries
              const responseData = {
                partsData: data,
                availableQty: additionalData[0]?.QtyAvailable || 0
              };
              res.send(responseData);
            });
          });
        }
      });
    } catch (error) {
      console.log("Caught error:", error);
      next(error);
    }
  });
  
  
  



module.exports = NCprogramRoter;
