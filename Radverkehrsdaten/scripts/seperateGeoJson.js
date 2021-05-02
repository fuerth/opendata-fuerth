const path = require('path');
const fs = require('fs-extra');
const shapefile = require("shapefile");
const gk = require('gauss-krueger')

const GEO_TYPE = {
	"WGS84": 'WGS84',
	"GK4": 'GK4',
}

async function genTypesDefinitions(fileName) {
	let geojson = await shapefile.read(
		path.resolve(__dirname, fileName + '.shp'),
		path.resolve(__dirname, fileName + '.dbf'), {
			encoding: 'utf-8'
		}
	);

	const tdFile = path.join(__dirname, '..', 'typesDefinitions.json');
	typesDefinitions = await fs.readJSON(tdFile);

	const TYPES = new Map();
	typesDefinitions.forEach(type => {
		TYPES.set(type.type, type);
	});

	geojson.features.forEach(feature => {
		const Typ = feature.properties.Typ;
		if (!TYPES.has(Typ)) {
			console.log('New type found: ', Typ)
			TYPES.set(Typ, {
				type: Typ,
				color: "#FF00F",
				active: true
			});
		}
	});

	const data = JSON.stringify(Array.from(TYPES.values()), null, 2);
	await fs.writeFile(
		tdFile,
		data
	);
}

async function genGeoJson(fileName, type = GEO_TYPE.WGS84) {
	let geojson = await shapefile.read(
		path.resolve(__dirname, fileName + '.shp'),
		path.resolve(__dirname, fileName + '.dbf'), {
			encoding: 'utf-8'
		}
	);

	geojson.features = geojson.features.map(feature => {
		feature.geometry.coordinates = feature.geometry.coordinates.map(([x, y]) => {
			//console.dir(feature);
			const wgs84 = gk.toWGS({ x, y});
			return [
				wgs84.longitude,
				wgs84.latitude
			];
		});
		return feature;
	});

	geojson = JSON.stringify(geojson, null, 2);
	await fs.outputFile(
		path.resolve(__dirname, fileName + '.geo.json'), 
		geojson
	);
};

(async () => {
	try {
		await genTypesDefinitions('../GK4/Radverkehr_Fuerth_GK4');

		//await genGeoJson('../WGS84/Radverkehr_Fuerth', GEO_TYPE.WGS84);
		await genGeoJson('../GK4/Radverkehr_Fuerth_GK4', GEO_TYPE.GK4);
	} catch(err) {
		console.error(err);
	}
})();
