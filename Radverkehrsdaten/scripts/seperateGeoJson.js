const path = require('path');
const fs = require('fs');
const shapefile = require("shapefile");
const encoding = require("encoding");

const fileName = '../WGS84/Radverkehr_Fuerth_WGS84';

shapefile.read(
	path.resolve(__dirname, fileName + '.shp'),
	path.resolve(__dirname, fileName + '.dbf')
).then(geojson => {
	console.log(geojson);
	geojson = JSON.stringify(geojson, null, 2);
	geojson = encoding.convert(geojson, 'utf-8', 'windows-1252');
	fs.writeFileSync(path.resolve(__dirname, fileName + '.geo.json'), geojson, {
		//encoding: 'utf-8'
		encoding: 'latin1'
	});
}).catch(error => {
	console.error(error.stack);
});