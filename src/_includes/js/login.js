// Check that the person logging into the site is allowed
const isAllowed = localStorage.getItem('allowed');

if (!isAllowed) {
	const answer = 'hobbitsrun';
	const result = prompt('Please enter the secret code');

	if (result === answer) {
		localStorage.setItem('allowed', true);
	} else {
		window.stop();
	}
}
