const COLOR_SCHEME = 'tableau.HueCircle19';

const SCREEN_WIDTH = window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth;

function getMonthLabels() {
	return (new Array(12).fill(0)).map((m, index) => moment().month(index).format('MMM'));
}

function showStatistics(data) {
	const $dl = document.getElementById('statistics');
	
	data.forEach(d => {
		var $dt = document.createElement('dt');
		$dt.appendChild(document.createTextNode(d.description));
	
		var $dd = document.createElement('dd');
		$dd.appendChild(document.createTextNode(d.value));
		
		$dl.appendChild($dt);
		$dl.appendChild($dd);
	});
}

function drawPunchChart(chartData) {

	const MAX_RADIUS = SCREEN_WIDTH/50;

	var data = chartData.data.map(d => {
		d.r = d.value * MAX_RADIUS;
		delete d.value;
		return d;
	})

	var scatterChartData = {
		datasets: [{
			label: 'Anzahl an Meldungen nach Wochentag und Uhrzeit',
			data: data
		}]
	};

	new Chart(document.getElementById("punchchart"), {
		type: 'bubble',
		data: scatterChartData,
		options: {
			plugins: {
				colorschemes: {
					scheme: COLOR_SCHEME
				}
			},
			legend: { 
				display: false 
			},
			title: {
				display: true,
				text: `Usage (${moment(chartData.minDate).format('LL')} - ${moment(chartData.maxDate).format('LL')})` 
			},
			scales: {
				xAxes: [{
					ticks: {
						min: 0,
						max: 24,
						stepSize: 1
					}
				}],
				yAxes: [{
					ticks: {
						min: 0,
						max: 8,
						callback: function(value, index, values) {
							return (value > 0 && value < 8) ? moment().weekday(value).format('dddd') : '';
						}
					}
				}]
			}
		}
	});
}

function drawMonthlyUsageChart(chartData) {
	new Chart(document.getElementById("monthlyusage"), {
		type: 'bar',
		data: {
			labels: getMonthLabels(),
			datasets: [{
				data: chartData.data
			}]
		},
		options: {
			plugins: {
				colorschemes: {
					scheme: COLOR_SCHEME
				}
			},
			legend: { 
				display: false 
			},
			title: {
				display: true,
				text: `Usage (${moment(chartData.minDate).format('LL')} - ${moment(chartData.maxDate).format('LL')})` 
			},
			xAxes: [{
				ticks: {
					callback: function(value, index, values) {
						return moment().month(value).format('mmm');
					}
				}
			}]
		}
	});
}

function drawReportTypesChart(reporttypes) {
	const types = reporttypes.data
	new Chart(document.getElementById("reporttypes"), {
		type: 'pie',
		data: {
			labels: types.map(d => d.type),
			datasets: [{
				data:  types.map(d => d.reports)
			}]
		},
		options: {
			plugins: {
				colorschemes: {
					scheme: COLOR_SCHEME
				}
			},
			title: {
				display: true,
				text: `Report Typen (${moment(reporttypes.minDate).format('LL')} - ${moment(reporttypes.maxDate).format('LL')})`
			},
			legend: { 
				display: false 
			}
		}
	});
}

function updateTimeframe(reporttypes) {
	var elem = document.getElementById("timeframe")
	elem.innerHTML = `Zeitraum: ${moment(reporttypes.minDate).format('LL')} - ${moment(reporttypes.maxDate).format('LL')}`;
}

window.onload = function() {
	//moment.locale(window.navigator.userLanguage || window.navigator.language);
	moment.locale('de');

	fetch("./statistics.json")
		.then(response => response.json())
		.then(json => showStatistics(json));

	fetch("./punchchart.json")
		.then(response => response.json())
		.then(json => drawPunchChart(json));

	fetch("./monthlyusage.json")
		.then(response => response.json())
		.then(json => drawMonthlyUsageChart(json));

	fetch("./reporttypes.json")
		.then(response => response.json())
		.then(json => {
			drawReportTypesChart(json)
			updateTimeframe(json)
		});
};
