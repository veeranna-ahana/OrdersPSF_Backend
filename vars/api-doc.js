/** @format */

// -------------------------------------------order.js--------------------------------------------------------------

//savecreateorder
ordersRouter.post(`/savecreateorder`, async (req, res, next) => {
	try {
		const orddate = getCurrentDateTime();
		const {
			ordertype,
			purchaseorder,
			qtnno,
			deliverydate: reqDeliveryDate,
			paymentterms,
			salesContact,
			CustCode: ccode,
			CustomerContact,
			receivedby,
			RecordedBy,
			DealingEngineer,
			DeliveryMode,
			billingAddress,
			SpecialInstructions,
			BillingState,
			MagodDelivery,
			shippingAddress,
			GSTTaxState,
			Transportcharges,
		} = req.body;

		const deliverydate = reqDeliveryDate
			? moment(reqDeliveryDate).format("YYYY-MM-DD")
			: null;

		const billingstateId = "00";
		const DelStateId = "00";

		let runningno = 0;

		const runningNoResult = await setupQueryMod(
			`SELECT * FROM magod_setup.magod_runningno WHERE SrlType='Order' AND UnitName='Jigani' ORDER BY Id DESC LIMIT 1`
		);

		if (!runningNoResult.length) {
			throw new Error("Failed to fetch running number.");
		}

		runningno = runningNoResult[0]["Running_No"];
		const voucherLength = runningNoResult[0]["Length"];

		const ordno = `${orddate.slice(2, 4)}${(parseInt(runningno) + 1)
			.toString()
			.padStart(voucherLength, "0")}`;

		await createFolder("Order", ordno, "");

		await misQueryMod(
			`INSERT INTO magodmis.order_list(order_no, order_date, cust_code, contact_name, Type, delivery_date, purchase_order,
				order_received_by, salescontact, recordedby, dealing_engineer, order_status, special_instructions, payment,
				ordervalue, materialvalue, billing_address, BillingStateId, delivery, del_place, DelStateId, del_mode,
				tptcharges, order_type, register, qtnno)
			VALUES ('${ordno}', '${orddate}', '${ccode}', '${CustomerContact}', '${ordertype}', '${deliverydate}', '${purchaseorder}',
				'${receivedby}', '${salesContact}', '${RecordedBy}', '${DealingEngineer}', 'Created', '${SpecialInstructions}', '${paymentterms}',
				'${0}', '${0}', '${billingAddress}', '${billingstateId}', ${MagodDelivery}, '${GSTTaxState}', '${DelStateId}', '${DeliveryMode}',
				'${Transportcharges}', '${ordertype}', '${0}', '${qtnno}')`
		);

		await setupQuery(
			`UPDATE magod_setup.magod_runningno SET Running_No = Running_No + 1 WHERE SrlType='Order' AND Id = ${runningNoResult[0]["Id"]}`
		);

		res.send({ message: "Saved Successfully", orderno: ordno });
	} catch (error) {
		logger.error(error);
		next(error);
	}
});
//getqtnnossentdata
ordersRouter.post(`/getqtnnossentdata`, async (req, res, next) => {
	try {
		const { ordtype } = req.body;
		const data = await qtnQueryMod(
			`SELECT QtnNo FROM magodqtn.qtnlist WHERE QtnStatus = 'Qtn Sent' And QtnFormat = '${ordtype}' order by QtnID desc`
		);
		res.send(data);
	} catch (error) {
		logger.error(error);
		next(error);
	}
});
//getorderdata
ordersRouter.post(`/getorderdata`, async (req, res, next) => {
	try {
		const { ordno, ordtype } = req.body;
		const orderdata = await misQueryMod(
			`SELECT ord.*,cust.Cust_name FROM magodmis.order_list ord 
			LEFT OUTER JOIN magodmis.cust_data cust ON cust.Cust_code = ord.Cust_Code
			WHERE order_no = '${ordno}' AND type='${ordtype}'`
		);
		res.send(orderdata);
	} catch (error) {
		logger.error(error);
		next(error);
	}
});
//getcombinedschdata
ordersRouter.get(`/getcombinedschdata`, async (req, res, next) => {
	try {
		const cmbdschdata = await misQueryMod(
			`SELECT n.Mtrl_Code, n.Operation, SUM(n.NoOfDwgs) AS NoOfDwgs, SUM(n.TotalParts) AS TotalParts 
			FROM magodmis.nc_task_list n
			JOIN machine_data.operationslist o ON o.Operation = n.Operation
			JOIN machine_data.profile_cuttingoperationslist p ON o.OperationID = p.OperationId
			WHERE n.CustMtrl='Magod' AND n.TStatus='Created'
			GROUP BY n.Mtrl_Code, n.Operation
			ORDER BY n.Mtrl_Code, n.Operation`
		);
		res.send(cmbdschdata);
	} catch (error) {
		logger.error(error);
		next(error);
	}
});
//getorderscheduledata
ordersRouter.post(`/getorderscheduledata`, async (req, res, next) => {
	try {
		const { custcode } = req.body;
		const ordschdata = await misQueryMod(
			`SELECT o.* FROM magodmis.orderschedule o
			WHERE o.Schedule_Status = 'Tasked' AND o.Cust_Code = '${custcode}'
			AND o.PO NOT LIKE 'Combined' AND o.Type = 'Profile' AND o.ScheduleType = 'Job Work'`
		);
		res.send(ordschdata);
	} catch (error) {
		logger.error(error);
		next(error);
	}
});
//getselectedschdwgdata
ordersRouter.post(`/getselectedschdwgdata`, async (req, res, next) => {
	try {
		const { schid } = req.body;
		const ordschdwgdata = await misQueryMod(
			`SELECT * FROM magodmis.orderscheduledetails WHERE scheduleid = '${schid}'`
		);
		res.send(ordschdwgdata);
	} catch (error) {
		logger.error(error);
		next(error);
	}
});
//getsalestasksdata
ordersRouter.post(`/getsalestasksdata`, async (req, res, next) => {
	try {
		const slstskdata = await misQueryMod(
			`SELECT n.Mtrl_Code, n.Operation, SUM(n.NoOfDwgs) AS NoOfDwgs, SUM(n.TotalParts) AS TotalParts 
			FROM magodmis.nc_task_list n
			JOIN machine_data.operationslist o ON o.Operation = n.Operation
			JOIN machine_data.profile_cuttingoperationslist p ON o.OperationID = p.OperationId
			WHERE n.CustMtrl = 'Magod' AND n.TStatus = 'Created'
			GROUP BY n.Mtrl_Code, n.Operation
			ORDER BY n.Mtrl_Code, n.Operation`
		);
		res.send(slstskdata);
	} catch (error) {
		logger.error(error);
		next(error);
	}
});
//getselectedsalestasklist
ordersRouter.post(`/getselectedsalestasklist`, async (req, res, next) => {
	try {
		let mtrlcode = req.body.mtrl;
		let opern = req.body.opertn;

		let sqlQuery = `
			SELECT
				n.Mtrl_Code, n.Operation, n.MProcess, @SalesTasksId as SalesTasksId,
				n.NcTaskId, n.ScheduleId,
				Left(n.TaskNo, 9) as OrderSchNo, n.TaskNo, n.Cust_Code, n.NoOfDwgs, n.TotalParts, c.Cust_name
			FROM
				magodmis.nc_task_list n, magodmis.cust_data c, magodmis.orderschedule o
			WHERE
				n.CustMtrl = 'Magod' AND n.Mtrl_Code = '${mtrlcode}' AND n.Operation = '${opern}'
				AND n.Cust_Code = c.Cust_Code AND n.TStatus = 'Created' AND n.ScheduleId = n.ScheduleId
				AND NOT (n.TaskNo LIKE '99%' OR n.TaskNo LIKE '88%') AND o.Schedule_Status = 'Tasked';`;

		misQueryMod(sqlQuery, (err, slstskdata) => {
			if (err) {
				throw err;
			}
			res.send(slstskdata);
		});
	} catch (error) {
		next(error);
	}
});
//preparescheduledetails
ordersRouter.post(`/preparescheduledetails`, async (req, res, next) => {
	try {
		let nctskid = req.body.nctaskid;

		let sqlQuery = `
			SELECT
				n.NcTaskId, n.TaskNo, o.SchDetailsID, o.ScheduleId, o.Cust_Code, o.DwgName, o.Mtrl_Code,
				o.MProcess, o.Mtrl_Source, o.InspLevel, o.QtyScheduled as QtyToNest, o.DwgStatus, o.Operation, o.Tolerance
			FROM
				magodmis.orderscheduledetails o, magodmis.nc_task_list n
			WHERE
				o.NcTaskId = n.NcTaskId AND n.NcTaskId = '${nctskid}';`;

		misQueryMod(sqlQuery, (err, prepschdata) => {
			if (err) {
				throw err;
			}
			res.send(prepschdata);
		});
	} catch (error) {
		next(error);
	}
});
// getorderdwgdata
ordersRouter.post(`/getorderdwgdata`, async (req, res, next) => {
	try {
		const orderno = req.body.ordno;

		let sqlQuery = `
			SELECT * FROM magodmis.order_details WHERE order_no = '${orderno}';`;

		misQueryMod(sqlQuery, (err, orderdwgdetsdata) => {
			if (err) {
				throw err;
			}
			res.send(orderdwgdetsdata);
		});
	} catch (error) {
		next(error);
	}
});
//getorddetailsdata
ordersRouter.post(`/getorddetailsdata`, async (req, res, next) => {
	try {
		const orderno = req.body.ordno;

		let sqlQuery = `
			SELECT * FROM magodmis.order_details WHERE order_no = '${orderno}';`;

		misQueryMod(sqlQuery, (err, orderdwgdetsdata) => {
			if (err) {
				throw err;
			}
			res.send(orderdwgdetsdata);
		});
	} catch (error) {
		next(error);
	}
});
//getorderlistdata
ordersRouter.post(`/getorderlistdata`, async (req, res, next) => {
	try {
		let otype = req.body.otype;
		let ordstatus = req.body.ordstatus;
		let strInternalType = req.body.strInternalType;
		let StrOrderType = "Complete";

		let sql = `
			SELECT o.*, c.Cust_name FROM magodmis.order_list o
			JOIN magodmis.cust_data c ON o.cust_code = c.cust_code
			WHERE o.Type = '${otype}';`;

		switch (strInternalType) {
			case "Fixture":
				sql += " AND `Order-Ref` LIKE 'Fixture'";
				break;
			case "Profile":
				sql += " AND `Order-Ref` LIKE 'Profile%'";
				break;
			default:
				sql += " AND `Order-Ref` IS NULL";
				break;
		}

		if (StrOrderType === "Closed") {
			sql += ` AND o.order_status LIKE '${ordstatus}'`;
		} else if (StrOrderType === "Processing") {
			sql += ` AND NOT (
				order_status ='created' OR order_status ='Suspended' OR order_status ='Cancelled'
				OR order_status ='Closed' OR order_status ='ShortClosed' OR order_status ='Completed'
				OR order_status ='Suspended' OR order_status ='Dispatched'
			)`;
		} else if (StrOrderType === "All") {
			// Add condition for all orders if needed
		} else {
			sql += ` AND o.order_status LIKE '${StrOrderType}'`;
		}

		sql += ` ORDER BY o.Order_Date DESC, o.Order_No DESC;`;

		misQueryMod(sql, (err, orderlistdata) => {
			if (err) {
				throw err;
			}
			res.send(orderlistdata);
		});
	} catch (error) {
		next(error);
	}
});
//getorderstatuslist
ordersRouter.post(`/getorderstatuslist`, async (req, res, next) => {
	try {
		misQueryMod(
			"SELECT m.* FROM magod_setup.magod_statuslist m WHERE m.`Function` = 'Order' ORDER BY Id ASC;",
			(err, orderstatuslist) => {
				if (err) {
					throw err;
				}
				res.send(orderstatuslist);
			}
		);
	} catch (error) {
		next(error);
	}
});
//getOrderDataforFindOrder
ordersRouter.post("/getOrderDataforFindOrder", async (req, res, next) => {
	try {
		let ordtype = req.body.ordtype;

		let sqlQuery = `
			SELECT o.Order_No, o.Cust_Code
			FROM order_list o
			WHERE o.Type = '${ordtype}'
			ORDER BY o.Order_Date DESC;`;

		misQueryMod(sqlQuery, (err, data) => {
			if (err) {
				throw err;
			}
			res.send(data);
		});
	} catch (error) {
		next(error);
	}
});
//getOrderDetailsByOrdrNoAndType
ordersRouter.post(`/getOrderDetailsByOrdrNoAndType`, async (req, res, next) => {
	try {
		let orderNo = req.body.orderNo;

		let sqlQuery = `
			SELECT * FROM magodmis.order_list WHERE Order_No = '${orderNo}';`;

		misQueryMod(sqlQuery, async (err, orderData) => {
			if (err) {
				throw err;
			}
			try {
				let sqlQueryCustData = `
					SELECT magodmis.cust_data.*
					FROM magodmis.order_list
					INNER JOIN magodmis.cust_data ON magodmis.order_list.Cust_Code = magodmis.cust_data.Cust_Code
					WHERE magodmis.order_list.Order_No = '${orderNo}';`;

				misQueryMod(sqlQueryCustData, async (err, custData) => {
					if (err) {
						throw err;
					}
					res.send({ orderData: orderData, custData: custData });
				});
			} catch (error) {
				next(error);
			}
		});
	} catch (error) {
		next(error);
	}
});
//postnewsrldata
ordersRouter.post(`/postnewsrldata`, async (req, res, next) => {
	try {
		let orderNo = req.body.OrderNo;

		let sqlQuery = `
			SELECT * FROM magodmis.order_details WHERE Order_No = '${orderNo}';`;

		misQueryMod(sqlQuery, (err, srldata) => {
			if (err) {
				throw err;
			}
			res.send(srldata);
		});
	} catch (error) {
		next(error);
	}
});
//registerOrder
ordersRouter.post("/registerOrder", async (req, res, next) => {
	try {
		let orderNo = req.body.Order_No;
		let orderStatus = req.body.Order_Status;

		let sqlQuery = `
			UPDATE magodmis.order_list SET Order_Status = '${orderStatus}' WHERE Order_No = '${orderNo}';`;

		misQueryMod(sqlQuery, (err, data) => {
			if (err) {
				throw err;
			}
			res.send(data);
		});
	} catch (error) {
		next(error);
	}
});

