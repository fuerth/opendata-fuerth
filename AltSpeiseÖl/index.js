

function showStatistics(altspeiseoelData) {
  const oilData = altspeiseoelData.oil.data
	const $dl = document.getElementById('statistics');
  $dl.innerHTML = '';
	
	oilData.forEach(d => {
    const formatter = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 })

		var $dt = document.createElement('dt');
    const label = `${d.start} - ${d.end}`;
		$dt.appendChild(document.createTextNode(label));
		$dl.appendChild($dt);
	
		var $dd = document.createElement('dd');
		const value = `${formatter.format(d.value)} ${d.unit} (${formatter.format(d.value/d.month)} ${d.unit} / Monat)`;
		$dd.appendChild(document.createTextNode(value));
		$dl.appendChild($dd);
	});
}

function updateTimeframe(altspeiseoelData) {
	var $timeframe = document.getElementById("timeframe");
  
  const oilData = altspeiseoelData.oil.data;
  const minDate = moment.min(...oilData.map(d => moment(d.start, 'MM.YYYY')));
  const maxDate = moment.max(...oilData.map(d => moment(d.end, 'MM.YYYY')));
  const timeframeText = `Zeitraum: ${minDate.format('MM.YYYY')} - ${maxDate.format('MM.YYYY')}`
	
  $timeframe.innerHTML = timeframeText;
}

window.onload = function() {
	//moment.locale(window.navigator.userLanguage || window.navigator.language);
	moment.locale('de');

	fetch("./altspeiseoel.json")
		.then(response => response.json())
		.then(json => {
      showStatistics(json);
      updateTimeframe(json);
  });
};
