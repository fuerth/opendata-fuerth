function setCounty(county) {
	window.corona.county = county;
	document.getElementById('district_name').innerText = county.name;
}

function updateCaseData(dataSets) {
	const data = dataSets[0];
	if (dataSets.length > 1) {
		const dataLastDay = dataSets[1];
		const infected_new = data.infected_total - dataLastDay.infected_total;
		const deaths_new = data.deaths_total - dataLastDay.deaths_total;
		const immune_new = data.immune_total - dataLastDay.immune_total;
		
		if (infected_new && infected_new !== 0) {
			document.getElementById('infected_new').innerHTML = 
			infected_new <= 0 ? 
				`<span class="green">-${infected_new}</span>` : 
				`<span class="red">+${infected_new}</span>`;
		}

		if (deaths_new && deaths_new !== 0) {
			document.getElementById('deaths_new').innerHTML = 
			deaths_new <= 0 ? 
				`<span class="green">-${deaths_new}</span>` : 
				`<span class="red">+${deaths_new}</span>`;
		}

		if (immune_new && immune_new !== 0) {
			document.getElementById('immune_new').innerHTML = 
			immune_new <= 0 ? 
				`<span class="green">-${immune_new}</span>` : 
				`<span class="red">+${immune_new}</span>`;
		}
	}

	Array.prototype.forEach.call(document.getElementsByClassName('last_updated'), element => {
		element.innerText = `Letztes Update am ${new Date(data.last_updated).toLocaleString()}`;
	});

	document.getElementById('infected_total').innerText = data.infected_total;
	document.getElementById('deaths_total').innerText = data.deaths_total;

	if (data.immune_total) {
		document.getElementById('immune_total').innerText = data.immune_total;
	} else {
		(document.getElementsByClassName('infobox immune_total')[0]).remove();
	}

	if (data.quarantine_total) {
		document.getElementById('quarantine_total').innerText = data.quarantine_total;
	} else {
		(document.getElementsByClassName('infobox quarantine_total')[0]).remove();
	}
}

function updateCasesCahrt(data) {
	data = data.map(d => {
		d.date_day = new Date(d.date_day);
		return d;
	}).sort((b, a) => b.date_day - a.date_day);
	const labels = data.map(p => p.date_day.toLocaleDateString());
	const datasets = [];

	const maxInfected = data.reduce((a, d) => Math.max(a, d.infected_total), 0);
	if (maxInfected) {
		datasets.push({
			label: "infiziert",
			stack: 'Stack 0',
			backgroundColor: '#ff9900',
			data: data.map(d => d.infected_total)
		});
	}

	const maxdeaths = data.reduce((a, d) => Math.max(a, d.deaths_total), 0);
	if (maxdeaths) {
		datasets.push({
			label: "gestorben",
			stack: 'Stack 0',
			backgroundColor: '#000000',
			data: data.map(d => d.deaths_total)
		});
	}

	// const maxImmune = data.reduce((a, d) => Math.max(a, d.immune_total), 0);
	// if (maxImmune) {
	// 	datasets.push({
	// 		label: "immunisiert",
	// 		//stack: 'Stack 0',
	// 		backgroundColor: '#00FF00',
	// 		data: data.map(d => d.immune_total)
	// 	});
	// }

	new Chart(document.getElementById("cases_chart"), {
		type: "bar",
		data: {
			labels,
			datasets
		},
		options: {
			aspectRatio: (window.screen.width > 500 ? 2 : 1)
		}
	});
}

function updateDistributionCahrt(data) {
	data = data.sort((b, a) => b.age_group - a.age_group);
	const labels = [...(new Set(data.map(p => p.age_group)))];
	
	const data_m = data.filter(d => d.gender === 'm');
	const data_w = data.filter(d => d.gender === 'w');
	const data_unbekannt = data.filter(d => d.gender === 'unbekannt');

	const sets = [{
		label: "♂️ infiziert",
		stack: 'Stack 0',
		backgroundColor: '#33ccff',
		data: data_m.map(d => d.infected_total)
	}, {
		label: "♂️ gestorben",
		stack: 'Stack 0',
		backgroundColor: '#004b66',
		data: data_m.map(d => d.deaths_total)
	}, {
		label: "♀️ infiziert",
		stack: 'Stack 1',
		backgroundColor: '#ff00ff',
		data: data_w.map(d => d.infected_total)
	}, {
		label: "♀️ gestorben",
		stack: 'Stack 1',
		backgroundColor: '#660066',
		data: data_w.map(d => d.deaths_total)
	}, {
		label: "? infiziert",
		stack: 'Stack 2',
		backgroundColor: '#888888',
		data: data_unbekannt.map(d => d.infected_total)
	}, {
		label: "? gestorben",
		stack: 'Stack 2',
		backgroundColor: '#333333',
		data: data_unbekannt.map(d => d.deaths_total)
	}];

	const datasets = sets.filter(s => Math.max(...s.data) > 0);

	new Chart(document.getElementById("distribution_chart"), {
		type: "bar",
		data: {
			labels,
			datasets
		},
		options: {
			aspectRatio: (window.screen.width > 500 ? 2 : 1)
		}
	});
}

window.corona = {};

window.onload = function() {
  //moment.locale(window.navigator.userLanguage || window.navigator.language);
  moment.locale("de");

	const AGS = location.hash.replace('#','') || '09563';

	function loadCases() {
		// fetch(`https://covid19-api-backend.herokuapp.com/api/v0.1/county/${AGS}/cases/latest/`)
		// 	.then(response => response.json())
		// 	.then(json => updateCaseData(json));

		fetch(`https://covid19-api-backend.herokuapp.com/api/v0.1/county/${AGS}/cases/`)
			.then(response => response.json())
			.then(json => {
				updateCaseData(json)
				updateCasesCahrt(json);
			});

		fetch(`https://covid19-api-backend.herokuapp.com/api/v0.1/county/${AGS}/gender_age/latest/`)
			.then(response => response.json())
			.then(json => updateDistributionCahrt(json));
	}

	fetch(`https://covid19-api-backend.herokuapp.com/api/v0.1/county/${AGS}/`)
	.then(response => response.json())
	.then(json => {
		setCounty(json);
		loadCases();
	});

};