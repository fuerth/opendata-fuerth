
function getColorForParty(party) {
	switch (party.toUpperCase()) {
		case "CSU": return '#000000';
		case "GRÜNE": return '#1fa15d';
		case "FREIE WÄHLER": return '#FF8C00';
		case "AFD": return '#009fe1';
		case "SPD": return '#A20067';
		case "FDP": return '#FFED00';
		case "DIE LINKE": return '#E3000F';
		default: return '#CCC';
	}
}

function showWordCloud(id, names) {
  var cloud = d3.layout.cloud;
  const width = document.getElementById(id).parentElement.clientWidth * 0.9;

  var words = new Map();
  names.forEach(name =>
    words.set(name, words.get(name) ? words.get(name) + 1 : 1)
  );

  var layout = cloud()
    .size([width, width * 0.75])
    .words(
      Array.from(words.entries()).map(function(data) {
        return { text: data[0], size: 20 * (data[1] * 0.7) };
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

window.onload = function() {
  //moment.locale(window.navigator.userLanguage || window.navigator.language);
  moment.locale("de");

	fetch("./names.json")
		.then(response => response.json())
		.then(json => {
			showWordCloud("forenames", json.forenames);
			showWordCloud("surnames", json.surnames);
		});

	fetch("./jobs.json")
		.then(response => response.json())
		.then(json => showWordCloud("jobs", json.jobs));

	fetch("./birthyears.json")
		.then(response => response.json())
		.then(json => drawAgeChart(json));
};
