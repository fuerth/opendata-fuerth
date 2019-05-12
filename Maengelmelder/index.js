const path = require('path');
const fs = require('fs-extra');
const csv = require('csvtojson');
const moment = require('moment');

const MAENGEL_FILE = path.join(__dirname, "180124-190510_mangel.csv");
const PUNCHCHART_DATA_FILE = path.join(__dirname, "punchchart.json");
const MONTHLY_USAGE_DATA_FILE = path.join(__dirname, "monthlyusage.json");

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

/**
 * extract punch-card chart data
 * @param {*} reports 
 */
function extractPunchchartData(reports) {
	var dates = reports.map((r) => r.received);
	dates = dates.sort((a,b) => a-b);

	// only use dates within one year
	const minDate = dates[0];
	const maxDate = minDate.clone().add(1, 'year');
	dates = dates.filter(date => date.isBefore(maxDate));
	
	// create two dimentional array [7][24]
	var punchData = new Array(7).fill(0);
	punchData = punchData.map(d => new Array(24).fill(0));

	dates.forEach(date => punchData[date.weekday()][date.hour()]++);

	var chartData = [];
	punchData.forEach((hours, day) => {
		hours.forEach((r, hour) => {
			chartData.push({ 
				x: hour, 
				y: day+1,
				r: r
			});
		})
	})

	return {
		minDate,
		maxDate,
		data: chartData
	};
}

/**
 * extract usage chart data
 * @param {*} reports 
 */
function extractMontlyUsageChartData(reports) {
	var dates = reports.map((r) => r.received);
	dates = dates.sort((a,b) => a-b);

	// only use dates within one year
	const minDate = dates[0];
	const maxDate = minDate.clone().add(1, 'year');
	dates = dates.filter(date => date.isBefore(maxDate));

	// create array on month [12]
	var data = new Array(12).fill(0);
	dates.forEach(date => data[date.month()]++);

	return {
		minDate,
		maxDate,
		data
	};
}

( async () => {

	var reports = await loadReports(MAENGEL_FILE);
	const reportTypes = getReportTypes(reports);
	
	reports = cleanReportData(reports, reportTypes);
	
	var punchChartData = extractPunchchartData(reports);
	await fs.outputJson(PUNCHCHART_DATA_FILE, punchChartData);

	var monthlyUsageData = extractMontlyUsageChartData(reports);
	await fs.outputJson(MONTHLY_USAGE_DATA_FILE, monthlyUsageData);

})()