// ---------------------------orderDetails.js---------------------------------------------------------------

// Route to insert new SRL data
OrderDetailsRouter.post("/insertnewsrldata", async (req, res, next) => {
	try {
		const {
			OrderNo,
			newOrderSrl,
			custcode,
			DwgName,
			Dwg_Code,
			strmtrlcode,
			Operation,
			NewSrlFormData,
			Qty_Ordered,
			JwCost,
			mtrlcost,
			dwg,
			tolerance,
			HasBOM,
		} = req.body.requestData;

		await misQueryMod(
			`SELECT * FROM magodmis.order_details WHERE Order_No = ?`,
			[OrderNo],
			async (err, data1) => {
				if (err) {
					return next(err);
				}

				const insertQuery = `
        INSERT INTO magodmis.order_details (
          Order_No, Order_Srl, Cust_Code, DwgName, Dwg_Code, mtrl_code, Operation, Mtrl_Source, Qty_Ordered, InspLevel, PackingLevel, JWCost, MtrlCost, Dwg, tolerance, HasBOM
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

				const insertValues = [
					OrderNo,
					newOrderSrl,
					custcode,
					DwgName,
					Dwg_Code,
					strmtrlcode,
					Operation,
					NewSrlFormData.MtrlSrc,
					parseInt(Qty_Ordered),
					NewSrlFormData.InspLvl,
					NewSrlFormData.PkngLvl,
					parseFloat(JwCost),
					parseFloat(mtrlcost),
					dwg,
					tolerance,
					HasBOM,
				];

				await misQueryMod(insertQuery, insertValues, (err, srldata) => {
					if (err) {
						return next(err);
					}
					res.send(srldata);
				});
			}
		);
	} catch (error) {
		next(error);
	}
});

// Route to get BOM data
OrderDetailsRouter.post("/getbomdata", async (req, res, next) => {
	try {
		const { custcode } = req.body;
		const query = `
      SELECT bom.*, assy.*, UniqueColumn
      FROM (
        SELECT DISTINCT PartId AS UniqueColumn FROM magodmis.cust_bomlist WHERE cust_code = ?
        UNION
        SELECT DISTINCT AssyCust_PartId AS UniqueColumn FROM magodmis.cust_bomlist AS bom INNER JOIN magodmis.cust_assy_data AS assy ON bom.cust_code = assy.cust_code WHERE bom.cust_code = ?
      ) AS UniqueData
      LEFT JOIN magodmis.cust_bomlist AS bom ON UniqueData.UniqueColumn = bom.PartId
      LEFT JOIN magodmis.cust_assy_data AS assy ON UniqueData.UniqueColumn = assy.AssyCust_PartId
      ORDER BY UniqueData.UniqueColumn DESC`;

		await misQueryMod(query, [custcode, custcode], (err, bomdata) => {
			if (err) {
				return next(err);
			}
			res.send(bomdata);
		});
	} catch (error) {
		next(error);
	}
});

// Route to get old part data
OrderDetailsRouter.post("/getfindoldpartdata", async (req, res, next) => {
	try {
		const { custcode } = req.body;
		await misQueryMod(
			`SELECT * FROM magodmis.order_details WHERE cust_code = ?`,
			[custcode],
			(err, findoldpartdata) => {
				if (err) {
					return next(err);
				}
				res.send(findoldpartdata);
			}
		);
	} catch (error) {
		next(error);
	}
});

// Route to load stock position
OrderDetailsRouter.post("/loadStockPosition", async (req, res, next) => {
	try {
		const { custcode, CB_Magod } = req.body;
		let query = `
      SELECT MtrlStockID, COUNT(MtrlStockID) as inStock, Mtrl_Code, DynamicPara1, DynamicPara2, Locked, Scrap
      FROM magodmis.mtrlstocklist m
      GROUP BY MtrlStockID, Mtrl_Code, DynamicPara1, DynamicPara2, Locked, Scrap`;

		await misQueryMod(query, [], async (err, data) => {
			if (err) {
				return next(err);
			}

			if (CB_Magod === 0) {
				query = `
          SELECT MtrlStockID, COUNT(MtrlStockID) as inStock, Mtrl_Code, DynamicPara1, DynamicPara2, Locked, Scrap
          FROM magodmis.mtrlstocklist m
          WHERE m.Cust_Code = ?
          GROUP BY MtrlStockID, Mtrl_Code, DynamicPara1, DynamicPara2, Locked, Scrap
          ORDER BY Locked DESC, Scrap DESC`;

				await misQueryMod(query, [custcode], (err, data1) => {
					if (err) {
						return next(err);
					}
					res.send(data1);
				});
			} else {
				query = `
          SELECT MtrlStockID, COUNT(MtrlStockID) as inStock, Mtrl_Code, DynamicPara1, DynamicPara2, Locked, Scrap
          FROM magodmis.mtrlstocklist m
          WHERE m.Cust_Code = "0000"
          GROUP BY MtrlStockID, Mtrl_Code, DynamicPara1, DynamicPara2, Locked, Scrap
          ORDER BY Locked DESC, Scrap DESC`;

				await misQueryMod(query, [], (err, data2) => {
					if (err) {
						return next(err);
					}
					res.send(data2);
				});
			}
		});
	} catch (error) {
		next(error);
	}
});

// Route to load arrival data
OrderDetailsRouter.post("/LoadArrival", async (req, res, next) => {
	try {
		const { custcode } = req.body;
		const query = `
      SELECT m.RVID, m.RV_No, m.RV_Date, m.CustDocuNo, m.RVStatus, m.TotalWeight, m.updated, m.TotalCalculatedWeight
      FROM magodmis.material_receipt_register m
      WHERE m.Cust_Code = ?
      ORDER BY m.RV_no DESC`;

		await misQueryMod(query, [custcode], (err, data) => {
			if (err) {
				return next(err);
			}
			res.send(data);
		});
	} catch (error) {
		next(error);
	}
});

// Route to load detailed arrival data
OrderDetailsRouter.post("/LoadArrival2", async (req, res, next) => {
	try {
		const { RVID } = req.body;
		const query = `
      SELECT m.rvID, m.Mtrl_Code, m.DynamicPara1, m.DynamicPara2, m.Qty, m.updated
      FROM magodmis.mtrlreceiptdetails m
      WHERE m.rvID = ?`;

		await misQueryMod(query, [RVID], (err, data1) => {
			if (err) {
				return next(err);
			}
			res.send(data1);
		});
	} catch (error) {
		next(error);
	}
});

// Route to get quotation list
OrderDetailsRouter.post("/getQtnList", async (req, res, next) => {
	try {
		const query = `
      SELECT *, DATE_FORMAT(ValidUpTo, '%d/%m/%Y') AS Printable_ValidUpTo
      FROM magodqtn.qtnlist
      ORDER BY QtnID DESC`;

		await qtnQueryMod(query, [], (err, qtnList) => {
			if (err) {
				return next(err);
			}
			res.send({ qtnList });
		});
	} catch (error) {
		next(error);
	}
});

// Route to get quotation data by QtnID
OrderDetailsRouter.post("/getQtnDataByQtnID", async (req, res, next) => {
	try {
		const { qtnId } = req.body;
		const query = `
      SELECT *
      FROM magodqtn.qtn_itemslist
      WHERE QtnId = ?
      ORDER BY ID DESC`;

		await qtnQueryMod(query, [qtnId], (err, qtnItemList) => {
			if (err) {
				return next(err);
			}
			res.send({ qtnItemList });
		});
	} catch (error) {
		next(error);
	}
});

// Route to get old orders by customer code and order number
OrderDetailsRouter.post(
	"/getOldOrderByCustCodeAndOrderNo",
	async (req, res, next) => {
		try {
			const { Cust_Code, Order_No } = req.body;
			const orderListQuery = `
      SELECT * FROM magodmis.order_list
      WHERE Cust_Code = ? AND Order_No != ?
      ORDER BY Order_No DESC`;
			const orderDetailsQuery = `
      SELECT * FROM magodmis.order_details
      WHERE Order_No = ?`;

			await misQueryMod(
				orderListQuery,
				[Cust_Code, Order_No],
				async (err, orders) => {
					if (err) {
						return next(err);
					}

					if (orders.length === 0) {
						return res.send({ oldOrderData: [] });
					}

					const oldOrderDataPromises = orders.map(
						(order) =>
							new Promise((resolve, reject) => {
								misQueryMod(
									orderDetailsQuery,
									[order.Order_No],
									(err, orderDetails) => {
										if (err) {
											return reject(err);
										}
										resolve(orderDetails);
									}
								);
							})
					);

					const oldOrderData = await Promise.all(oldOrderDataPromises);
					res.send({ oldOrderData });
				}
			);
		} catch (error) {
			next(error);
		}
	}
);
//Route to post DeleteDetailsByOrderNo
OrderDetailsRouter.post(
	`/postDeleteDetailsByOrderNo`,
	async (req, res, next) => {
		try {
			misQueryMod(
				`DELETE FROM magodmis.order_details WHERE Order_No = '${req.body.Order_No}'`,
				(err, deleteOrderData) => {
					if (err) {
						res.status(500).send("Internal Server Error");
					} else {
						res.send({ deleteOrderData, flag: 1 });
					}
				}
			);
		} catch (error) {
			next(error);
		}
	}
);
//Route to get postDetailsDataInImportQtn
OrderDetailsRouter.post(
	`/postDetailsDataInImportQtn`,
	async (req, res, next) => {
		const detailsData = req.body.detailsData;

		try {
			for (const element of detailsData) {
				const {
					Order_No,
					Order_Srl,
					Cust_Code,
					DwgName = "",
					Mtrl_Code = "",
					MProcess = "",
					Mtrl_Source = "",
					Qty_Ordered = 0,
					InspLevel = "Insp1",
					PackingLevel = "Pkng1",
					UnitPrice = 0,
					UnitWt = 0,
					Order_Status = "Received",
					JWCost = 0,
					MtrlCost = 0,
					Operation = "",
					tolerance = "",
				} = element;

				misQueryMod(
					`INSERT INTO magodmis.order_details (
            Order_No, Order_Srl, Cust_Code, DwgName, Mtrl_Code, MProcess, Mtrl_Source, 
            Qty_Ordered, InspLevel, PackingLevel, UnitPrice, UnitWt, Order_Status, 
            JWCost, MtrlCost, Operation, tolerance
          ) VALUES (
            '${Order_No}', '${Order_Srl}', '${Cust_Code}', '${DwgName}', 
            '${Mtrl_Code}', '${MProcess}', '${Mtrl_Source}', ${parseInt(
						Qty_Ordered
					)}, 
            '${InspLevel}', '${PackingLevel}', ${parseFloat(UnitPrice).toFixed(
						2
					)}, 
            ${parseFloat(UnitWt).toFixed(3)}, '${Order_Status}', ${parseFloat(
						JWCost
					).toFixed(2)}, 
            ${parseFloat(MtrlCost).toFixed(2)}, '${Operation}', '${tolerance}'
          )`,
					(err) => {
						if (err) {
							res.status(500).send("Internal Server Error");
						}
					}
				);
			}

			res.send({ result: true });
		} catch (error) {
			next(error);
		}
	}
);
// Route to get bulkChangeUpdate
OrderDetailsRouter.post("/bulkChangeUpdate", async (req, res, next) => {
	const { OrderSrl, selectedItems, OrderNo } = req.body;

	const executeUpdate = (
		orderSrl,
		qtyOrdered,
		DwgName,
		JWCost,
		MtrlCost,
		UnitPrice,
		Operation,
		InspLevel,
		PackingLevel
	) => {
		const updateQuery = `
      UPDATE magodmis.order_details
      SET
        Qty_Ordered = ${qtyOrdered},
        DwgName = '${DwgName}',
        JWCost = ${JWCost},
        MtrlCost = ${MtrlCost},
        UnitPrice = ${UnitPrice},
        Operation = '${Operation}',
        InspLevel = '${InspLevel}',
        PackingLevel = '${PackingLevel}'
      WHERE Order_No = ${OrderNo} 
      AND Order_Srl = ${orderSrl}
    `;

		return new Promise((resolve, reject) => {
			misQueryMod(updateQuery, (err, blkcngdata) => {
				if (err) {
					reject(err);
				} else {
					resolve(blkcngdata);
				}
			});
		});
	};

	try {
		await Promise.all(
			OrderSrl.map((orderSrl, index) => {
				const {
					quantity,
					DwgName,
					JWCost,
					MtrlCost,
					UnitPrice,
					Operation,
					InspLevel,
					PackingLevel,
				} = selectedItems[index];

				return executeUpdate(
					orderSrl,
					parseInt(quantity),
					DwgName,
					JWCost,
					MtrlCost,
					UnitPrice,
					Operation,
					InspLevel,
					PackingLevel
				);
			})
		);

		res.send({ message: "Updates completed successfully." });
	} catch (error) {
		next(error);
	}
});
//Route to get singleChangeUpdate
OrderDetailsRouter.post("/singleChangeUpdate", async (req, res, next) => {
	const {
		quantity,
		JwCost,
		mtrlcost,
		unitPrice,
		Operation,
		InspLvl,
		PkngLvl,
		DwgName,
		MtrlSrc,
		OrderNo,
		OrderSrl,
	} = req.body;

	const updateQuery = `
    UPDATE magodmis.order_details
    SET
      Qty_Ordered = CASE WHEN ${parseInt(quantity)} IS NOT NULL THEN ${parseInt(
		quantity
	)} ELSE Qty_Ordered END,
      JWCost = CASE WHEN ${parseFloat(JwCost)} IS NOT NULL THEN ${parseFloat(
		JwCost
	)} ELSE JWCost END,
      MtrlCost = CASE WHEN ${parseFloat(
				mtrlcost
			)} IS NOT NULL THEN ${parseFloat(mtrlcost)} ELSE MtrlCost END,
      UnitPrice = CASE WHEN ${parseFloat(
				unitPrice
			)} IS NOT NULL THEN ${parseFloat(unitPrice)} ELSE UnitPrice END,
      Operation = '${Operation}',
      InspLevel = '${InspLvl}',
      PackingLevel = '${PkngLvl}',
      DwgName = '${DwgName}',
      Mtrl_Source = '${MtrlSrc}'
    WHERE Order_No = ${OrderNo} AND Order_Srl = ${OrderSrl}
  `;

	try {
		misQueryMod(updateQuery, (err, singlecngdata) => {
			if (err) {
				next(err);
			} else {
				res.send(singlecngdata);
			}
		});
	} catch (error) {
		next(error);
	}
});
// Route to get postDeleteDetailsBySrl
OrderDetailsRouter.post(`/postDeleteDetailsBySrl`, async (req, res, next) => {
	const { selectedSrl, Order_No } = req.body;

	try {
		await Promise.all(
			selectedSrl.map((srl) => {
				return new Promise((resolve, reject) => {
					misQueryMod(
						`DELETE FROM magodmis.order_details WHERE Order_No = '${Order_No}' AND Order_Srl = '${srl}'`,
						(err, deleteOrderData) => {
							if (err) {
								reject(err);
							} else {
								resolve(deleteOrderData);
							}
						}
					);
				});
			})
		);

		res.send({ flag: 1 });
	} catch (error) {
		next(error);
	}
});
