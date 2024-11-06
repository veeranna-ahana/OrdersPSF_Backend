/** @format */

const runningNoRouter = require("express").Router();
const { setupQueryMod } = require("../helpers/dbconn");

runningNoRouter.post("/getAndInsertRunningNo", async (req, res, next) => {
	try {
		setupQueryMod(
			`Select * from magod_setup.magod_runningno where SrlType = "${req.body.SrlType}" and Period = "${req.body.Period}" and UnitName="${req.body.UnitName}"`,
			(err, data) => {
				if (err) {
					logger.error(err);
				} else {
					if (data.length > 0) {
						res.send(data);
					} else {
						try {
							setupQueryMod(
								`INSERT INTO magod_setup.magod_runningno
                  (UnitName, SrlType, ResetPeriod, ResetValue, EffectiveFrom_date, Reset_date, Running_No, UnitIntial, Prefix, Suffix, Length, DerivedFrom, Period, Running_EffectiveDate)
                VALUES
                ('${req.body.UnitName}', '${req.body.SrlType}', '${
									req.body.ResetPeriod || "Year"
								}', '${req.body.ResetValue || 0}', '${
									req.body.EffectiveFrom_date
								}', '${req.body.Reset_date}', '${req.body.Running_No || 0}', '${
									req.body.UnitIntial || 0
								}', '${req.body.Prefix || ""}', '${req.body.Suffix || ""}', '${
									req.body.Length || 4
								}', '${req.body.DerivedFrom || 0}', '${
									req.body.Period || 0
								}', now())`,
								(err, insertData) => {
									if (err) {
										logger.error(err);
									} else {
										try {
											setupQueryMod(
												`Select * from magod_setup.magod_runningno where Id = '${insertData.insertId}'`,
												(err, selectData) => {
													if (err) {
														logger.error(err);
													} else {
														res.send(selectData);
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
				}
			}
		);
	} catch (error) {
		next(error);
	}
});

runningNoRouter.post("/updateRunningNoBySrlType", async (req, res, next) => {
	try {
		//console.log("updateRunningNoBySrlType", req.body);
		let { SrlType, Period, RunningNo } = req.body;
		setupQueryMod(
			`update magod_runningno set Running_No = "${RunningNo}" where  SrlType = "${SrlType}" and Period = "${Period}"`,
			(err, data) => {
				if (err) logger.error(err);
				res.send(data);
			}
		);
	} catch (error) {
		next(error);
	}
});

runningNoRouter.post("/insertAndGetRunningNo", async (req, res, next) => {
	// console.log("reqqqq", req.body);

	let Running_No = 0;

	const todayDate = new Date();
	let finYear = `${
		(todayDate.getMonth() + 1 < 4
			? todayDate.getFullYear() - 1
			: todayDate.getFullYear()
		)
			.toString()
			.slice(-2) +
		"/" +
		(todayDate.getMonth() + 1 < 4
			? todayDate.getFullYear()
			: todayDate.getFullYear() + 1
		)
			.toString()
			.slice(-2)
	}`;

	try {
		setupQueryMod(
			`SELECT 
            *
          FROM
            magod_setup.magod_runningno
          WHERE
            UnitName = '${req.body.unitName}' AND SrlType = '${req.body.srlType}'
            AND ResetPeriod = '${req.body.ResetPeriod}'
            AND Period = '${req.body.finYear}'`,
			(err, selectRN1) => {
				if (err) {
					logger.error(err);
				} else {
					// console.log("selectRN1", selectRN1);

					if (selectRN1.length === 0) {
						try {
							setupQueryMod(
								`SELECT 
                      *
                    FROM
                        magod_setup.year_prefix_suffix
                    WHERE
                        UnitName = '${req.body.unitName}' AND SrlType = '${req.body.srlType}'`,
								(err, selectYearPrefixSuffix) => {
									if (err) {
										logger.error(err);
									} else {
										// console.log(
										//   "selectYearPrefixSuffix",
										//   selectYearPrefixSuffix
										// );
										let EffectiveFrom_date = `${
											todayDate.getFullYear() + "-04-01"
										}`;
										let Reset_date = `${
											todayDate.getFullYear() + 1 + "-03-31"
										}`;
										setupQueryMod(
											`INSERT INTO magod_setup.magod_runningno
                            (UnitName, SrlType, ResetPeriod, ResetValue, EffectiveFrom_date, Reset_date, Running_No, Prefix, Suffix, Length, Period, Running_EffectiveDate)
                          VALUES
                            ('${selectYearPrefixSuffix[0].UnitName || ""}', '${
												selectYearPrefixSuffix[0].SrlType || ""
											}', '${req.body.ResetPeriod || ""}', '${
												req.body.ResetValue || 0
											}', '${EffectiveFrom_date}', '${Reset_date}', '${Running_No}', '${
												selectYearPrefixSuffix[0].Prefix || ""
											}', '${selectYearPrefixSuffix[0].Suffix || ""}', '${
												req.body.Length || 5
											}', '${req.body.finYear || finYear}', now())`,
											(err, insertRunningNo) => {
												if (err) {
													logger.error(err);
												} else {
													// console.log("insertRunningNo", insertRunningNo);

													setupQueryMod(
														`SELECT * FROM magod_setup.magod_runningno WHERE Id = ${insertRunningNo.insertId}`,
														(err, selectRunningNo) => {
															if (err) {
																logger.error(err);
															} else {
																res.send({
																	runningNoData: selectRunningNo[0],
																	message: "running no inserted",
																});
																// console.log("selectRunningNo", selectRunningNo);
															}
														}
													);
												}
											}
										);
									}
								}
							);
						} catch (error) {
							next(error);
						}
					} else {
						res.send({
							runningNoData: selectRN1[0],
							message: "fechted running no",
						});
					}
				}
			}
		);
	} catch (error) {
		next(error);
	}
});

module.exports = runningNoRouter;
