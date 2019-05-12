var color = Chart.helpers.color;
const RADIUS_FACTOR = 0.75;

function generateData(data) {
	var chartData = [];
	data.forEach((hours, day) => {
		hours.forEach((r, hour) => {
			chartData.push({ 
				x: hour, 
				y: day+1,
				r: r * RADIUS_FACTOR
			});
		})
	})
	return chartData;
}

function drawChart(data) {
	var scatterChartData = {
		datasets: [{
			label: 'Anzahl an Meldungen nach Wochentag und Uhrzeit',
			data: generateData(data)
		}]
	};

	window.punchchart = new Chart(document.getElementById("punchchart"),{
		"type":"bubble",
		"data": scatterChartData,
		options: {
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

window.onload = function() {
	fetch("./punchchart.json")
		.then(response => response.json())
		.then(json => drawChart(json));
};