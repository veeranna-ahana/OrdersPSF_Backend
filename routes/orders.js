/** @format */

const ordersRouter = require("express").Router();
const fs = require("fs");
const moment = require("moment");

const {
	misQueryMod,
	setupQuery,
	setupQueryMod,
	qtnQueryMod,
	misQuery,
	mchQueryMod,
} = require("../helpers/dbconn");
const { createFolder } = require("../helpers/folderhelper");
const { logger } = require("../helpers/logger");

ordersRouter.post(`/savecreateorder`, async (req, res, next) => {
	////console.log("Creating new order - I");
	try {
		////console.log("Creating new order");
		let zzz = new Date();
		const orddate =
			zzz.getFullYear() +
			"-" +
			(zzz.getMonth() + 1).toString().padStart(2, "0") +
			"-" +
			zzz.getDate() +
			" " +
			zzz.getHours() +
			":" +
			zzz.getMinutes() +
			":" +
			zzz.getSeconds();
		const ordertype = req.body.ordertype;
		console.log("ordertyp...123e", ordertype);
		const type = req.body.type;
		console.log("type...123", type);

		const purchaseorder = req.body.purchaseorder;
		const qtnno = req.body.qtnno;

		let deliverydate = null;

		if (req.body.deliverydate) {
			deliverydate = moment(req.body.deliverydate).format("YYYY-MM-DD");
		}
		// const deliverydate = moment(req.body.deliverydate).format("YYYY-MM-DD");
		// const deliverydate = req.body.deliverydate ? moment(req.body.deliverydate).format("YYYY-MM-DD") : null;

		const paymentterms = req.body.paymentterms;
		const salesContact = req.body.salesContact;
		const ccode = req.body.CustCode;
		const CustomerContact = req.body.CustomerContact;
		const receivedby = req.body.receivedby;
		const RecordedBy = req.body.RecordedBy;
		const DealingEngineer = req.body.DealingEngineer;
		const DeliveryMode = req.body.DeliveryMode;
		const billingAddress = req.body.billingAddress;
		const SpecialInstructions = req.body.SpecialInstructions;
		const BillingState = req.body.BillingState;
		const MagodDelivery = req.body.MagodDelivery;
		const shippingAddress = req.body.shippingAddress;
		const GSTTaxState = req.body.GSTTaxState;
		const Transportcharges = req.body.Transportcharges;
		const billingstateId = "00";
		const DelStateId = "00";

		////console.log("Before Order");
		let runningno = 0;

		// Retrieve the running number for orders
		await setupQueryMod(
			`SELECT * FROM magod_setup.magod_runningno WHERE SrlType='Order' AND UnitName='Jigani' ORDER BY Id DESC LIMIT 1`,
			async (err, runningNoResult) => {
				if (err) {
					////console.log(err);
					return;
				}
				////console.log(runningNoResult);
				runningno = runningNoResult[0]["Running_No"];
				voucherLength = runningNoResult[0]["Length"];
				////console.log(runningno);
				// Generate the order number
				let ordno = `${zzz.getFullYear().toString().substr(-2)}${(
					parseInt(runningno) + 1
				)
					.toString()
					.padStart(voucherLength, "0")}`;
				////console.log(ordno);
				// Create folder on the server
				await createFolder("Order", ordno, "");

				////console.log("After Qtn");

				// Insert the order details into the database
				await misQueryMod(
					`INSERT INTO magodmis.order_list(order_no, order_date, cust_code, contact_name, Type, delivery_date, purchase_order,
            order_received_by, salescontact, recordedby, dealing_engineer, order_status, special_instructions, payment,
            ordervalue, materialvalue, billing_address, BillingStateId, delivery, del_place, DelStateId, del_mode,
            tptcharges, order_type, register, qtnno) VALUES ('${ordno}', '${orddate}', '${ccode}', '${CustomerContact}', '${ordertype}', '${deliverydate}', '${purchaseorder}',
            '${receivedby}', '${salesContact}', '${RecordedBy}', '${DealingEngineer}', 'Created', '${
						SpecialInstructions || ""
					}', '${paymentterms}',
            '${0}', '${0}', '${billingAddress}', '${billingstateId}', ${MagodDelivery}, '${shippingAddress}', '${DelStateId}', '${DeliveryMode}',
            '${Transportcharges}', '${type}', '${0}', '${qtnno}')`,
					(err, insertResult) => {
						if (err) logger.error(err);
						////console.log("Inserted order data:", insertResult);

						//   if (insertResult.affectedRows === 1) {
						// Update the running number for orders
						setupQuery(
							`UPDATE magod_setup.magod_runningno SET Running_No = Running_No + 1 WHERE SrlType='Order' AND Id = ${runningNoResult[0]["Id"]}`,
							(err, updateResult) => {}
						);
						// console.log("Updated running number.");
						// console.log("Saved Successfully.", ordno);
						res.send({ message: "Saved Successfully", orderno: ordno });
					}
				);
				//  }
			}
		);
		// res.send({ orderno: ordno });
	} catch (error) {
		next(error);
	}
});

