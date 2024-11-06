/** @format */

const fileRouter = require("express").Router();
// var exists = require("fs-exists-sync");
var createError = require("http-errors");
const fs = require("fs");
const multer = require("multer");
const { copyfiles } = require("../helpers/folderhelper");
// const JSONStream = require("JSONStream");
const path = require("path");
const { misQueryMod } = require("../helpers/dbconn");
const CustomStorageEngine = require("../helpers/storageEngine");

// const basefolder='C:\\Magod\\Jigani';
const basefolder = process.env.FILE_SERVER_PATH;

var storage = new CustomStorageEngine({
	destination: function (req, file, cb) {
		console.log(req.headers["destinationpath"]);
		console.log(basefolder + req.headers["destinationpath"]);
		cb(null, basefolder + req.headers["destinationpath"]);
	},
});

const upload = multer({ storage: storage });

fileRouter.post("/uploaddxf", upload.array("files"), function (req, res, next) {
	console.log(" Upload DXF ");
	console.log(req.files);
	res.send({ status: "success" });
});

fileRouter.post("/getdxf", async (req, res, next) => {
	try {
		const { dxfname } = req.body;
		//  const { frompath } = req.body.frompath;
		//       console.log(dxfname);
		let content = fs.readFileSync("uploads/" + dxfname);
		//    let content = fs.readFileSync(basefolder + "\\" + frompath+"\\" + dxfname);
		res.send(content);
	} catch (error) {
		console.log(error);
		next(error);
	}
});

fileRouter.get("/orddxf", async (req, res, next) => {
	console.log(" Order DXF ");
	try {
		const { dxfName, srcPath } = req.query;
		if (!dxfName) {
			throw createError(400, "DXF Name is required");
		}
		if (!srcPath) {
			throw createError(400, "Source Path is required");
		}
		let basefolder = process.env.FILE_SERVER_PATH;
		// const filePath = path.join(basefolder, srcPath, dxfName);
		let filePath = basefolder + srcPath + dxfName;
		/////////////////////////////////////////////
		// let content = "";
		// fs.readdir(filePath, (err, dxfName) => {
		//     if (err) {
		//         console.error('Error reading the folder:', err);
		//     }

		// if (path.extname(dxfName).toLowerCase() === '.dxf') {
		//     try {
		//     content = fs.readFileSync(filePath, 'utf8');
		//     } catch (error) {
		//         console.log(error);
		//         next(error)
		//     }
		// } else {

		// fs.renameSync("uploads/" + dxfName, filePath);
		// content = fs.readFileSync(filePath, 'utf8');
		// // }
		// res.send(content);
		//  });

		/////////////////////////////////////////////
		console.log("basefolder :", basefolder + srcPath + dxfName);
		console.log(filePath);
		let content = fs.readFileSync(filePath); // basefolder + srcPath + dxfName);
		if (!content) {
			throw createError(404, "DXF not found");
		}
		res.send(content);
	} catch (error) {
		console.log(error);
		next(error);
	}
});

fileRouter.post("/tocopydxfforselected", async (req, res, next) => {
	console.log(" Copy DXF for Selected ");
	try {
		const { OrderNo, Dwglist } = req.body;
		console.log(OrderNo);
		console.log(Dwglist);
		let basefolder = process.env.FILE_SERVER_PATH;
		let basefoldr = basefolder + "\\Wo\\" + OrderNo + "\\DXF\\";

		misQueryMod(
			`SELECT O.Order_No, C.Cust_name,C.DwgLoc FROM magodmis.order_list O
                     INNER JOIN magodmis.cust_data c ON O.Cust_Code = C.Cust_Code
                     Where O.Order_No = '${OrderNo}'`,
			(err, cdata) => {
				if (err) {
					console.log(err);
				} else {
					let custfoldr =
						basefolder + "\\CustDwg\\" + cdata[0].DwgLoc + "\\DXF";
					// If folder exists in custDwg folder
					if (!fs.existsSync(custfoldr)) {
						res.send({
							status: "error",
							message:
								"Customer Drawing Folder does not exist, create it and update in Cust Information",
						});
						return;
					}
					for (let i = 0; i < Dwglist.length; i++) {
						fs.renameSync(
							"uploads/" + Dwglist[i].DwgName,
							basefoldr + Dwglist[i].DwgName
						);
					}
					res.send({ status: "success", message: "Files copied successfully" });
				}
			}
		);
	} catch (error) {
		console.log(error);
		next(error);
	}
});

fileRouter.post("/checkdxf", async (req, res, next) => {
	console.log(" Check Dxf ");
	try {
		//  const { docno, drawfiles } = req.body;
		const docno = req.body.OrderNo;
		// let chkdxf = false;

		//  console.log(req.body.drawfiles);
		let basefolder = process.env.FILE_SERVER_PATH;

		basefolder = basefolder + "\\Wo\\" + docno + "\\DXF\\";

		fs.readdir(basefolder, (err, files) => {
			if (err) {
				console.error("Error reading the folder:", err);
				//    chkdxf = false;
			}

			// Filter the files to find any with the .dxf extension
			const dxfFiles = files.filter(
				(file) => path.extname(file).toLowerCase() === ".dxf"
			);

			// Check if any .dxf files were found
			if (dxfFiles.length > 0) {
				console.log(".dxf files found:", dxfFiles);
				//    chkdxf = true;
			} else {
				console.log("No .dxf files found in the folder.");
				//   chkdxf = false;
			}
			res.send(dxfFiles);
		});
	} catch (error) {
		console.log(error);
		next(error);
	}
});

