var color = Chart.helpers.color;

function getMonthLabels() {
	return (new Array(12).fill(0)).map((m, index) => moment().month(index).format('MMM'));
}

function drawPunchChart(chartData) {
	var scatterChartData = {
		datasets: [{
			label: 'Anzahl an Meldungen nach Wochentag und Uhrzeit',
			data: chartData.data
		}]
	};

	new Chart(document.getElementById("punchchart"), {
		type: 'bubble',
		data: scatterChartData,
		options: {
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

window.onload = function() {
	moment.locale(window.navigator.userLanguage || window.navigator.language);

	fetch("./punchchart.json")
		.then(response => response.json())
		.then(json => drawPunchChart(json));

	fetch("./monthlyusage.json")
		.then(response => response.json())
		.then(json => drawMonthlyUsageChart(json));
};
