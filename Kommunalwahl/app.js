const seatCount = 50; //TODO: this should be loaded
var PARTIES = {};

function getColorForParty(name) {
	party = PARTIES[name];
	if (party && party.color) {
		return party.color;
	}
	console.debug(PARTIES);
	console.warn(`party not found "${name}"`);
	return '#CCC';
}

function setParties(parties) {
	PARTIES = parties;
}

function showWordCloud(id, names) {
	var cloud = d3.layout.cloud;
	const width = document.getElementById(id).parentElement.clientWidth;
	const height = width > 500 ? width*0.5 : width;

	var words = new Map();
	names.forEach(name =>
		words.set(name, words.get(name) ? words.get(name) + 1 : 1)
	);

	const maxLength = Math.max(...Array.from(words.keys()).map(s => s.length));

	function fillColor(d ,i) {
		return `rgba(0, 0, 0, ${1.3-(d.text.length/maxLength)})`;
	}

	var layout = cloud()
		.size([width, height])
		.words(
			Array.from(words.entries()).map(function(data) {
				return { text: data[0], size: 8+(data[1]*6) };
			})
		)
		.padding(1)
		.rotate(function() {
			return 0;
		})
		.font("Roboto")
		.fontSize(function(d) {
			return d.size;
		})
		.on("end", drawWords);

	function drawWords(words) {
		d3.select(`#${id}`)
			.append("svg")
			.attr("width", layout.size()[0])
			.attr("height", layout.size()[1])
			.append("g")
			.attr(
				"transform",
				"translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")"
			)
			.selectAll("text")
			.data(words)
			.enter()
			.append("text")
			.style("font-size", function(d) {
				return d.size + "px";
			})
			.style("font-family", "Roboto")
			.style("fill", fillColor)
			.attr("text-anchor", "middle")
			.attr("transform", function(d) {
				return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
			})
			.text(function(d) {
				return d.text;
			});
	}

	layout.start();
}

function drawAgeChart(chartData) {
	const labels = [
		'<20',
		'20-29',
		'30-39',
		'40-49',
		'50-59',
		'60-69',
		'70-79',
		'>80',
	];

	const currentYear = (new Date()).getFullYear();
	const datasets = chartData.map(dataset => {
		const data = dataset.birthyears.reduce((accumulator, currentValue) => {
			const age = currentYear-currentValue;
			if (age <= 19) {
				accumulator[0]++;
			} else if (age <= 29) {
				accumulator[1]++;
			} else if (age <= 39) {
				accumulator[2]++;
			} else if (age <= 49) {
				accumulator[3]++;
			} else if (age <= 59) {
				accumulator[4]++;
			} else if (age <= 69) {
				accumulator[5]++;
			} else if (age <= 79) {
				accumulator[6]++;
			} else {
				accumulator[7]++;
			}
			return accumulator;
		}, [0, 0, 0, 0, 0, 0, 0, 0]);

		return {
			label: dataset.party,
			backgroundColor: getColorForParty(dataset.party),
			//data: [ 2, 4, 6, 8, 9, 3 , 2, 0 ]
			data
		}
	});

	new Chart(document.getElementById("age"), {
		type: "bar",
		data: {
			labels,
			datasets
		},
		options: {
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

function drawGenderChart(chartData) {
	const labels = chartData.map(p => p.party);
	const datasets = [{
		label: "Mann",
		backgroundColor: '#4B0082',
		data: chartData.map(dataset => dataset.genders.m*100)
	}, {
		label: "Frau",
		backgroundColor: '#BA55D3',
		data: chartData.map(dataset => dataset.genders.w*100)
	}];

	new Chart(document.getElementById("gender"), {
		type: "bar",
		data: {
			labels,
			datasets
		},
		options: {
			scales: {
				xAxes: [{
					stacked: true,
				}],
				yAxes: [{
					stacked: true
				}]
			},
			annotation: {
				annotations: [{
					drawTime: "afterDatasetsDraw",
					id: "hline",
					type: "line",
					mode: "horizontal",
					scaleID: "y-axis-0",
					value: 50,
					borderColor: "gray",
					borderWidth: 3
				}]
			}
		}
	});
}

window.onload = function() {
  //moment.locale(window.navigator.userLanguage || window.navigator.language);
  moment.locale("de");

	function loadData() {
		fetch("./genders.json")
		.then(response => response.json())
		.then(json => drawGenderChart(json));

	fetch("./birthyears.json")
		.then(response => response.json())
		.then(json => drawAgeChart(json));

	fetch("./jobs.json")
		.then(response => response.json())
		.then(json => showWordCloud("jobs", json.jobs));

	fetch("./names.json")
		.then(response => response.json())
		.then(json => {
			showWordCloud("forenames", json.forenames);
			//showWordCloud("surnames", json.surnames);
		});
	}

	fetch("./parties.json")
		.then(response => response.json())
		.then(json => {
			setParties(json);
			loadData();
		});
};
