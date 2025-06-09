// Load data from localStorage
let availableGifts = JSON.parse(localStorage.getItem('availableGifts')) || [];
let assignedGifts = JSON.parse(localStorage.getItem('assignedGifts')) || {};

// Simple plural check for common cases
function isPluralMatch(gift, existingGift) {
    gift = gift.toLowerCase().trim();
    existingGift = existingGift.toLowerCase().trim();
    const singular = gift.endsWith('s') ? gift.slice(0, -1) : gift;
    const plural = gift.endsWith('s') ? gift : gift + 's';
    return existingGift === gift || existingGift === singular || existingGift === plural;
}

// Gift Assigner
function assignGifts() {
    const nameInput = document.getElementById('nameInput').value.trim();
    const outputDiv = document.getElementById('assignerOutput');
    
    if (nameInput.toUpperCase() === 'QUIT') {
        outputDiv.innerHTML = 'Exiting program.';
        return;
    }

    if (!nameInput) {
        outputDiv.innerHTML = 'Please enter a valid name!';
        return;
    }

    if (availableGifts.length < 2) {
        outputDiv.innerHTML = 'Not enough gifts left to continue. Program ending.';
        return;
    }

    const nameUpper = nameInput.toUpperCase();

    // Check if name already exists
    if (assignedGifts[nameUpper]) {
        const gifts = assignedGifts[nameUpper].split(', ');
        const numGifts = gifts.length;
        let output = numGifts === 3
            ? '<p>Hey love,<br>These are your gift options. You can choose any 2 of the 3 gifts or be a big-hearted cutie and get all 3 and suprise your gurls!</p>'
            : '<p>Hey love,<br>These are your gift options. Get them and surprise your gurls!</p>';
        output += gifts.map(gift => `<p>${gift}</p>`).join('');
        outputDiv.innerHTML = output;
        return;
    }

    // Assign new gifts
    const numGifts = Math.random() < 0.5 ? 2 : Math.min(3, availableGifts.length);
    const selectedGifts = [];
    const tempGifts = [...availableGifts];
    
    for (let i = 0; i < numGifts; i++) {
        if (tempGifts.length === 0) break;
        const randomIndex = Math.floor(Math.random() * tempGifts.length);
        selectedGifts.push(tempGifts.splice(randomIndex, 1)[0]);
    }

    availableGifts = tempGifts;
    assignedGifts[nameUpper] = selectedGifts.join(', ');
    
    // Update localStorage
    localStorage.setItem('availableGifts', JSON.stringify(availableGifts));
    localStorage.setItem('assignedGifts', JSON.stringify(assignedGifts));

    // Display output
    let output = numGifts === 3
        ? '<p>Hey love,<br>These are your gift options. You can choose any 2 of the 3 gifts or be a big-hearted cutie and get all 3 and suprise your gurls!</p>'
        : '<p>Hey love,<br>These are your gift options. Get them and surprise your gurls!</p>';
    output += selectedGifts.map(gift => `<p>${gift}</p>`).join('');
    outputDiv.innerHTML = output;
}

// Gift List Adder
function addGifts() {
    const giftInput = document.getElementById('giftInput').value.trim();
    const outputDiv = document.getElementById('adderOutput');

    if (giftInput.toUpperCase() === 'QUIT') {
        availableGifts = [];
        localStorage.setItem('availableGifts', JSON.stringify(availableGifts));
        outputDiv.innerHTML = 'Gift list cleared and exiting.';
        return;
    }

    const gifts = giftInput.split(',').map(g => g.trim()).filter(g => g);
    if (!gifts.length) {
        outputDiv.innerHTML = 'No valid gift entered. Please try again.';
        return;
    }

    let giftsAdded = 0;
    let output = '';

    gifts.forEach(gift => {
        if (availableGifts.some(existing => isPluralMatch(gift, existing))) {
            output += `<p>'${gift}' or its singular/plural form is already entered.</p>`;
        } else {
            availableGifts.push(gift);
            giftsAdded++;
        }
    });

    if (giftsAdded === 1) {
        output += '<p>Gift was added to the gift list!!</p>';
    } else if (giftsAdded > 1) {
        output += '<p>Gifts were added to the gift list!!!</p>';
    }

    // Update localStorage
    localStorage.setItem('availableGifts', JSON.stringify(availableGifts));
    outputDiv.innerHTML = output;
}
