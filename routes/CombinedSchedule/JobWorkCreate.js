const jobWork = require("express").Router();
const { error } = require("winston");
const { misQuery, setupQuery, misQueryMod, mchQueryMod, productionQueryMod, mchQueryMod1 } = require('../../helpers/dbconn');
const { logger } = require('../../helpers/logger')
var bodyParser = require('body-parser')
const moment = require('moment')

// create application/json parser
var jsonParser = bodyParser.json();

jobWork.post('/allcustomersData', jsonParser, async (req, res, next) => {
  try {

    mchQueryMod(`Select * from magodmis.cust_data order by Cust_name asc`, (err, data) => {
      if (err) logger.error(err);
      //console.log(data)
      res.send(data)
    })
  } catch (error) {
    next(error)
  }
});


//get Sales Contact List
jobWork.get('/getSalesContactList', jsonParser, async (req, res, next) => {
  try {

    mchQueryMod(`SELECT * FROM magod_sales.sales_execlist;`, (err, data) => {
      if (err) logger.error(err);
      //console.log(data)
      res.send(data)
    })
  } catch (error) {
    next(error)
  }
});

jobWork.post('/getRightTableData', jsonParser, async (req, res, next) => {
  try {
    mchQueryMod(`SELECT o.* FROM magodmis.orderschedule o WHERE  o.Schedule_Status = 'Tasked' AND o.ScheduleType NOT LIKE 'Combined' AND o.Cust_code = '${req.body.custCode}'`, (err, data) => {
      if (err) logger.error(err);
      //console.log(data)
      res.send(data)
    })
  } catch (error) {
    next(error)
  }
});

//Prepare Schedule Button Click
jobWork.post('/prepareSchedule', jsonParser, async (req, res, next) => {
  try {
    mchQueryMod(`SELECT 
        o.SchDetailsID, o.OrderDetailID, o.ScheduleId, o.Order_No, 
        o.ScheduleNo, o.OrderScheduleNo, o.Cust_Code, o.Dwg_Code, o.DwgName, 
        o.Mtrl_Code, o.Mtrl, o.Material, o.MProcess, o.Mtrl_Source, o.InspLevel, 
        o.QtyScheduled, o.Operation
        FROM magodmis.orderscheduledetails o
        WHERE scheduleid = '${req.body.scheduleid}';
        `, (err, data) => {
      if (err) logger.error(err);
      //console.log(data)
      res.send(data)
    })
  } catch (error) {
    next(error)
  }
});



