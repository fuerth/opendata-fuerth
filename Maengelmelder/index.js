const path = require('path');
const fs = require('fs-extra');
const csv = require('csvtojson');
const moment = require('moment');

const MAENGEL_FILE = path.join(__dirname, "180124-190510_mangel.csv");
const PUNCHCHART_DATA_FILE = path.join(__dirname, "punchchart.json");

/**
 * Load CSV file and return CSV
 * @param {*} filename 
 */
async function loadReports(filename) {
	return csv({
		delimiter: ';'
	}).fromFile(filename);
}

/**
 * Extract all type of records (e.g. "Parkverstöße")
 * @param {*} reports 
 */
function getReportTypes(reports) {
	var types = new Set();
	reports.forEach(report => types.add(report.description));
	return Array.from(types).sort();
}

/**
 * 1. Replace description with type
 * 2. Convert date into moment object
 * @param {*} reports 
 * @param {*} reportTypes 
 */
function cleanReportData(reports, reportTypes) {
	return reports.map((report) => {
		report.type = reportTypes.indexOf(report.description);
		delete report.description;
		report.received = moment(report.received, 'DD.MM.YYYY HH:mm:ss');
		return report;
	});
}

function extractPunchchartData(reports) {
	const dates = reports.map((r) => r.received);
	
	// create two dimentional array [7][24]
	var punchData = new Array(7).fill(0);
	punchData = punchData.map(d => new Array(24).fill(0));

	dates.forEach(date => punchData[date.weekday()][date.hour()]++);
	return punchData;
}

( async () => {

	var reports = await loadReports(MAENGEL_FILE);
	const reportTypes = getReportTypes(reports);
	
	reports = cleanReportData(reports, reportTypes);
	
	var punchChartData = extractPunchchartData(reports);
	await fs.outputJson(PUNCHCHART_DATA_FILE, punchChartData);

})()
