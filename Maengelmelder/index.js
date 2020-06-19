const path = require('path');
const fs = require('fs-extra');
const csv = require('csvtojson');
const moment = require('moment');

const DATE_TIME_FORMAT = 'DD.MM.YYYY HH:mm:ss';

// const REPORTS_FILE = path.join(__dirname, "180124-190510_mangel.csv");
// const REPORTS_STATUS_FILE = path.join(__dirname, "180124-190510_mangel_protokoll.csv");

//const REPORTS_FILE = path.join(__dirname, "180124-190711_mangel.csv");
//const REPORTS_STATUS_FILE = path.join(__dirname, "180125-190711_mangel_protokoll.csv");

// const REPORTS_FILE = path.join(__dirname, "180124-190711_mangel_with_geo.csv");
// const REPORTS_STATUS_FILE = path.join(__dirname, "180125-190711_mangel_protokoll_with_geo.csv");

const REPORTS_FILE = path.join(__dirname, "180501-200616_mangel.csv");
const REPORTS_STATUS_FILE = path.join(__dirname, "180501-200616_mangel_protokoll.csv");

/**
 * Load CSV file and return CSV
 * @param {*} filename 
 */
async function loadCSV(filename) {
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
 */
function cleanReportsData(reports) {
	return reports.map((report) => {
		report.received = moment(report.received, DATE_TIME_FORMAT);
		return report;
	});
}

/**
 * 1. Convert date into moment object
 * @param {*} reportsStates 
 */
function cleanReportStatesData(reportsStates) {
	return reportsStates.map((report) => {
		report.date = moment(report.date, DATE_TIME_FORMAT);
		return report;
	});
}

/**
 * Ddd additional report status infomation (finished shate)
 * @param {*} reports 
 * @param {*} reportTypes 
 * @param {*} reportsStates
 */
function extendReportData(reports, reportTypes, reportsStates) {
	return reports.map((report) => {
		report.type = reportTypes.indexOf(report.description);
		delete report.description;

		// delete the state; ist the state while the data was extracted; not usefull here.
		delete report.state;

		const STARTED_STATE = "In Bearbeitung";
		const FINISHED_STATE = "Behoben";
		const CANCLED_STATE = "Abgelehnt";

		reportState = {
			started: reportsStates.find(s => s.id === report.id && s.state === STARTED_STATE),
			finished: reportsStates.find(s => s.id === report.id && s.state === FINISHED_STATE),
			cancled: reportsStates.find(s => s.id === report.id && s.state === CANCLED_STATE),
		}
		
		if (reportState.started) {
			report.started = moment(reportState.started.date, DATE_TIME_FORMAT);
		}
		if (reportState.finished) {
			report.finished = moment(reportState.finished.date, DATE_TIME_FORMAT);
		}
		if (reportState.cancled) {
			report.cancled = moment(reportState.cancled.date, DATE_TIME_FORMAT);
		}

		return report;
	});
}

/**
 * Reduce the dataset to e.g. only one year.
 *
 * @param {*} reports
 * @returns
 */
function filterReportData(reports) {
	reports = reports.sort((a, b) => a.received - b.received);

	const min = (reports[0]).received;
	const maxFilter = min.clone().add(2, 'year');
	
	reports = reports.filter(r => r.received < maxFilter);
	return reports;
}


/**
 * Statistical data
 * @param {*} reports
 */
function extractStatisticsData(reports) {
	reports = reports.sort((a, b) => a.received - b.received);
	const minDate = (reports[0]).received;
	const maxDate = (reports[reports.length-1]).received;
	
	var statistics = [];
	
	const years = maxDate.diff(minDate, 'years');
	statistics.push({
		description: "Meldungen pro Jahr (Durchschnitt)",
		value: (reports.length / years).toFixed(0)
	});

	const days = maxDate.diff(minDate, 'days');
	statistics.push({
		description: "Meldungen pro Tag (Durchschnitt)",
		value: (reports.length / days).toFixed(1)
	});

	durations = reports.map(r => {
		return r.started ? r.started.diff(r.received, 'hours') : null;
	}).filter(d => d);

	//console.log(durations);

	statistics.push({
		description: "Durchschnittliche Zeitspanne von Meldung bis Bearbeitung",
		value: (durations.reduce( ( p, c ) => p + c, 0 ) / durations.length).toFixed(1) + ' Stunden'
	});

	statistics.push({
		description: "Minimale Bearbeitungszeit von Meldung bis Bearbeitung",
		value: (Math.min(...durations)).toFixed(1) + ' Stunden'
	});

	statistics.push({
		description: "Maximale Bearbeitungszeit von Meldung bis Bearbeitung",
		value: (Math.max(...durations) / 24).toFixed(1) + ' Stunden'
	});

	return statistics;
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
	const maxDate = dates[dates.length-1];
	
	// create two dimentional array [7][24]
	var punchData = new Array(7).fill(0);
	punchData = punchData.map(d => new Array(24).fill(0));

	var maxValue = 0;
	dates.forEach(date => {
		value = ++punchData[date.weekday()][date.hour()];
		maxValue = maxValue > value ? maxValue : value;
	});

	var chartData = [];
	punchData.forEach((hours, day) => {
		hours.forEach((value, hour) => {
			chartData.push({ 
				x: hour, 
				y: day+1,
				value: value / maxValue
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
	const maxDate = dates[dates.length-1];

	// create array on month [12]
	var data = new Array(12).fill(0);
	dates.forEach(date => data[date.month()]++);

	return {
		minDate,
		maxDate,
		data
	};
}

/**
 * TODO:
 *
 * @param {*} reports
 * @param {*} reportTypes
 */
function extractReportTypeChartData(reports, reportTypes) {
	var dates = reports.map((r) => r.received);
	dates = dates.sort((a,b) => a-b);

	// only use dates within one year
	const minDate = dates[0];
	const maxDate = dates[dates.length-1];

	var types = [];
	reportTypes.forEach(type => types.push({
		type,
		reports: 0
	}));

	reports.forEach(report => (types[report.type]).reports++);

	return {
		minDate,
		maxDate,
		data: types
	};
}

/**
 * TODO:
 *
 * @param {*} reports
 * @param {*} reportTypes
 */
function extractGeoData(reports, reportTypes) {
	//console.log(reports);
	console.log(reportTypes);

	geoData = [];

	reportTypes.forEach(function(type, index) {
		var data = reports.filter(function(report) {
			return report.type === index;
		}).map(function(report) {
			return report.geo.split(',');
		});
		geoData.push({
			type,
			index,
			data,
			count: data.length
		});
	});
	//console.log(geoData);
	return geoData;
}

( async () => {

	var reports = await loadCSV(REPORTS_FILE);
	reports = cleanReportsData(reports);

	var reportsStates = await loadCSV(REPORTS_STATUS_FILE);
	reportsStates = cleanReportStatesData(reportsStates);

	const reportTypes = getReportTypes(reports);

	reports = extendReportData(reports, reportTypes, reportsStates);
	reports = filterReportData(reports);

	//console.log(reports);

	var statisticsData = extractStatisticsData(reports);
	await fs.outputJson(path.join(__dirname, "statistics.json"), statisticsData);
	
	var punchChartData = extractPunchchartData(reports);
	await fs.outputJson(path.join(__dirname, "punchchart.json"), punchChartData);

	var monthlyUsageData = extractMontlyUsageChartData(reports);
	await fs.outputJson(path.join(__dirname, "monthlyusage.json"), monthlyUsageData);

	var reportTypesData = extractReportTypeChartData(reports, reportTypes);
	await fs.outputJson(path.join(__dirname, "reporttypes.json"), reportTypesData);

	var geoData = extractGeoData(reports, reportTypes);
	await fs.outputJson(path.join(__dirname, "geodata.json"), geoData);

})()