// Local Copying of DXF files
fileRouter.post("/copydxf", async (req, res, next) => {
	console.log(" Copy Dxf ");
	console.log(req.body.Dwg);
	try {
		let files = req.body.Dwg;
		let destination = req.body.destPath;
		//  console.log(req.body.files[0].);
		// console.log("uploads/" + filename);
		console.log(basefolder + destination);
		let srcfolder = "uploads\\" + files;
		let destdir = basefolder + destination;
		let destfolder = path.join(destdir, files);
		console.log(srcfolder);
		console.log(destfolder);
		fs.copyFile(srcfolder, destfolder, (err) => {
			if (err) {
				console.error("Error during file copy:", err);
				res.status(500).send;
			} else {
				console.log("File copied successfully");
				res.send({ status: "success" });
			}
		});

		// fs.renameSync("uploads\\" + files, basefolder + destination + files); // files[0].DwgName);
		// copyfiles(filename, basefolder + destination + '\\' + filename, (err, result) => {
		//     if (err) {
		//         res.status(500).send(err);
		//         console.log(err);
		//     } else {
		//         res.send({ status: 'success' });
		//     }
		// });
	} catch (error) {
		console.log(error);
		next(error);
	}
});

fileRouter.post("/getfolderfilenames", async (req, res) => {
	console.log(" Get Folder File Names ");
	let filedetails = [];
	try {
		let path = basefolder + req.body.destPath;

		const directoryPath = path; // '/path/to/your/directory';

		// Step 2: Get all file names in the directory
		const files = fs
			.readdirSync(directoryPath, { withFileTypes: true })
			.filter((dirent) => dirent.isFile()) // Only include files, not directories
			.map((dirent) => {
				const filePath = directoryPath + dirent.name;
				const stats = fs.statSync(filePath); // Get file information including size
				return {
					name: dirent.name,
					size: stats.size, // Size in bytes
				};
			});
		// Step 3: Read each file's content (optional)
		files.forEach((file) => {
			const filePath = directoryPath + file.name;
			const content = fs.readFileSync(filePath, "utf8"); // Read the file content
			// console.log(`Content of ${file.name}:`);
			//  console.log(content);
			filedetails = [
				...filedetails,
				{
					name: file.name,
					fcontent: content,
					size: (file.size / 1024).toFixed(2) + " KB",
				},
			];
		});

		res.send(filedetails);
	} catch (error) {
		console.log(error);
		//       next(error);
	}
});

fileRouter.post(`/getfolderfiles`, async (req, res, next) => {
	console.log("getfolderfiles : " + basefolder + req.body.FolderName);
	console.log(req.body);
	try {
		const { FolderName } = req.body;
		let content = fs.readdirSync(basefolder + FolderName);
		res.send(content);
	} catch (error) {
		console.log(error);
		next(error);
	}
});

fileRouter.post("/getdxfnames", async (req, res) => {
	console.log(" Get DXF Names ");
	console.log(req.body);
	let basefolder = process.env.FILE_SERVER_PATH;
	console.log("basefolder : " + basefolder);
	const path = basefolder + req.body.filepath;
	console.log(path);
	let content = fs.readdirSync(path);
	console.log(content);
	res.send({ files: content });
});

fileRouter.get("/orddxf", async (req, res, next) => {
	console.log(" Order DXF ");
	try {
		const { dxfName, srcPath } = req.query;
		if (!dxfName) {
			throw createError(400, "DXF Name is required");
		}
		if (!srcPath) {
			throw createError(400, "Source Path is required");
		}
		let basefolder = process.env.FILE_SERVER_PATH;
		// const filePath = path.join(basefolder, srcPath, dxfName);
		let filePath = basefolder + srcPath + dxfName;
		/////////////////////////////////////////////
		// let content = "";
		// fs.readdir(filePath, (err, dxfName) => {
		//     if (err) {
		//         console.error('Error reading the folder:', err);
		//     }

		// if (path.extname(dxfName).toLowerCase() === '.dxf') {
		//     try {
		//     content = fs.readFileSync(filePath, 'utf8');
		//     } catch (error) {
		//         console.log(error);
		//         next(error)
		//     }
		// } else {

		// fs.renameSync("uploads/" + dxfName, filePath);
		// content = fs.readFileSync(filePath, 'utf8');
		// // }
		// res.send(content);
		//  });

		/////////////////////////////////////////////
		console.log("basefolder :", basefolder + srcPath + dxfName);
		console.log(filePath);
		let content = fs.readFileSync(filePath); // basefolder + srcPath + dxfName);
		if (!content) {
			throw createError(404, "DXF not found");
		}
		res.send(content);
	} catch (error) {
		console.log(error);
		next(error);
	}
});
module.exports = fileRouter;