ordersRouter.post(`/getqtnnossentdata`, async (req, res, next) => {
	try {
		const ordtype = req.body.ordtype;
		qtnQueryMod(
			`SELECT QtnNo FROM magodqtn.qtnlist WHERE QtnStatus = 'Qtn Sent' And QtnFormat = '${ordtype}' order by QtnID desc`,
			async (err, data) => {
				if (err) logger.error(err);
				res.send(data);
				////console.log("QTN DROPDOWN DATA", data);
			}
		);
	} catch (error) {
		next(error);
	}
});

ordersRouter.post(`/getorderdata`, async (req, res, next) => {
	try {
		////console.log("Getting order data");
		const orderno = req.body.ordno;
		const ordtype = req.body.ordtype;
		////console.log(orderno, ordtype);
		misQueryMod(
			`SELECT ord.*,cust.Cust_name FROM magodmis.order_list ord 
        left outer join magodmis.cust_data cust on cust.Cust_code = ord.Cust_Code
        WHERE order_no = '${orderno}' and type='${ordtype}'`,
			(err, orderdata) => {
				////console.log(orderdata);
				res.send(orderdata);
			}
		);
	} catch (error) {
		next(error);
	}
});

ordersRouter.get(`/getcombinedschdata`, async (req, res, next) => {
	try {
		misQueryMod(
			`SELECT  n.Mtrl_Code, n.Operation,sum( n.NoOfDwgs) as NoOfDwgs, sum(n.TotalParts) as TotalParts 
        FROM magodmis.nc_task_list n,machine_data.operationslist o,machine_data.profile_cuttingoperationslist p 
        WHERE n.CustMtrl='Magod' AND n.TStatus='Created' AND o.OperationID=p.OperationId
        AND o.Operation=n.Operation
        GROUP BY  n.Mtrl_Code, n.Operation ORDER BY n.Mtrl_Code, n.Operation`,
			(err, cmbdschdata) => {
				////console.log(cmbdschdata);
				res.send(cmbdschdata);
			}
		);
	} catch (error) {
		next(error);
	}
});

ordersRouter.post(`/getorderscheduledata`, async (req, res, next) => {
	try {
		let ccode = req.body.custcode;
		misQueryMod(
			`SELECT o.* FROM magodmis.orderschedule o WHERE  o.Schedule_Status ='Tasked'  AND o.Cust_Code='${ccode}' 
                    AND o.PO not like 'Combined' AND o.Type='Profile' AND o.ScheduleType= 'Job Work'`,
			(err, ordschdata) => {
				////console.log(ordschdata);
				res.send(ordschdata);
			}
		);
	} catch (error) {
		next(error);
	}
});
ordersRouter.post(`/getselectedschdwgdata`, async (req, res, next) => {
	try {
		let scheduleid = req.body.schid;
		////console.log(scheduleid);
		misQueryMod(
			`SELECT * FROM magodmis.orderscheduledetails WHERE  scheduleid ='${scheduleid}'`,
			(err, ordschdwgdata) => {
				////console.log(ordschdwgdata);
				res.send(ordschdwgdata);
			}
		);
	} catch (error) {
		next(error);
	}
});

ordersRouter.post(`/getsalestasksdata`, async (req, res, next) => {
	try {
		//  let scheduleid = req.body.schid;
		//  //console.log(scheduleid);
		misQueryMod(
			`SELECT    n.Mtrl_Code, n.Operation,sum( n.NoOfDwgs) as NoOfDwgs, sum(n.TotalParts) as TotalParts 
                    FROM magodmis.nc_task_list n,machine_data.operationslist o,machine_data.profile_cuttingoperationslist p 
                    WHERE n.CustMtrl='Magod' AND n.TStatus='Created' AND o.OperationID=p.OperationId
                    AND o.Operation=n.Operation
                    GROUP BY  n.Mtrl_Code, n.Operation ORDER BY n.Mtrl_Code, n.Operation`,
			(err, slstskdata) => {
				////console.log(slstskdata);
				res.send(slstskdata);
			}
		);
	} catch (error) {
		next(error);
	}
});
//Sureshj

