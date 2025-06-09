// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCmAIOy3OtsfjmiYE2RGCkJ_QGdspAogPg",
    authDomain: "gift-exchanger-5fogs.firebaseapp.com",
    projectId: "gift-exchanger-5fogs",
    storageBucket: "gift-exchanger-5fogs.firebasestorage.app",
    messagingSenderId: "839995875699",
    appId: "1:839995875699:web:7611d9b0808d9b8e3e2506",
    measurementId: "G-DRNYEWBGMK"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const analytics = firebase.analytics();

  // Data structures
let availableGifts = [];
let assignedGifts = {};

  // Fetch initial data from Firestore
async function loadData() {
    // Load available gifts
    const availableSnapshot = await db.collection('availableGifts').get();
    availableGifts = availableSnapshot.docs.map(doc => doc.data().name);

    // Load assigned gifts
    const assignedSnapshot = await db.collection('assignedGifts').get();
    assignedSnapshot.forEach(doc => {assignedGifts[doc.data().name] = doc.data().gifts;
    });
}
loadData();

  // Simple plural check
function isPluralMatch(gift, existingGift) {
    gift = gift.toLowerCase().trim();
    existingGift = existingGift.toLowerCase().trim();
    const singular = gift.endsWith('s') ? gift.slice(0, -1) : gift;
    const plural = gift.endsWith('s') ? gift : gift + 's';
    return existingGift === gift || existingGift === singular || existingGift === plural;
}

  // Gift Assigner
async function assignGifts() {
    const nameInput = document.getElementById('nameInput').value.trim();
    const outputDiv = document.getElementById('assignerOutput');
    const nameUpper = nameInput.toUpperCase();

    if (!availableGifts.length) {
        outputDiv.innerHTML = 'No gifts available. Please add gifts using the Gift List Adder!';
        return;
    }

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

    // Check if name exists
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

    // Update Firestore
    await db.collection('assignedGifts').doc(nameUpper).set({
        name: nameUpper,
        gifts: selectedGifts.join(', ')
    });

    // Clear and update available gifts
    const availableSnapshot = await db.collection('availableGifts').get();
    availableSnapshot.forEach(doc => doc.ref.delete());
    for (const gift of availableGifts) {
        await db.collection('availableGifts').add({ name: gift });
    }

    // Display output
    let output = numGifts === 3
    ? '<p>Hey love,<br>These are your gift options. You can choose any 2 of the 3 gifts or be a big-hearted cutie and get all 3 and suprise your gurls!</p>'
    : '<p>Hey love,<br>These are your gift options. Get them and surprise your gurls!</p>';
    output += selectedGifts.map(gift => `<p>${gift}</p>`).join('');
    outputDiv.innerHTML = output;
}

  // Gift List Adder
async function addGifts() {
    const giftInput = document.getElementById('giftInput').value.trim();
    const outputDiv = document.getElementById('adderOutput');

    if (giftInput.toUpperCase() === 'QUIT') {
        availableGifts = [];
        assignedGifts = {};

      // Clear Firestore
        let batch = db.batch();
        const availableSnapshot = await db.collection('availableGifts').get();
        availableSnapshot.forEach(doc => batch.delete(doc.ref));
        const assignedSnapshot = await db.collection('assignedGifts').get();
        assignedSnapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        outputDiv.innerHTML = 'Gift list cleared and exiting.';
        document.getElementById('assignerOutput').innerHTML = '';
        return;
    }

    const gifts = giftInput.split(',').map(g => g.trim()).filter(g => g);
    if (!gifts.length) {
        outputDiv.innerHTML = 'No valid gift entered. Please try again.';
        return;
    }

    let giftsAdded = 0;
    let output = '';

    for (const gift of gifts) {
        if (availableGifts.some(existing => isPluralMatch(gift, existing))) {
        output += `<p>'${gift}' or its singular/plural form is already entered.</p>`;
    } else {
        availableGifts.push(gift);
        await db.collection('availableGifts').add({ name: gift });
        giftsAdded++;
    }
    }

    if (giftsAdded === 1) {
        output += '<p>Gift was added to the gift list!!</p>';
    } else if (giftsAdded > 1) {
        output += '<p>Gifts were added to the gift list!!!</p>';
    }

    outputDiv.innerHTML = output;
}