const fs = require('fs');
const path = require('path');

async function getData() {
	let requests = []
	
	// fetch data using paging 
	const limit = 50;
	for (let i = 0; i < 3; i++) {
		requests = [
			...requests,
			... (await fetch(`https://fragdenstaat.de/api/v1/request/?format=json&public_body=6788&limit=${limit}&offset=${i * limit}`)
				.then(response => response.json())
				.then(response => response.objects))
		];
	}

	const requestData = [];

	for (let request of requests) {
		console.log(request.created_at);

		requestData.push({
			title: request.title,
			created_at: request.created_at,
			due_date: request.due_date,
			resolved_on: request.resolved_on,
			status: request.status,
			costs: request.costs,
			resolution: request.resolution,
		});
	}

	console.log(requestData);
	return requestData;
}

function groupByStatus(requestData) {
	const groupedData = {};
	// create keys for each status
	for (let request of requestData) {
		if (!groupedData[request.status]) {
			groupedData[request.status] = [];
		}
	}

	// push each request into the corresponding status
	for (let request of requestData) {
		groupedData[request.status].push(request);
	}

	return groupedData;
}

(async () => {
	const requestData = await getData();
	fs.writeFileSync(path.join(__dirname, 'requests.json'), JSON.stringify(requestData, null, 2));

	const groupedData = groupByStatus(requestData);
	fs.writeFileSync(path.join(__dirname, 'groupedRequests.json'), JSON.stringify(groupedData, null, 2));
})()
