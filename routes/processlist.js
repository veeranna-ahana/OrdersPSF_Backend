/** @format */

const processlistRouter = require("express").Router();
var createError = require("http-errors");

const { misQuery } = require("../helpers/dbconn");

// processlistRouter.get("/allprocesslists", async (req, res, next) => {
// 	try {
// 		// misQuery("Select * from magodmis.process_list order by ProcessDescription asc", (data) => {
// 		misQuery(
// 			"Select * from machine_data.magod_process_list order by ProcessDescription asc",
// 			(data) => {
// 				res.send(data);
// 			}
// 		);
// 	} catch (error) {
// 		next(error);
// 	}
// });

processlistRouter.get("/allprocesslists", async (req, res, next) => {
	try {
		const sqlQuery = `
            SELECT 
    sol.OperationID,    
    ol.Operation, 
    'service' AS type
FROM 
    machine_data.service_operationslist sol
INNER JOIN 
    machine_data.operationslist ol
ON 
    sol.OperationID = ol.OperationID

UNION

SELECT 
    sol.OperationID,    
    ol.Operation, 
    'profile_cutting' AS type
FROM 
    machine_data.profile_cuttingoperationslist sol
INNER JOIN 
    machine_data.operationslist ol
ON 
    sol.OperationID = ol.OperationID;

        `;

		misQuery(sqlQuery, (data) => {
			console.log("data", data);
			res.send(data);
		});
	} catch (error) {
		next(error);
	}
});

module.exports = processlistRouter;
