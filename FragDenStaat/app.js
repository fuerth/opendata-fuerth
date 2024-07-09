function drawBarChart(requests, chartData) {
	// get first date of the results
	const firstDate = requests[0].created_at.split("-").slice(0, 2).join("-");

	// group data by month
	const dataByMonth = {};
	requests.forEach(r => {
		const month = r.created_at.split("-").slice(0, 2).join("-");
		if (!dataByMonth[month]) {
			dataByMonth[month] = {
				asleep: 0,
				awaiting_response: 0,
				resolved: 0
			};
		}
		dataByMonth[month][r.status] += 1;
	});

	// get an array of all months from now to firstDate
	const labels = [];
	let date = new Date();
	while (date.toISOString().split("-").slice(0, 2).join("-") >= firstDate) {
		labels.push(date.toISOString().split("-").slice(0, 2).join("-"));
		date.setMonth(date.getMonth() - 1);
	}
	labels.reverse();
	
	const datasets = [
		{
			label: "asleep",
			backgroundColor: '#gray',
			data: labels.map(month => dataByMonth[month] ? dataByMonth[month].asleep : null)
		},
		{
			label: "awaiting_response",
			backgroundColor: 'orange',
			data: labels.map(month => dataByMonth[month] ? dataByMonth[month].awaiting_response : null)
		},
		{
			label: "resolved",
			backgroundColor: 'green',
			data: labels.map(month => dataByMonth[month] ? dataByMonth[month].resolved : null)
		}
	];

	new Chart(document.getElementById("requests"), {
		type: "bar",
		data: {
			labels,
			datasets
		},
		options: {
			aspectRatio: (window.screen.width > 500 ? 2 : 1),
			scales: {
				xAxes: [{
					stacked: true,
				}],
				yAxes: [{
					stacked: true
				}]
			}
		}
	});
}

window.onload = async function() {
	let requests = await fetch("./requests.json").then(response => response.json());
	console.log(requests);

	requests = requests.sort((a, b) => a.created_at.localeCompare(b.created_at));
	const lastDate = requests[requests.length-1].created_at.split("T")[0];
	document.getElementById("timeframe").innerHTML = `Daten bis zum ${lastDate}`;

	drawBarChart(requests);
};