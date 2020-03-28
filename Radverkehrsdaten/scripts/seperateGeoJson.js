const path = require('path');
const fs = require('fs-extra');
const shapefile = require("shapefile");
const encoding = require("encoding");

async function genGeoJson(fileName) {
	let geojson = await shapefile.read(
		path.resolve(__dirname, fileName + '.shp'),
		path.resolve(__dirname, fileName + '.dbf')
	);
	//console.log(geojson);
	//geojson = encoding.convert(geojson, 'utf-8', 'windows-1252');
	geojson = JSON.stringify(geojson, null, 2);
	await fs.outputFile(
		path.resolve(__dirname, fileName + '.geo.json'), 
		geojson
	);
};

(async () => {
	try {
		await genGeoJson('../WGS84/Radverkehr_Fuerth_WGS84');
		//genGeoJson('../GK4/Radverkehr_Fuerth_GK4');
	} catch(err) {
		console.error(err);
	}
})();
