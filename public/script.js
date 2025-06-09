// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCmAIOy3OtsfjmiYE2RGCkJ_QGdspAogPg",
  authDomain: "gift-exchanger-5fogs.firebaseapp.com",
  projectId: "gift-exchanger-5fogs",
  storageBucket: "gift-exchanger-5fogs.firebasestorage.app",
  messagingSenderId: "839995875699",
  appId: "1:839995875699:web:7611d9b0808d9b8e3e2506",
  measurementId: "G-DRNYEWBGMK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Data structures
let availableGifts = [];
let assignedGifts = {};
let totalGifts = [];

// Load data from Firestore
async function loadData() {
  // Load available gifts
  const availableSnapshot = await getDocs(collection(db, 'availableGifts'));
  availableGifts = availableSnapshot.docs.map(doc => doc.data().name);

  // Load assigned gifts
  const assignedSnapshot = await getDocs(collection(db, 'assignedGifts'));
  assignedGifts = {};
  assignedSnapshot.forEach(doc => {
    assignedGifts[doc.data().name] = doc.data().gifts.split(', ');
  });

  // Load total gifts
  const totalSnapshot = await getDocs(collection(db, 'totalGifts'));
  totalGifts = totalSnapshot.docs.map(doc => doc.data().name);
}

// Normalize gift names for consistent comparison
function normalizeGift(gift) {
  return gift.toLowerCase().trim();
}

// Simple plural check
function isPluralMatch(gift, existingGift) {
  gift = normalizeGift(gift);
  existingGift = normalizeGift(existingGift);
  const singular = gift.endsWith('s') ? gift.slice(0, -1) : gift;
  const plural = gift.endsWith('s') ? gift : gift + 's';
  return existingGift === gift || existingGift === singular || existingGift === plural;
}

// Check if a gift is already assigned
function isGiftAssigned(gift) {
  return Object.values(assignedGifts).some(giftsArray => giftsArray.some(assignedGift => isPluralMatch(gift, assignedGift)));
}

// Check if a gift exists in totalGifts
function isGiftInTotal(gift) {
  return totalGifts.some(totalGift => isPluralMatch(gift, totalGift));
}

// Gift Assigner
window.assignGifts = async function assignGifts() {
  await loadData(); // Reload data before operation
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
    const gifts = assignedGifts[nameUpper];
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
    selectedGifts.push(tempGifts[randomIndex]);
    tempGifts.splice(randomIndex, 1); // Remove assigned gift
  }

  availableGifts = tempGifts; // Update available gifts
  assignedGifts[nameUpper] = selectedGifts;

  // Update Firestore
  await setDoc(doc(db, 'assignedGifts', nameUpper), {
    name: nameUpper,
    gifts: selectedGifts.join(', ')
  });

  // Clear and update available gifts in Firestore
  const availableSnapshot = await getDocs(collection(db, 'availableGifts'));
  await Promise.all(availableSnapshot.docs.map(doc => deleteDoc(doc.ref)));
  await Promise.all(availableGifts.map(gift => setDoc(doc(db, 'availableGifts', Date.now() + Math.random().toString()), { name: gift })));

  // Display output
  let output = numGifts === 3
    ? '<p>Hey love,<br>These are your gift options. You can choose any 2 of the 3 gifts or be a big-hearted cutie and get all 3 and suprise your gurls!</p>'
    : '<p>Hey love,<br>These are your gift options. Get them and surprise your gurls!</p>';
  output += selectedGifts.map(gift => `<p>${gift}</p>`).join('');
  outputDiv.innerHTML = output;
};

// Gift List Adder
window.addGifts = async function addGifts() {
  await loadData(); // Reload data before operation
  const giftInput = document.getElementById('giftInput').value.trim();
  const outputDiv = document.getElementById('adderOutput');

  if (giftInput.toUpperCase() === 'QUIT') {
    availableGifts = [];
    assignedGifts = {};
    totalGifts = []; // Clear totalGifts locally
    const availableSnapshot = await getDocs(collection(db, 'availableGifts'));
    const assignedSnapshot = await getDocs(collection(db, 'assignedGifts'));
    const totalSnapshot = await getDocs(collection(db, 'totalGifts'));
    await Promise.all(availableSnapshot.docs.map(doc => deleteDoc(doc.ref)));
    await Promise.all(assignedSnapshot.docs.map(doc => deleteDoc(doc.ref)));
    await Promise.all(totalSnapshot.docs.map(doc => deleteDoc(doc.ref)));
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
    if (isGiftInTotal(gift)) {
      output += `<p>'${gift}' or its singular/plural form has already been entered into the system.</p>`;
    } else if (availableGifts.some(existing => isPluralMatch(gift, existing))) {
      output += `<p>'${gift}' is already in the available gifts list.</p>`;
    } else {
      availableGifts.push(gift);
      totalGifts.push(gift); // Add to totalGifts
      // Update Firestore
      await setDoc(doc(db, 'availableGifts', Date.now() + Math.random().toString()), { name: gift });
      await setDoc(doc(db, 'totalGifts', Date.now() + Math.random().toString()), { name: gift });
      giftsAdded++;
    }
  }

  if (giftsAdded === 1) {
    output += '<p>Gift was added to the gift list!!</p>';
  } else if (giftsAdded > 1) {
    output += '<p>Gifts were added to the gift list!!!</p>';
  } else if (!giftsAdded) {
    output += '<p>No new gifts were added.</p>';
  }

  outputDiv.innerHTML = output;
};