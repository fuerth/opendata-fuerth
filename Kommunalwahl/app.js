

function showWordCloud(id, names) {
	var cloud = d3.layout.cloud;
	const width = document.getElementById(id).parentElement.clientWidth*0.9;

	var words = new Map();
	names.forEach(name => words.set(name, words.get(name) ? (words.get(name)+1) : 1));

	var layout = cloud()
		.size([width, width*0.75])
		 .words(Array.from(words.entries()).map(function(data) {
		 	return {text: data[0], size: 20*(data[1]*0.7)};
		 }))
		.padding(1)
		.rotate(function() { return 0; })
		.font("Roboto")
		.fontSize(function(d) { return d.size; })
		.on("end", drawWords);

	function drawWords(words) {
		d3.select(`#${id}`).append("svg")
			.attr("width", layout.size()[0])
			.attr("height", layout.size()[1])
		.append("g")
			.attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
		.selectAll("text")
			.data(words)
		.enter().append("text")
			.style("font-size", function(d) { return d.size + "px"; })
			.style("font-family", "Roboto")
			.attr("text-anchor", "middle")
			.attr("transform", function(d) {
				return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
			})
			.text(function(d) { return d.text; });
	}

	layout.start();
}

window.onload = function() {
	//moment.locale(window.navigator.userLanguage || window.navigator.language);
	moment.locale('de');

	fetch("./names.json")
		.then(response => response.json())
		.then(json => {
			showWordCloud('forenames', json.forenames);
			showWordCloud('surnames', json.surnames);
		});
};