// Create Schedule
jobWork.post('/createSchedule', jsonParser, async (req, res, next) => {
  try {
    if (!req.body) {
      return res.status(400).json({ success: false, message: 'Request body is missing' });
    }

    const cmbSchId = await insertIntoCombinedSchedule(req.body.custCode);

    const rowselectleft = req.body.rowselectleft;
    const insertPromises = rowselectleft.map((schedule, index) => {
      const { ScheduleId, OrdSchNo } = schedule;
      const rowCont = index + 1;

      return insertIntoCombinedScheduleDetails(cmbSchId, ScheduleId, OrdSchNo, rowCont);
    });

    await Promise.all(insertPromises);

    const rowCont = await getCountOfCombinedScheduleDetails(cmbSchId);
    console.log("Count of combined_schedule_details:", rowCont);

    // Update magodmis.orderschedule and magodmis.nc_task_list
    const updatePromises = rowselectleft.map((schedule) => {
      const { ScheduleId } = schedule;
      const scheduleStatus = 'Comb/' + cmbSchId;

      // Pass req to the function here
      return updateOrderscheduleAndNCTaskList(scheduleStatus, ScheduleId, cmbSchId, req);
    });

    const combinedScheduleNos = await Promise.all(updatePromises);

    const combinedScheduleNo = combinedScheduleNos[0]; // Assuming combinedScheduleNos is an array
const insertResult = await mchQueryMod1(`
  INSERT INTO magodmis.orderschedule (Order_no, ScheduleNo, Cust_Code, ScheduleDate, schTgtDate, Delivery_date, SalesContact, Dealing_engineer, PO, ScheduleType, ordschno, Type)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Combined', ?, 'Profile')`, [
    combinedScheduleNo, '01', req.body.custCode, req.body.ScheduleDate,
    req.body.Date, req.body.Date, req.body.selectedSalesContact,
    req.body.selectedSalesContact, 'Combined', combinedScheduleNo + ' 01'
  ]);

const lastInsertId = insertResult.insertId;
console.log("lastInsertId", lastInsertId);

 // Execute additional update query
 await mchQueryMod1(`
 UPDATE magodmis.combined_schedule c
 SET c.ScheduleID = ?
 WHERE c.CmbSchID = ?`, [lastInsertId, cmbSchId]);

    res.status(200).json({
      success: true,
      message: 'API executed successfully',
      cmbSchId,
      rowCont,
      combinedScheduleNos
    });

  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// Function to insert into combined_schedule and return cmbSchId
const insertIntoCombinedSchedule = async (custCode) => {
  const result = await mchQueryMod1('INSERT INTO magodmis.combined_schedule (Cust_code) VALUES (?)', [custCode]);
  return result.insertId;
};

// Function to insert into combined_schedule_details
const insertIntoCombinedScheduleDetails = async (cmbSchId, scheduleId, ordSchNo, cssrl) => {
  await mchQueryMod1(`
    INSERT INTO magodmis.combined_schedule_details (cmbSchId, ScheduleId, OrderSchNo, CSSrl)
    VALUES (?, ?, ?, ?)`, [cmbSchId, scheduleId, ordSchNo, cssrl]);
};

// Function to get count of combined_schedule_details
const getCountOfCombinedScheduleDetails = async (cmbSchId) => {
  const result = await mchQueryMod1(`SELECT COUNT(*) AS rowCont FROM magodmis.combined_schedule_details WHERE cmbSchId = ?`, [cmbSchId]);
  return result[0].rowCont || 0;
};


// Function to update magodmis.orderschedule and magodmis.nc_task_list
const updateOrderscheduleAndNCTaskList = async (scheduleStatus, scheduleId, cmbSchId, req) => {
  try {

    // Get Running_No from magod_setup.magod_runningno
    const runningNoResult = await mchQueryMod1(`
      SELECT Running_No FROM magod_setup.magod_runningno WHERE SrlType='CombinedSchedule_JW'`);
    
    let runningNo = parseInt(runningNoResult[0].Running_No, 10);
    console.log(runningNo);

    // Increment Running_No by 1
    const updatedRunningNo = runningNo + 1;
    

    // Generate the current date in yyyy-mm-dd format
    const today = new Date().toISOString().split('T')[0];

    // Update magod_setup.magod_runningno with the updated Running_No
    await mchQueryMod1(`
      UPDATE magod_setup.magod_runningno
      SET Running_No = ?,Running_EffectiveDate=?
      WHERE SrlType='CombinedSchedule_JW'`, [updatedRunningNo,today]);


    // Concatenate '99' with the updated Running_No
    const combinedScheduleNo = '99' + updatedRunningNo;

    // Update magodmis.nc_task_list
    await mchQueryMod1(`
      UPDATE magodmis.nc_task_list o1
      SET o1.TStatus = 'Combined'
      WHERE o1.scheduleId = ?`, [scheduleId]);

    // Update magodmis.orderschedule
    await mchQueryMod1(`
      UPDATE magodmis.orderschedule o
      SET o.Schedule_Status = ?
      WHERE o.ScheduleID = ?`, ['Comb/' + combinedScheduleNo, scheduleId]);

    return combinedScheduleNo;
  } catch (error) {
    throw error;
  }
};




//AFTER CREATE COMBINED SCHEDULE
jobWork.post('/afterCombineSchedule', jsonParser, async (req, res, next) => {
  try {
    mchQueryMod(`SELECT * FROM magodmis.orderschedule  WHERE Order_No= '${req.body.combinedScheduleNo}'`, (err, data) => {
      if (err) logger.error(err);
      //console.log(data)
      res.send(data)
    })
  } catch (error) {
    next(error)
  }
});




module.exports = jobWork;