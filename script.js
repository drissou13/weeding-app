import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, onValue, push, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDbGR-FuQVWt-LgiqbWWQY2MRmxgtFRPSQ",
    authDomain: "wedding-app-e188a.firebaseapp.com",
    databaseURL: "https://wedding-app-e188a-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "wedding-app-e188a",
    storageBucket: "wedding-app-e188a.firebasestorage.app",
    messagingSenderId: "419917976315",
    appId: "1:419917976315:web:95d3024d4601ffe824565e",
    measurementId: "G-12VG1G5WV0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let isRegisterMode = false;
let currentUserData = null;
let selectedPartner = "";

// AUTH
window.toggleAuthMode = () => {
    isRegisterMode = !isRegisterMode;
    document.getElementById('registerFields').style.display = isRegisterMode ? 'block' : 'none';
    document.getElementById('authTitle').innerText = isRegisterMode ? 'Créer un espace' : 'Connexion';
    document.getElementById('mainAuthBtn').innerText = isRegisterMode ? 'S\'inscrire' : 'Connexion';
};

window.handleAuth = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        if (isRegisterMode) {
            const p1 = document.getElementById('p1_name').value;
            const p2 = document.getElementById('p2_name').value;
            const date = document.getElementById('wedding_date').value;
            if(!p1 || !p2 || !date) return alert("Champs manquants");
            const userCred = await createUserWithEmailAndPassword(auth, email, pass);
            await set(ref(db, 'users/' + userCred.user.uid + '/config'), { partner1: p1, partner2: p2, weddingDate: date, bgColor: "#F9F8F4" });
        } else {
            await signInWithEmailAndPassword(auth, email, pass);
        }
    } catch (e) { alert(e.message); }
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('appScreen').style.display = 'block';
        document.getElementById('themePicker').style.display = 'flex';
        loadData(user.uid);
    } else {
        document.getElementById('authScreen').style.display = 'block';
        document.getElementById('appScreen').style.display = 'none';
        document.getElementById('themePicker').style.display = 'none';
    }
});

function loadData(uid) {
    onValue(ref(db, 'users/' + uid), (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        currentUserData = data;
        document.getElementById('coupleTitle').innerText = `${data.config.partner1} & ${data.config.partner2}`;
        document.getElementById('btnP1').innerText = data.config.partner1;
        document.getElementById('btnP2').innerText = data.config.partner2;
        document.body.style.backgroundColor = data.config.bgColor || "#F9F8F4";
        document.getElementById('bgPicker').value = data.config.bgColor || "#F9F8F4";
        if(!selectedPartner) switchUser(1);
        renderTasks(data.tasks);
        renderGuests(data.guests);
        updateCountdown(data.config.weddingDate);
    });
}

window.switchUser = (n) => {
    selectedPartner = n === 1 ? currentUserData.config.partner1 : currentUserData.config.partner2;
    document.getElementById('btnP1').className = n === 1 ? 'profile-btn active' : 'profile-btn';
    document.getElementById('btnP2').className = n === 2 ? 'profile-btn active' : 'profile-btn';
};

// ACTIONS
window.addTask = () => {
    const text = document.getElementById('taskInput').value;
    const cat = document.getElementById('catInput').value || "Général";
    const price = parseFloat(document.getElementById('priceInput').value) || 0;
    if(!text) return;
    push(ref(db, `users/${auth.currentUser.uid}/tasks`), { text, category: cat, price, done: false, owner: selectedPartner });
    document.getElementById('taskInput').value = ""; document.getElementById('priceInput').value = "";
};

function renderTasks(tasks) {
    const list = document.getElementById('todoList');
    let total = 0; list.innerHTML = "";
    if(!tasks) { document.getElementById('totalDisplay').innerText = 0; return; }
    Object.keys(tasks).forEach(id => {
        const t = tasks[id];
        total += t.price;
        list.innerHTML += `<div class="item-row ${t.done ? 'completed' : ''}">
            <input type="checkbox" ${t.done ? 'checked' : ''} onclick="toggleTask('${id}', ${t.done})">
            <div class="item-info"><b>${t.category}</b><br>${t.text}</div>
            <div style="font-weight:bold">${t.price}€</div>
            <button onclick="deleteTask('${id}')" style="background:none; color:red; padding:5px;">✕</button>
        </div>`;
    });
    document.getElementById('totalDisplay').innerText = total.toLocaleString();
}

window.toggleTask = (id, s) => update(ref(db, `users/${auth.currentUser.uid}/tasks/${id}`), { done: !s });
window.deleteTask = (id) => remove(ref(db, `users/${auth.currentUser.uid}/tasks/${id}`));

window.addGuest = () => {
    const name = document.getElementById('guestName').value;
    if(!name) return;
    push(ref(db, `users/${auth.currentUser.uid}/guests`), { name, addedBy: selectedPartner });
    document.getElementById('guestName').value = "";
};

function renderGuests(guests) {
    const list = document.getElementById('guestList');
    list.innerHTML = "";
    if(!guests) return;
    Object.keys(guests).forEach(id => {
        list.innerHTML += `<div class="item-row">
            <div class="item-info">${guests[id].name}</div>
            <button onclick="deleteGuest('${id}')" style="background:none; color:red; padding:5px;">✕</button>
        </div>`;
    });
}
window.deleteGuest = (id) => remove(ref(db, `users/${auth.currentUser.uid}/guests/${id}`));

function updateCountdown(date) {
    const days = Math.floor((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
    document.getElementById('countdown').innerText = days > 0 ? `J - ${days} jours` : "C'est le grand jour !";
}

window.changeBg = (color) => update(ref(db, `users/${auth.currentUser.uid}/config`), { bgColor: color });
window.logout = () => signOut(auth);
