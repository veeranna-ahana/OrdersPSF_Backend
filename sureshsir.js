/** @format */

// SURESH SIR

OrderDetailsRouter.post(`/insertnewsrldata`, async (req, res, next) => {
	console.log("entering into insertnewsrldata");
	//console.log("req.body", req.body);
	let ressrldata = [];
	if (req.body.requestData.flag === 1 || req.body.requestData.flag === 3) {
		try {
			misQueryMod(
				`SELECT * FROM magodmis.order_details where Order_No=${req.body.requestData.OrderNo}`,
				(err, data1) => {
					if (err) {
						logger.error(err);
					} else {
						try {
							const orderNo = req.body.requestData.OrderNo;
							const newOrderSrl = req.body.requestData.newOrderSrl;
							const custcode = req.body.requestData.custcode;
							const dwgName = req.body.requestData.DwgName;
							const dwgCode = req.body.requestData.Dwg_Code || "";
							const strmtrlcode = req.body.requestData.strmtrlcode || "";
							const operation = req.body.requestData.Operation || "";
							const mtrlSrc = req.body.requestData.NewSrlFormData.MtrlSrc;
							const qtyOrdered =
								parseInt(req.body.requestData.Qty_Ordered) || 0;
							const inspLvl = req.body.requestData.NewSrlFormData.InspLvl;
							const pkngLvl = req.body.requestData.NewSrlFormData.PkngLvl;
							const jwCost = parseFloat(req.body.requestData.JwCost) || 0.0;
							const mtrlCost = parseFloat(req.body.requestData.mtrlcost) || 0.0;
							const dwg = req.body.requestData.dwg || 0;
							const tolerance = req.body.requestData.tolerance;
							const hasBOM = req.body.requestData.HasBOM || 0;

							misQueryMod(
								`INSERT INTO magodmis.order_details (
                                Order_No, Order_Srl, Cust_Code, DwgName, Dwg_Code, mtrl_code, Operation, Mtrl_Source, Qty_Ordered, InspLevel, PackingLevel, JWCost, MtrlCost, Dwg, tolerance, HasBOM
                            ) VALUES (
                                '${orderNo}',
                                ${newOrderSrl},
                                '${custcode}',
                                '${dwgName}',
                                '${dwgCode}',
                                '${strmtrlcode}',
                                '${operation}',
                                '${mtrlSrc}',
                                ${qtyOrdered},
                                '${inspLvl}',
                                '${pkngLvl}',
                                ${jwCost},
                                ${mtrlCost},
                                ${dwg},
                                '${tolerance}',
                                ${hasBOM}
                            )`,
								(err, srldata) => {
									if (err) {
										logger.error(err);
									} else {
										ressrldata.push(srldata);
										//res.send(srldata);
									}
								}
							);
						} catch (error) {
							logger.error(error);
						}
					}
				}
			);
		} catch (error) {
			logger.error(error);
		}
	} else if (req.body.requestData.flag === 2) {
		console.log("Flag : ", req.body.requestData.flag);

		try {
			console.log("Order No : " + req.body.requestData.imprtDwgData["OrderNo"]);

			console.log(
				"File Name 1: ",
				req.body.requestData.imprtDwgData.impDwgFileData[0].file
			);
			//console.log("Delivery Date : ", req.body.requestData.imprtDwgData.Delivery_Date);

			let ordno = req.body.requestData.imprtDwgData["OrderNo"];
			misQueryMod(
				`SELECT * FROM magodmis.order_details where Order_No=${ordno}`,
				(err, data1) => {
					if (err) {
						logger.error(err);
					} else {
						try {
							for (
								let i = 0;
								i < req.body.requestData.imprtDwgData.impDwgFileData.length;
								i++
							) {
								console.log("i : ", i);
								console.log(
									"File Name : ",
									req.body.requestData.imprtDwgData.impDwgFileData[i].file
								);

								const orderNo = req.body.requestData.imprtDwgData.OrderNo;
								const newOrderSrl = i + 1; // req.body.requestData.imprtDwgData.newOrderSrl;
								const custcode = req.body.requestData.imprtDwgData.custcode;
								const dwgName =
									req.body.requestData.imprtDwgData.impDwgFileData[i].file;
								const dwgCode =
									req.body.requestData.imprtDwgData.Dwg_Code || "";
								const strmtrlcode =
									req.body.requestData.imprtDwgData.strmtrlcode || "";
								const operation =
									req.body.requestData.imprtDwgData.Operation || "";
								const mtrlSrc =
									req.body.requestData.imprtDwgData.NewSrlFormData.MtrlSrc;
								const qtyOrdered =
									parseInt(req.body.requestData.imprtDwgData.Qty_Ordered) || 0;
								const inspLvl =
									req.body.requestData.imprtDwgData.NewSrlFormData.InspLvl;
								const pkngLvl =
									req.body.requestData.imprtDwgData.NewSrlFormData.PkngLvl;
								const loc =
									parseFloat(
										req.body.requestData.imprtDwgData.impDwgFileData[i]
											.lengthOfCut
									) || 0;
								const noofpierces =
									parseFloat(
										req.body.requestData.imprtDwgData.impDwgFileData[i]
											.noOfPierces
									) || 0;
								const jwCost =
									parseFloat(
										req.body.requestData.imprtDwgData.impDwgFileData[i].jwcost
									) || 0.0;
								const mtrlCost =
									parseFloat(
										req.body.requestData.imprtDwgData.impDwgFileData[i].mtrlcost
									) || 0.0;
								const unitPrice =
									parseFloat(
										req.body.requestData.imprtDwgData.impDwgFileData[i]
											.unitPrice
									) || 0.0;
								const dwg = req.body.requestData.imprtDwgData.dwg || 0;
								const tolerance = req.body.requestData.imprtDwgData.tolerance;
								const thickness = req.body.requestData.imprtDwgData.Thickness;
								const mtrl = req.body.requestData.imprtDwgData.mtrl;
								const material = req.body.requestData.imprtDwgData.material;
								const deldate = moment(
									req.body.requestData.imprtDwgData.Delivery_Date,
									"YYYY-MM-DD"
								).format("YYYY-MM-DD");
								const hasBOM = req.body.requestData.imprtDwgData.HasBOM || 0;

								misQueryMod(
									`INSERT INTO magodmis.order_details (
                                Order_No, Order_Srl, Cust_Code, DwgName, Dwg_Code, mtrl_code, Operation, Thickness, Mtrl_Source, Mtrl, Material, Qty_Ordered,
                                InspLevel, PackingLevel, Delivery_Date, UnitPrice, LOC, Holes, JWCost, MtrlCost, Dwg, tolerance, HasBOM
                            ) VALUES (
                                '${orderNo}',
                                ${newOrderSrl},
                                '${custcode}',
                                '${dwgName}',
                                '${dwgCode}',
                                '${strmtrlcode}',
                                '${operation}',
                                '${thickness}',
                                '${mtrlSrc}',
                                '${mtrl}',
                                '${material}',
                                ${qtyOrdered},
                                '${inspLvl}',
                                '${pkngLvl}',
                                '${deldate}',
                                ${unitPrice},
                                '${loc}',
                                ${noofpierces},
                                ${jwCost},
                                ${mtrlCost},
                                ${dwg},
                                '${tolerance}',
                                ${hasBOM}
                            )`,
									(err, srldata) => {
										if (err) {
											logger.error(err);
										} else {
											ressrldata.push(srldata);
											//res.send(srldata);
										}
									}
								);
							}
						} catch (error) {
							logger.error(error);
						}
					}
					res.send(ressrldata);
				}
			);
		} catch (error) {
			logger.error(error);
		}
	}
});
