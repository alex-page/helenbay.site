// Check what level the user is up to and set up the game
const quests = document.querySelectorAll('.quest');
const sidebar = document.querySelector('aside');
const map = document.querySelector('#map');

const markers = [];
let googleMap;

if (localStorage.getItem('currentLevel') === 'winner'){
	quests.forEach(quest => {
		quest.classList.remove('quest--locked');
		quest.classList.add('quest--done');
	});
} else if (localStorage.getItem('currentLevel')) {
	// Load the current game
	const task = document.getElementById(localStorage.getItem('currentLevel'));
	const currentQuest = task.closest('.quest');
	currentQuest.classList.remove('quest--locked');
	currentQuest.classList.add('quest--active');
	task.classList.remove('task--locked');
	task.classList.add('task--active');

	let previousTask = task.previousSibling;
	while (previousTask) {
		previousTask.classList.add('task--done');
		previousTask.classList.remove('task--locked');
		previousTask = previousTask.previousSibling;
	}

	let previousQuest = currentQuest.previousSibling;
	while (previousQuest.classList.contains('quest')) {
		previousQuest.classList.add('quest--done');
		previousQuest.classList.remove('quest--locked');
		previousQuest = previousQuest.previousSibling;
	}
} else {
	// Set up a new game
	const tasks = quests[0].querySelectorAll('.task');
	localStorage.setItem('currentLevel', tasks[0].id);

	quests[0].classList.remove('quest--locked');
	quests[0].classList.add('quest--active');
	tasks[0].classList.remove('task--locked');
	tasks[0].classList.add('task--active');
}

// Show the sidebar once the levels are loaded
sidebar.classList.remove('loading');

const getMeters = (lat1, lon1, lat2, lon2) => {
	const p = 0.017453292519943295; // Math.PI / 180
	const c = Math.cos;
	const a = 0.5 - c((lat2 - lat1) * p) / 2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p)) / 2;

	return (12742 * Math.asin(Math.sqrt(a))) * 1000; // 2 * R; R = 6371 km
};

const completeTask = () => {
	const completedTask = document.getElementById(localStorage.getItem('currentLevel'));
	completedTask.classList.remove('task--active');
	completedTask.classList.add('task--done');

	const nextTask = completedTask.nextSibling;
	if (nextTask) {
		nextTask.classList.remove('task--locked');
		nextTask.classList.add('task--active');
		localStorage.setItem('currentLevel', nextTask.id);
	} else {
		setTimeout(() => {
			const parentQuest = completedTask.closest('.quest');
			completeQuest(parentQuest);
		}, 500);
	}
};

const completeGame = () => {
	confettiLoop();
	const completedMessage = document.querySelector('.completed-game');
	completedMessage.style.display = 'block';
	localStorage.setItem('currentLevel', 'winner');
	const answers = [...document.querySelectorAll('.task')]
		.map(task => task.id);

	// Drop markers on quest end
	let mapLoctions = answers.splice(0, answers.length - 1);
	const markers = [];
	mapLoctions.forEach(location => {
		const [lat, lng] = location.split('_').map(i => Number.parseFloat(i));
		markers.push(new google.maps.Marker({
			position: {lat, lng},
			animation: google.maps.Animation.DROP,
			map: googleMap
		}));
	});
}

const completeQuest = parentQuest => {
	parentQuest.classList.add('quest--done');
	parentQuest.classList.remove('quest--active');

	const nextQuest = parentQuest.nextSibling;
	if (nextQuest) {
		nextQuest.classList.add('quest--active');
		nextQuest.classList.remove('quest--locked');
		const nextTask = nextQuest.querySelector('.task');
		nextTask.classList.add('task--active');
		nextTask.classList.remove('task--locked');
		localStorage.setItem('currentLevel', nextTask.id);
	} else {
		completeGame();
	}
};

const checkLocation = mapEvent => {
	if (localStorage.getItem('currentLevel') === 'winner') {
		return;
	}

	const {lat, lng} = mapEvent.latLng;
	const [taskLat, taskLong] = localStorage.getItem('currentLevel').split('_');
	const metersFrom = getMeters(lat(), lng(), taskLat, taskLong);

	// Hide all previous markers
	markers.forEach(marker => marker.setMap(null));

	if (metersFrom < 20) {
		completeTask();
		googleMap.setZoom(2);
	} else {
		markers.push(new google.maps.Marker({
			position: mapEvent.latLng,
			map: googleMap
		}));
		map.classList.add('shake');
		setTimeout(() => {
			map.classList.remove('shake');
		}, 500);
	}
};

const checkAnswer = () => {
	const taskElement = document.getElementById(localStorage.getItem('currentLevel'));
	const taskInput = taskElement.querySelector('input');

	const currentAnswer = taskInput.value;
	const correctAnswer = taskInput.dataset.answer;

	if (currentAnswer === correctAnswer) {
		setTimeout(() => {
			completeTask();
		}, 300);
	}
};

const reset = () => {
	localStorage.removeItem('currentLevel');
	location.reload();
};

function initMap() {
	googleMap = new google.maps.Map(map, {
		zoom: 2,
		center: {
			lat: 0,
			lng: 0
		},
		clickableIcons: false
	});

	googleMap.addListener('click', checkLocation);
};
