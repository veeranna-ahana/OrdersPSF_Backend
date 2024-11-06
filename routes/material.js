/** @format */

const materialRouter = require("express").Router();
var createError = require("http-errors");

const { misQueryMod, setupQuery } = require("../helpers/dbconn");

materialRouter.get("/allmaterials", async (req, res, next) => {
	try {
		misQueryMod(
			"Select * from magodmis.mtrl_data order by Mtrl_Code asc",
			(err, data) => {
				res.send(data);
			}
		);
	} catch (error) {
		next(error);
	}
});

materialRouter.get("/getmtrldetails", async (req, res, next) => {
	try {
		console.log("mtrldetails");
		misQueryMod(
			"Select Concat(Shape,' ',MtrlGradeID) as Material from magodmis.mtrl_data where shape='Units' order by MtrlGradeID asc",
			(err, data) => {
				res.send(data);
			}
		);
	} catch (error) {
		next(error);
	}
});

materialRouter.get("/getmtrllocation", async (req, res, next) => {
	try {
		setupQuery(
			`SELECT * FROM magod_setup.material_location_list where StorageType="Units"`,
			(data) => {
				res.send(data);
			}
		);
	} catch (error) {
		next(error);
	}
});

materialRouter.post(`/getmtrldetsbymtrlcode`, async (req, res, next) => {
	console.log("getmtrldetsbymtrlcode : " + req.body.MtrlCode);
	try {
		//    console.log(req.body.mtrlcode);
		misQueryMod(
			`Select mtl.*,mg.Grade, mg.Specific_Wt from magodmis.mtrl_data mtl  
                    inner join magodmis.mtrlgrades mg on mg.MtrlGradeID = mtl.MtrlGradeID
                    where mtl.Mtrl_Code = '${req.body.MtrlCode}' Order By Mtrl_Code asc`,
			(err, data) => {
				if (err) logger.error(err);
				//      console.log(err);
				// console.log("Material Data");
				// console.log(data);
				res.send(data);
			}
		);
	} catch (error) {
		next(error);
	}
});

module.exports = materialRouter;
