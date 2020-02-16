/**
 * For this to work you need a *.env" file in the save directory 
 * containing the variables:
 * 
 * GOOGLE_SERVICE_ACCOUNT_EMAIL
 * GOOGLE_PRIVATE_KEY
 * 
 * @see https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication?id=service-account
 * 
 */
const fs = require('fs-extra');
const { GoogleSpreadsheet } = require('google-spreadsheet');
require('dotenv').config();

var doc;

async function loadSheet() {
	// spreadsheet key is the long id in the sheets URL
	doc = new GoogleSpreadsheet('1XXZVVtrJVJbPiVGLCeNjvhJkF3DmGKDuWyUd6u0SiTs');
	
	// use service account creds
	await doc.useServiceAccountAuth({
		client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
		private_key: process.env.GOOGLE_PRIVATE_KEY,
	});

	 // loads document properties and worksheets
	await doc.loadInfo();
}

async function checkAllNames() {
	let problems = [];
	for (let sheet of doc.sheetsByIndex) {
		const rows = await sheet.getRows();
		if (sheet == doc.sheetsByIndex[0]) continue;
		const party = sheet.title;
		for (let row of rows) {
			const officialName = row.name;
			const title = row.titel ? row.titel.trim() : '';
			const forename = row.forename;
			const nobel = row.nobel;
			const surname = row.surname + (nobel ? ` ${nobel}` : '');
			const name = `${title} ${surname} ${forename}`.trim();
			if (officialName != name) {
				problems.push({
					officialName,
					name,
					surname,
					party
				});
			}
		}
	}

	if (problems.length) {
		problems.forEach(p => {
			console.warn(`"${p.officialName}" != "${p.name} (${p.party})"`);
		});
	}

	return !!(problems.length);
}

async function getPartyInfos() {
	let info = {}
	const overview = doc.sheetsByIndex[0];
	const rows = await overview.getRows();
	for (let row of rows) {
		party = row.key;
		info[party] = {
			number: parseInt(row.number),
			name: row.name,
			color: row.color,
			logo: row.logo
		}
	}
	return info;
}

async function getAllByFielsname(field) {
	let entries = [];
	for (let sheet of doc.sheetsByIndex) {
		if (sheet == doc.sheetsByIndex[0]) continue;
		const rows = await sheet.getRows();
		n = rows
			.map(r => r[field])
			.filter(f => f && f.length)
			.sort();
		entries.push(...n);
	}
	entries = entries.map(e => e.split(',')).flat();
	entries = entries.map(e => e.trim()).sort();
	return entries;
}

async function getBirthYearsByParty() {
	let entries = [];
	for (let sheet of doc.sheetsByIndex) {
		if (sheet == doc.sheetsByIndex[0]) continue;
		const rows = await sheet.getRows();
		n = rows
			.map(r => r.birthyear)
			.filter(f => f && f.length)
			.sort();
		entries.push({
			party: sheet.title,
			birthyears: n
		});
	}
	return entries;
}

async function getGendersByParty() {
	let entries = [];
	for (let sheet of doc.sheetsByIndex) {
		if (sheet == doc.sheetsByIndex[0]) continue;
		const rows = await sheet.getRows();
		const genders = rows
			.map(r => r.gender)
			.filter(f => f && f.length)
			.map(g => g.toLowerCase())
			.reduce((acc, gender) => {
				acc[gender]++;
				return acc;
			}, { m: 0, w: 0 });
		entries.push({
			party: sheet.title,
			count: rows.length,
			genders
		});
	}

	// gender entries to percentage
	entries = entries.map(e => {
		e.genders.m = (e.genders.m/e.count).toFixed(2);
		e.genders.w = (e.genders.w/e.count).toFixed(2);
		delete e.count;
		return e;
	});

	return entries;
}




(async () => {
	await loadSheet();
	await checkAllNames();

	const parties = await getPartyInfos();
	await fs.writeJSON('parties.json', parties);
	
	const forenames = await getAllByFielsname('forename');
	const surnames = await getAllByFielsname('surname');
	await fs.writeJSON('names.json', {
		forenames, 
		surnames
	});

	const jobs = await getAllByFielsname('job');
	await fs.writeJSON('jobs.json', {
		jobs
	});

	const birthyears = await getBirthYearsByParty();
	await fs.writeJSON('birthyears.json', birthyears);

	const genders = await getGendersByParty();
	await fs.writeJSON('genders.json', genders);

})();
