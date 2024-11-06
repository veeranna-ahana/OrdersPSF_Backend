/** @format */

const ScheduleListRouter = require("express").Router();
var createError = require("http-errors");

const {
	misQueryMod,
	setupQuery,
	misQuery,
	mchQueryMod,
} = require("../../helpers/dbconn");

ScheduleListRouter.post(`/getScheduleListData`, async (req, res, next) => {
	// console.log("req.body /getScheduleListData is",req.body);
	let query = `SELECT * FROM magodmis.orderschedule WHERE Order_No='${req.body.Order_No}'`;

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

//DWG table data
ScheduleListRouter.post(`/getDwgTableData`, async (req, res, next) => {
	// console.log("req.body /getDwgTableData is",req.body);
	let query = `SELECT * FROM magodmis.orderscheduledetails o WHERE o.ScheduleId='${req.body.ScheduleId}'`;

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

//Task and  Material List
ScheduleListRouter.post(`/getTaskandMterial`, async (req, res, next) => {
	// console.log("req.body /getTaskandMterial is",req.body);
	let query = `SELECT *FROM magodmis.ncprograms WHERE TaskNo='${req.body.TaskNo}'`;

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

///get Form Values in Order Schedule Details
ScheduleListRouter.post(`/getFormDeatils`, async (req, res, next) => {
	// console.log("req.body /getTaskandMterial is",req.body);
	let query = `SELECT o.*, c.Cust_name  FROM magodmis.orderschedule AS o JOIN magodmis.cust_data AS c  ON o.Cust_Code = c.Cust_Code WHERE o.Cust_Code = '${req.body.Cust_Code}' AND o.ScheduleId = '${req.body.ScheduleId}'`;

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

//Button Save
ScheduleListRouter.post(`/save`, async (req, res, next) => {
	let query = `UPDATE magodmis.orderscheduledetails o,
    (SELECT  CASE
    WHEN o.QtyScheduled=0  THEN 'Cancelled'
    WHEN o.QtyDelivered>=o.QtyScheduled THEN 'Dispatched'
    WHEN o.QtyPacked>=o.QtyScheduled THEN 'Ready'
    WHEN o.QtyCleared>=o.QtyScheduled THEN IF(o1.ScheduleType='Combined' , 'Closed' , 'Inspected')
    WHEN o.QtyProduced-o.QtyRejected>=o.QtyScheduled THEN 'Completed'
    WHEN o.QtyProgrammed>=o.QtyScheduled THEN 'Programmed'
    WHEN o.QtyProgrammed>0 THEN 'Production'
    WHEN o.QtyScheduled> 0 THEN 'Tasked'                 
    ELSE 'Created' END AS STATUS, o.SchDetailsID
    FROM magodmis.orderscheduledetails o,magodmis.orderschedule o1
    WHERE o1.ScheduleId=o.ScheduleId 
    AND o1.ScheduleId='${req.body.scheduleDetailsRow.ScheduleId}' ) A
    SET o.Schedule_Status=a.Status
    WHERE a.SchDetailsID= o.SchDetailsID`;

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

//Onclick of Suspend
ScheduleListRouter.post(`/suspendButton`, async (req, res, next) => {
	let query = `SELECT * FROM magodmis.orderschedule WHERE ScheduleId='${req.body.scheduleDetailsRow.ScheduleId}';`;

	try {
		misQueryMod(query, (err, data) => {
			if (err) {
				console.log("err", err);
				return res.status(500).json({ error: "Internal Server Error" });
			} else {
				if (data && data.length > 0) {
					const schedule = data[0]; // Assuming only one schedule is returned

					if (schedule.Suspend === 1) {
						return res
							.status(400)
							.json({
								message:
									"Clear Order Suspension of the order before trying to clear it for schedule",
							});
					} else if (schedule.Schedule_Status === "Suspended") {
						const updateQuery = `UPDATE magodmis.orderscheduledetails o,
                            (SELECT  CASE
                                WHEN o.QtyScheduled=0  THEN 'Cancelled'
                                WHEN o.QtyDelivered>=o.QtyScheduled THEN 'Dispatched'
                                WHEN o.QtyPacked>=o.QtyScheduled THEN 'Ready'
                                WHEN o.QtyCleared>=o.QtyScheduled THEN IF(o1.ScheduleType='Combined', 'Closed', 'Inspected')
                                WHEN o.QtyProduced-o.QtyRejected>=o.QtyScheduled THEN 'Completed'
                                WHEN o.QtyProgrammed>=o.QtyScheduled THEN 'Programmed'
                                WHEN o.QtyProgrammed>0 THEN 'Production'
                                WHEN o.QtyScheduled> 0 THEN 'Tasked'                 
                                ELSE 'Created' END AS STATUS, o.SchDetailsID
                                FROM magodmis.orderscheduledetails o, magodmis.orderschedule o1
                                WHERE o1.ScheduleId=o.ScheduleId 
                                AND o1.ScheduleId='${req.body.scheduleDetailsRow.ScheduleId}') A
                            SET o.Schedule_Status = a.Status
                            WHERE a.SchDetailsID = o.SchDetailsID;`;

						misQueryMod(updateQuery, (err, result) => {
							if (err) {
								console.log("err", err);
								return res.status(500).json({ error: "Internal Server Error" });
							} else {
								// Update suspension status of tasks and programs
								const suspendUpdateQuery = `UPDATE magodmis.nc_task_list n, magodmis.ncprograms n1
                                    SET n.Suspend = 0, n1.Suspend = 0
                                    WHERE n.ScheduleID = 0 AND n1.NcTaskId = n.NcTaskId;`;

								// Execute the update query
								misQueryMod(suspendUpdateQuery, (err, result) => {
									if (err) {
										console.log("err", err);
										return res
											.status(500)
											.json({ error: "Internal Server Error" });
									} else {
										return res
											.status(200)
											.json({ message: "Suspend status updated successfully" });
									}
								});
							}
						});
					} else {
						// Update the Schedule_Status of orderschedule table to 'Suspended'
						const updateScheduleQuery = `UPDATE magodmis.orderschedule
                            SET Schedule_Status = 'Suspended'
                            WHERE ScheduleId = '${req.body.scheduleDetailsRow.ScheduleId}';`;

						misQueryMod(updateScheduleQuery, (err, result) => {
							if (err) {
								console.log("err", err);
								return res.status(500).json({ error: "Internal Server Error" });
							} else {
								// Update suspension status of tasks and programs
								const suspendUpdateQuery = `UPDATE magodmis.nc_task_list n, magodmis.ncprograms n1
                                    SET n.Suspend = 1, n1.Suspend = 1
                                    WHERE n.ScheduleID = '${req.body.scheduleDetailsRow.ScheduleId}' AND n1.NcTaskId = n.NcTaskId;`;

								misQueryMod(suspendUpdateQuery, (err, result) => {
									if (err) {
										console.log("err", err);
										return res
											.status(500)
											.json({ error: "Internal Server Error" });
									} else {
										return res
											.status(200)
											.json({
												message: "Schedule status updated successfully",
											});
									}
								});
							}
						});
					}
				} else {
					return res
						.status(404)
						.json({ error: "No schedule found for the given ScheduleId" });
				}
			}
		});
	} catch (error) {
		return res.status(500).json({ error: "Internal Server Error" });
	}
});

//Button ShortClose
ScheduleListRouter.post(`/shortClose`, async (req, res, next) => {
	console.log("scheduleDetailsRow is", req.body.scheduleDetailsRow);

	let query = `SELECT * FROM magodmis.orderscheduledetails WHERE SchDetailsID='${req.body.scheduleDetailsRow.SchDetailsID}';`;

	try {
		misQueryMod(query, (err, data) => {
			if (err) {
				console.log("err", err);
				next(err); // Pass the error to the error handling middleware
			} else {
				// Check if data meets the condition QtyProduced === QtyDelivered + QtyRejected
				const isValid = data.every(
					(detail) =>
						detail.QtyProduced === detail.QtyDelivered + detail.QtyRejected
				);
				console.log("isValid", isValid);

				if (isValid) {
					try {
						// Execute update queries
						updateOrderDetails(req.body.scheduleDetailsRow, (err, result) => {
							if (err) {
								console.log("err", err);
								next(err); // Pass the error to the error handling middleware
							} else {
								// Execute the next update query
								updateOrderSchedule(
									req.body.scheduleDetailsRow,
									(err, result) => {
										if (err) {
											console.log("err", err);
											next(err); // Pass the error to the error handling middleware
										} else {
											// Execute the final update query
											updateNCTaskList(
												req.body.scheduleDetailsRow,
												(err, result) => {
													if (err) {
														console.log("err", err);
														next(err); // Pass the error to the error handling middleware
													} else {
														res.send("Success"); // Send response
													}
												}
											);
										}
									}
								);
							}
						});
					} catch (error) {
						next(error); // Pass any uncaught errors to the error handling middleware
					}
				} else {
					// Send response indicating the condition is not met
					res.send(
						"Either all quantity produced must be dispatched or balance quantity must be recorded as 'Rejected'"
					);
				}
			}
		});
	} catch (error) {
		next(error); // Pass any uncaught errors to the error handling middleware
	}
});

// Function to update order details
function updateOrderDetails(scheduleDetailsRow, callback) {
	const query = `
        UPDATE magodmis.order_details 
        SET QtyScheduled = QtyScheduled - ${scheduleDetailsRow.QtyScheduled} 
        WHERE OrderDetailID = ${scheduleDetailsRow.OrderDetailID};
    `;
	misQueryMod(query, callback);
}

// Function to update order schedule
function updateOrderSchedule(scheduleDetailsRow, callback) {
	const query = `
        UPDATE orderschedule 
        SET Schedule_Status = 'ShortClosed' 
        WHERE ScheduleId = ${scheduleDetailsRow.ScheduleId};
    `;
	misQueryMod(query, callback);
}

// Function to update NC task list
function updateNCTaskList(scheduleDetailsRow, callback) {
	const query = `
        UPDATE magodmis.nc_task_list 
        SET TStatus = 'ShortClosed' 
        WHERE ScheduleID = ${scheduleDetailsRow.ScheduleId};
    `;
	misQueryMod(query, callback);
}

//Onclick of Button Task
ScheduleListRouter.post(`/taskOnclick`, async (req, res, next) => {
	// console.log("req.body /getTaskandMterial is",req.body);
	let query = ``;

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

//Onclick of Button Cancel
ScheduleListRouter.post(`/onClickCancel`, async (req, res, next) => {
	try {
		let query = `SELECT * FROM magodmis.orderscheduledetails WHERE SchDetailsID='${req.body.scheduleDetailsRow.SchDetailsID}';`;

		misQueryMod(query, (err, data) => {
			if (err) {
				console.log("err", err);
				return res.status(500).json({ error: "Internal Server Error" });
			} else {
				if (data && data.length > 0) {
					const resultQuery = data[0]; // Assuming only one row is returned

					if (resultQuery.QtyProgrammed > 0) {
						// Execute the update queries
						const updateQuery1 = `UPDATE magodmis.orderscheduledetails o SET o.QtyScheduled=0 WHERE o.SchDetailsID=${req.body.scheduleDetailsRow.SchDetailsID};`;
						const updateQuery2 = `UPDATE order_details o SET o.QtyScheduled=o.QtyScheduled-${resultQuery.QtyScheduled} WHERE o.OrderDetailID=${resultQuery.OrderDetailID};`;
						const updateQuery3 = `UPDATE orderschedule SET Schedule_Status='Cancelled' WHERE ScheduleId=${req.body.scheduleDetailsRow.ScheduleId};`;
						const deleteQuery = `DELETE magodmis.t, magodmis.n FROM magodmis.nc_task_list AS n, magodmis.task_partslist AS t WHERE n.ScheduleID='${req.body.scheduleDetailsRow.ScheduleId}' AND t.NcTaskId=n.NcTaskId;`;

						misQueryMod(updateQuery1, (err, result1) => {
							if (err) {
								console.log("err", err);
								return res.status(500).json({ error: "Internal Server Error" });
							} else {
								misQueryMod(updateQuery2, (err, result2) => {
									if (err) {
										console.log("err", err);
										return res
											.status(500)
											.json({ error: "Internal Server Error" });
									} else {
										misQueryMod(updateQuery3, (err, result3) => {
											if (err) {
												console.log("err", err);
												return res
													.status(500)
													.json({ error: "Internal Server Error" });
											} else {
												misQueryMod(deleteQuery, (err, result4) => {
													if (err) {
														console.log("err", err);
														return res
															.status(500)
															.json({ error: "Internal Server Error" });
													} else {
														return res
															.status(200)
															.send("Schedules cancelled successfully");
													}
												});
											}
										});
									}
								});
							}
						});
					} else {
						return res
							.status(400)
							.send(
								"Cannot Cancel Schedules Once Programmed\nRecall all programs, materials, and cancel all programs before cancelling the schedule.\nYou can also ShortClose the schedule by invoicing all parts manufactured."
							);
					}
				} else {
					return res
						.status(404)
						.send("No data found for the given SchDetailsID");
				}
			}
		});
	} catch (error) {
		next(error);
	}
});

module.exports = ScheduleListRouter;