ordersRouter.post(`/getselectedsalestasklist`, async (req, res, next) => {
	try {
		////console.log("Getting selected sales task list");
		let mtrlcode = req.body.mtrl;
		let opern = req.body.opertn;
		////console.log(mtrlcode, opern);
		misQueryMod(
			`SELECT   n.Mtrl_Code, n.Operation,n.MProcess,@SalesTasksId as SalesTasksId,
        n.NcTaskId,n.ScheduleId,
        Left( n.TaskNo,9) as OrderSchNo, n.TaskNo, n.Cust_Code, n.NoOfDwgs, n.TotalParts,c.Cust_name
        FROM magodmis.nc_task_list n,magodmis.cust_data c,magodmis.orderschedule o
        WHERE n.CustMtrl='Magod' AND n.Mtrl_Code='${mtrlcode}' AND n.Operation='${opern}' 
        AND n.Cust_Code=c.Cust_Code AND n.TStatus='Created' AND n.ScheduleId=n.ScheduleId 
        AND Not( n.TaskNo  Like '99%' OR n.TaskNo  Like '88%' ) AND o.Schedule_Status='Tasked'`,
			(err, slstskdata) => {
				////console.log(slstskdata);
				res.send(slstskdata);
			}
		);
	} catch (error) {
		next(error);
	}
});

ordersRouter.post(`/preparescheduledetails`, async (req, res, next) => {
	try {
		////console.log("Preparing schedule details");
		let nctskid = req.body.nctaskid;
		misQueryMod(
			`SELECT n.NcTaskId, n.TaskNo, o.SchDetailsID, o.ScheduleId, o.Cust_Code, o.DwgName, o.Mtrl_Code,
o.MProcess, o.Mtrl_Source, o.InspLevel, o.QtyScheduled as QtyToNest, o.DwgStatus, o.Operation, o.Tolerance
FROM magodmis.orderscheduledetails o,magodmis.nc_task_list n WHERE  o.NcTaskId=n.NcTaskId AND n.NcTaskId='${nctskid}'`,
			(err, prepschdata) => {
				////console.log(prepschdata);
				res.send(prepschdata);
			}
		);
	} catch (error) {
		next(error);
	}
});

ordersRouter.post(`/getorderdwgdata`, async (req, res, next) => {
	try {
		////console.log("Getting order data");
		const orderno = req.body.ordno;
		misQueryMod(
			`SELECT * FROM magodmis.order_details WHERE order_no = '${orderno}'`,
			(err, orderdwgdetsdata) => {
				////console.log(orderdwgdetsdata);
				res.send(orderdwgdetsdata);
			}
		);
	} catch (error) {
		next(error);
	}
});

ordersRouter.post(`/getorddetailsdata`, async (req, res, next) => {
	try {
		////console.log("Getting order data");
		const orderno = req.body.ordno;
		misQueryMod(
			`SELECT * FROM magodmis.order_details WHERE order_no = '${orderno}'`,
			(err, orderdwgdetsdata) => {
				////console.log(orderdwgdetsdata);
				res.send(orderdwgdetsdata);
			}
		);
	} catch (error) {
		next(error);
	}
});

ordersRouter.post(`/getorderlistdata`, async (req, res, next) => {
	////console.log("Getting order list data");
	try {
		let otype = req.body.otype;
		////console.log(otype);
		let ordstatus = req.body.ordstatus;
		let strInternalType = req.body.strInternalType;
		let StrOrderType = "Complete";

		let sql = "";

		sql = `SELECT o.*,c.Cust_name FROM magodmis.order_list o
      JOIN magodmis.cust_data c ON o.cust_code = c.cust_code
      WHERE o.cust_code=c.cust_code AND o.Type= '${otype}'`;
		////console.log(sql);
		switch (strInternalType) {
			case "Fixture":
				sql = sql + " AND `Order-Ref` like 'Fixture'";
				break;
			case "Profile":
				sql = sql + " AND `Order-Ref` like 'Profile%'";
				break;
			default:
				sql = sql + " AND `Order-Ref` is null";
				break;
		}
		////console.log(sql);
		if ((StrOrderType = "Closed")) {
			//if (ordstatus = "Closed") {
			sql = sql + ` AND o.order_status like '${ordstatus}'`;
		} else if ((StrOrderType = "Processing")) {
			//} else if (ordstatus = "Processing") {
			sql =
				sql +
				` AND Not ( order_status ='created' OR order_status ='Suspended' OR order_status ='Cancelled' OR order_status ='Closed' `;
			sql =
				sql +
				` OR order_status ='Closed' OR order_status ='ShortClosed' OR order_status ='Completed' OR order_status ='Suspended'  OR order_status ='Dispatched'  ) `;
		} else if ((StrOrderType = "All")) {
		}
		//} else if (ordstatus = "All") { }
		else {
			sql = sql + ` AND o.order_status like '${StrOrderType}'`;
		}
		sql = sql + ` ORDER BY o.Order_Date DESC,o.Order_No Desc;`;
		////console.log(sql);
		misQueryMod(sql, (err, orderlistdata) => {
			////console.log(orderlistdata);
			res.send(orderlistdata);
		});
	} catch (error) {
		next(error);
	}
});

