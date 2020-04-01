function _resetElementsByIds(ids = []) {
	ids.forEach(id => {
		const elem = document.getElementById(id);
		if (elem) elem.innerText = '';
	});
}

function setCounty(county) {
	if (!county) return _resetElementsByIds(['district_name']);

	window.corona.county = county;
	document.getElementById('district_name').innerText = county.name;
}

function updateCaseData(dataSets) {
	if (!dataSets) return _resetElementsByIds(['infected_new', 'deaths_new', 'immune_new', 'infected_total', 'deaths_total', 'immune_total', 'quarantine_total']);

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
			const elem = document.getElementById('deaths_new');
			if (elem) elem.innerHTML = deaths_new <= 0 ? 
				`<span class="green">-${deaths_new}</span>` : 
				`<span class="red">+${deaths_new}</span>`;
		}

		if (immune_new && immune_new !== 0) {
			const elem = document.getElementById('immune_new');
			if (elem) elem.innerHTML = immune_new <= 0 ? 
				`<span class="green">-${immune_new}</span>` : 
				`<span class="red">+${immune_new}</span>`;
		}
	}

	Array.prototype.forEach.call(document.getElementsByClassName('last_updated'), element => {
		element.innerText = `Letzter Datensatz: ${new Date(data.date_day).toLocaleDateString()}, aktualsiert am ${new Date(data.last_updated).toLocaleString()}`;
	});

	document.getElementById('infected_total').innerText = data.infected_total;
	document.getElementById('deaths_total').innerText = data.deaths_total;

	if (data.immune_total) {
		const elem = document.getElementById('immune_total')
		if (elem) elem.innerText = data.immune_total;
	} else {
		const elem = document.getElementsByClassName('infobox immune_total')[0]
		if (elem) elem.remove();
	}

	if (data.quarantine_total) {
		const elem = document.getElementById('quarantine_total')
		if (elem) elem.innerText = data.quarantine_total;
	} else {
		const elem = document.getElementsByClassName('infobox quarantine_total')[0]
		if (elem) elem.remove();
	}
}

function updateCasesChart(data = []) {
	data = data.map(d => {
		d.date_day = new Date(d.date_day);
		return d;
	}).sort((b, a) => b.date_day - a.date_day);
	const labels = data.map(p => p.date_day);
	const datasets = [];

	const maxInfected = data.reduce((a, d) => Math.max(a, d.infected_total), 0);
	if (maxInfected) {
		datasets.push({
			label: "infiziert",
			stack: 'Stack 0',
			backgroundColor: '#FFA500',
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
			aspectRatio: (window.screen.width > 500 ? 2 : 1),
			scales: {
				xAxes: [{
					type: 'time',
					time: {
						minUnit: 'day',
						max: new Date()
					},
				
				}]
			}
		}
	});
}

function updateDistributionCahrt(data = []) {
	const GROUPS = ["0-4", "5-14", "15-34", "35-59", "60-79", "80+"];
	data = data.sort((b, a) => b.age_group - a.age_group);
	const labels = GROUPS;
	
	// const data_m = data.filter(d => d.gender === 'm');
	// const data_w = data.filter(d => d.gender === 'w');
	// const data_unbekannt = data.filter(d => d.gender === 'unbekannt');

	function pluckFromData(data, gender, field) {
		return GROUPS.map(group => {
			const entry = data.find(d => {
				return d.gender === gender && d.age_group === group
			})
			return entry? entry[field] : 0;
		});
	}

	const sets = [{
		label: "♂️ infiziert",
		stack: 'Stack 0',
		backgroundColor: '#33ccff',
		data: pluckFromData(data, 'm', 'infected_total')
	}, {
		label: "♂️ gestorben",
		stack: 'Stack 0',
		backgroundColor: '#004b66',
		data: pluckFromData(data, 'm', 'deaths_total')
	}, {
		label: "♀️ infiziert",
		stack: 'Stack 1',
		backgroundColor: '#ff00ff',
		data: pluckFromData(data, 'w', 'infected_total')
	}, {
		label: "♀️ gestorben",
		stack: 'Stack 1',
		backgroundColor: '#660066',
		data: pluckFromData(data, 'w', 'deaths_total')
	}, {
		label: "⚥ infiziert",
		stack: 'Stack 2',
		backgroundColor: '#888888',
		data: pluckFromData(data, 'unbekannt', 'infected_total')
	}, {
		label: "⚥ gestorben",
		stack: 'Stack 2',
		backgroundColor: '#333333',
		data:pluckFromData(data, 'unbekannt', 'deaths_total')
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

function updateDistrictSelect(data, ags) {
	const states = data.reduce((acc, d) => {
		if (!acc[d.state]) {
			acc[d.state] = {
				name: d.state,
				districts: [d]
			};
		} else {
			acc[d.state].districts.push(d);
		}
		return acc;
	}, {});

	const $select = document.getElementById('district_select');
	$select.innerHTML = '';

	const stateNames = (Object.keys(states)).sort((a, b) => a.localeCompare(b));
	for (let state of stateNames) {
		const $optgroup = document.createElement('optgroup');
		$optgroup.label = state;

		const districts = (states[state].districts).sort((a, b) => a.gen.localeCompare(b.gen));
		for (let district of districts) {
			const $option = document.createElement('option');
			$option.value = district.ags;
			$option.text = `${district.gen}` + (district.bez.includes('Stadt') ? ` (${district.bez.replace('Kreisfreie Stadt', 'Stadt')})` : '');
			$optgroup.appendChild($option);
		}

		$select.add($optgroup);
	}

	$select.value = ags;

	$select.addEventListener('change', (e) => {
		const value = $select.options[e.target.selectedIndex].value;
		history.replaceState(null, null, `#${value}`);
		window.dispatchEvent(new HashChangeEvent('hashchange'));
	});
}


window.corona = {};

window.onload = function() {
  //moment.locale(window.navigator.userLanguage || window.navigator.language);
	moment.locale("de");
	
	const API_VERSION = 'v0.1';

	function loadCases(ags) {
		setCounty();
		updateCaseData();
		updateCasesChart();
		updateDistributionCahrt()

		fetch(`https://covid19-api-backend.herokuapp.com/api/${API_VERSION}/county/${ags}/`)
		.then(response => response.json())
		.then(json => {

			setCounty(json);

			fetch(`https://covid19-api-backend.herokuapp.com/api/${API_VERSION}/county/${ags}/cases/`)
				.then(response => response.json())
				.then(json => {
					updateCaseData(json)
					updateCasesChart(json);
				});

			fetch(`https://covid19-api-backend.herokuapp.com/api/${API_VERSION}/county/${ags}/gender_age/latest/`)
			.then(response => response.json())
			.then(json => updateDistributionCahrt(json));
		});
	}

	window.corona.ags = location.hash.replace('#','') || '09563';
	loadCases(window.corona.ags);

	fetch(`https://covid19-api-backend.herokuapp.com/api/${API_VERSION}/county/`)
		.then(response => response.json())
		.then(json => updateDistrictSelect(json, window.corona.ags));

	window.addEventListener('hashchange', function() {
		window.corona.ags = location.hash.replace('#','') || '09563';
		loadCases(window.corona.ags);	
	})

	this.setTimeout(() => {
		loadCases(window.corona.ags);
	},1*60*60*1000); // auto-update every hour

};