ordersRouter.post(`/getorderstatuslist`, async (req, res, next) => {
	try {
		////console.log("Getting order status list");
		const orderno = req.body.ordno;
		misQueryMod(
			"SELECT m.* FROM magod_setup.magod_statuslist m WHERE m.`Function` = 'Order' order by Id asc",
			(err, orderstatuslist) => {
				////console.log("orderstatuslist", orderstatuslist);
				res.send(orderstatuslist);
			}
		);
	} catch (error) {
		next(error);
	}
});

//-------------------------Veeranna---------------------------------

ordersRouter.post("/getOrderDataforFindOrder", async (req, res) => {
	// console.log("req.body -", req.body);
	console.log("req.body -", req.body.ordtype);
	try {
		misQueryMod(
			`SELECT o.Order_No,o.Cust_Code
      FROM order_list o
      WHERE o.Type ="${req.body.ordtype}"
      ORDER BY o.Order_Date DESC `,
			(err, data) => {
				if (err) logger.error(err);

				// //console.log("FindOrderdata....", data);
				res.send(data);
			}
		);
	} catch (error) {}
});

ordersRouter.post(`/getOrderDetailsByOrdrNoAndType`, async (req, res, next) => {
	// //console.log("req", req.body);
	try {
		// const ordtype = req.body.ordtype;
		misQueryMod(
			`SELECT * FROM magodmis.order_list WHERE Order_No='${req.body.orderNo}'`,
			async (err, orderData) => {
				if (err) {
					logger.error(err);
				} else {
					try {
						misQueryMod(
							`SELECT 
                  magodmis.cust_data.*
              FROM
                  magodmis.order_list
                      INNER JOIN
                  magodmis.cust_data ON magodmis.order_list.Cust_Code = magodmis.cust_data.Cust_Code
              WHERE
                  magodmis.order_list.Order_No = '${req.body.orderNo}'`,
							async (err, custData) => {
								if (err) logger.error(err);
								res.send({ orderData: orderData, custData: custData });
							}
						);
					} catch (error) {
						next(error);
					}
				}
				// //console.log("order data", data);
			}
		);
	} catch (error) {
		next(error);
	}
});
ordersRouter.post(`/updateOrderDetails`, async (req, res, next) => {
	console.log("req", req.body);

	try {
		const { orderNo, deliveryDate, delEngr } = req.body;
		await misQueryMod(
			`UPDATE magodmis.order_list 
             SET Delivery_Date='${deliveryDate}', Dealing_Engineer='${delEngr}'
             WHERE Order_No='${orderNo}'`,
			(err, result) => {
				if (err) {
					logger.error(err);
					res.status(500).send({ error: "Update failed" });
				} else {
					console.log("fields updated successfully");
					res.send({ success: true, updatedFields: { deliveryDate, delEngr } });
				}
			}
		);
	} catch (error) {
		next(error);
	}
});

ordersRouter.post(`/postnewsrldata`, async (req, res, next) => {
	////console.log("req", req.body);

	try {
		misQueryMod(
			`SELECT 
                * 
              FROM
                  magodmis.order_details
                      
              WHERE
                  Order_No = '${req.body.OrderNo}'`,
			(err, srldata) => {
				if (err) logger.error(err);
				////console.log("srldata", srldata);
				res.send(srldata);
			}
		);
	} catch (error) {
		next(error);
	}
});

ordersRouter.post("/registerOrder", async (req, res, next) => {
	try {
		misQueryMod(
			`UPDATE magodmis.order_list SET Order_Status = '${req.body.Order_Status}' WHERE (Order_No = '${req.body.Order_No}')`,
			(err, data) => {
				if (err) {
					console.log(err);
				} else {
					console.log("data", data);
					res.send(data);
				}
			}
		);
	} catch (error) {
		next(error);
	}
});
module.exports = ordersRouter;
