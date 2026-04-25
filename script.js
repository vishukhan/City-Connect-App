// --- 1. FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyBqfHQrsQbJcZq5Lc4ZgzEs1BVv1Pd4nsE",
  authDomain: "local-1dea0.firebaseapp.com",
  databaseURL: "https://local-1dea0-default-rtdb.firebaseio.com",
  projectId: "local-1dea0",
  storageBucket: "local-1dea0.firebasestorage.app",
  messagingSenderId: "67361178496",
  appId: "1:67361178496:web:3b8ca5f96a6c9ca5fa3765",
  measurementId: "G-5394SPE8D8"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const IMGBB_KEY = "4bfd453f78fd8f1d35621d90eecaf679"; 
const _0xAdmin = "NzQxOTEzMDI3Mg=="; // Base64 for 7419130272

let currentShopKey = null;
let currentCategory = 'all';

// --- 2. NOTIFICATION & SOUND LOGIC ---
const notifySound = new Audio('notify.mp3'); 

function requestPermission() {
    if ("Notification" in window) {
        Notification.requestPermission();
    }
}

function sendPush(title, msg) {
    if (Notification.permission === "granted") {
        const options = {
            body: msg,
            icon: 'logo.png', 
            badge: 'logo.png',
            vibrate: [200, 100, 200],
            requireInteraction: true,
            tag: 'city-connect-alert'
        };
        const notification = new Notification(title, options);
        notifySound.play().catch(() => console.log("Sound error"));
        notification.onclick = () => { window.focus(); notification.close(); };
    }
}

// Real-time Alert for Approved Shops
db.ref('shops').limitToLast(1).on('child_added', (snap) => {
    const shop = snap.val();
    if (shop.timestamp && (Date.now() - shop.timestamp < 60000)) {
        sendPush("Nayi Shop Live!", `${shop.name} ab ${shop.city || 'aapke sheher'} mein live hai!`);
    }
});

// --- 3. UI & MODAL CONTROL ---
function openModal() { document.getElementById('shopModal').style.display = 'block'; }
function closeModal() { document.getElementById('shopModal').style.display = 'none'; }
function openEditModal() { document.getElementById('editModal').style.display = 'block'; }
function closeEditModal() { document.getElementById('editModal').style.display = 'none'; }
function closeDetails() { document.getElementById('detailsPage').style.display = 'none'; }
function closeAdmin() { document.getElementById('adminPanel').style.display = 'none'; }

window.onclick = function(event) {
    const modals = ['shopModal', 'editModal', 'adminPanel'];
    modals.forEach(id => {
        const m = document.getElementById(id);
        if (event.target == m) m.style.display = "none";
    });
}

// --- 4. DATA LOADING & FILTERS ---
function loadShops() {
    const selectedCity = document.getElementById('cityFilter').value;
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();

    db.ref('shops').on('value', snap => {
        const grid = document.getElementById('shopList');
        grid.innerHTML = "";
        snap.forEach(child => {
            const v = child.val();
            const matchesCity = (selectedCity === 'all' || v.city === selectedCity);
            const matchesCat = (currentCategory === 'all' || v.cat === currentCategory);
            const matchesSearch = v.name.toLowerCase().includes(searchQuery);

            if(matchesCity && matchesCat && matchesSearch) {
                const card = document.createElement('div');
                card.className = "shop-card";
                card.onclick = () => openDetails(child.key);
                card.innerHTML = `
                    <img src="${v.img}" class="card-img">
                    <div class="card-info">
                        <h3>${v.name}</h3>
                        <p><i class="fa fa-map-marker-alt"></i> ${v.city || 'Local'}</p>
                    </div>`;
                grid.appendChild(card);
            }
        });
    });
}

function filterCat(cat, btn) {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = cat;
    loadShops();
}

// --- 5. SHOP DETAILS & UPDATES ---
function openDetails(id) {
    db.ref('shops/' + id).on('value', snap => {
        const v = snap.val();
        if(!v) return;
        document.getElementById('detName').innerText = v.name;
        document.getElementById('detImg').src = v.img;
        document.getElementById('detAddr').innerHTML = `<b>Address:</b> ${v.addr}<br><b>City:</b> ${v.city}`;
        document.getElementById('detCallBtn').href = "tel:" + v.phone;
        
        // Map Support
        const mapCont = document.getElementById('map-container');
        if(v.mapLink) {
            mapCont.style.display = "block";
            document.getElementById('mapLink').href = v.mapLink;
        } else { mapCont.style.display = "none"; }

        // Live Updates
        const updatesDiv = document.getElementById('liveUpdates');
        updatesDiv.innerHTML = "<h3>Live Updates & Stock</h3>";
        if(v.updates) {
            Object.values(v.updates).reverse().forEach(upd => {
                const div = document.createElement('div');
                div.className = "update-card";
                div.innerHTML = `<small>${upd.time}</small><p>${upd.text}</p>${upd.img ? `<img src="${upd.img}">` : ''}`;
                updatesDiv.appendChild(div);
            });
        }
        document.getElementById('detailsPage').style.display = 'block';
    });
}

// --- 6. REGISTRATION & MERCHANT LOGIC ---
async function handleRegistration() {
    const name = document.getElementById('regName').value;
    const city = document.getElementById('regCity').value;
    const phone = document.getElementById('regPhone').value.trim();
    const file = document.getElementById('imgFile').files[0];
    const btn = document.getElementById('submitBtn');

    if(!name || !city || !phone || !file) return alert("Saari details bharna zaroori hai!");

    btn.innerText = "Processing...";
    btn.disabled = true;

    const url = await uploadToImgBB(file);
    if(url) {
        const data = {
            name, city, phone,
            cat: document.getElementById('regCat').value,
            mapLink: document.getElementById('regMap').value,
            pin: document.getElementById('regPin').value,
            addr: document.getElementById('regAddr').value,
            img: url,
            timestamp: Date.now()
        };
        db.ref('pending_shops').push(data).then(() => {
            alert("Success! Admin approval ka wait karein.");
            location.reload();
        });
    }
}

async function verifyMerchant() {
    const phone = document.getElementById('loginPhone').value.trim();
    const pin = document.getElementById('loginPin').value.trim();
    
    if(!phone || !pin) return alert("Phone aur PIN dono bharein!");

    // Firebase se shop dhoondein
    const snap = await db.ref('shops').orderByChild('phone').equalTo(phone).once('value');
    
    if(snap.exists()) {
        let matchFound = false;
        snap.forEach(child => {
            const shopData = child.val();
            if(shopData.pin == pin) { // PIN match check
                currentShopKey = child.key; // Isse Global variable mein save karein
                matchFound = true;
            }
        });

        if(matchFound) {
            // UI Update: Login chhupao, Dashboard dikhao
            document.getElementById('editFormStep1').style.display = 'none';
            document.getElementById('editFormStep2').style.display = 'block';
            loadMerchantPosts(); // Purane posts load karein
        } else {
            alert("Galt PIN! Register karte waqt wala PIN daalein.");
        }
    } else {
        alert("Ye number registered nahi hai ya abhi approved nahi hua!");
    }
}


async function postUpdate() {
    const text = document.getElementById('itemText').value.trim();
    if(!text) return alert("Kuch toh likhiye!");
    if(!currentShopKey) return alert("Session expired, please login again.");

    const btn = document.getElementById('postBtn');
    btn.disabled = true;
    btn.innerText = "Posting...";

    const update = {
        text: text,
        time: new Date().toLocaleString(),
        timestamp: Date.now()
    };

    // Database mein shop ke andar updates folder mein save karein
    db.ref(`shops/${currentShopKey}/updates`).push(update).then(() => {
        alert("Post Live Ho Gaya!");
        document.getElementById('itemText').value = ""; // Clear text
        btn.disabled = false;
        btn.innerText = "Post Live";
    }).catch(err => {
        alert("Error: " + err.message);
        btn.disabled = false;
    });
}


// --- 7. HELPERS ---
async function uploadToImgBB(file) {
    const formData = new FormData();
    formData.append("image", file);
    try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: "POST", body: formData });
        const data = await res.json();
        return data.success ? data.data.url : null;
    } catch(e) { return null; }
}

function loadMerchantPosts() {
    db.ref(`shops/${currentShopKey}/updates`).on('value', snap => {
        const list = document.getElementById('merchantPostList');
        list.innerHTML = "";
        snap.forEach(child => {
            const v = child.val();
            const div = document.createElement('div');
            div.className = "stock-item";
            div.innerHTML = `
                <div style="display:flex; gap:10px; align-items:center;">
                    ${v.img ? `<img src="${v.img}">` : ''}
                    <span style="font-size:0.7rem;">${v.text.substring(0,20)}...</span>
                </div>
                <i class="fa fa-trash" style="color:red" onclick="deletePost('${child.key}')"></i>
            `;
            list.appendChild(div);
        });
    });
}

function deletePost(key) {
    if(confirm("Post delete karein?")) db.ref(`shops/${currentShopKey}/updates/${key}`).remove();
}

// --- 8. ADMIN FUNCTIONS ---
function checkAdminPin() { 
    const pin = prompt("Admin PIN:");
    if(btoa(pin) === _0xAdmin) { 
        document.getElementById('adminPanel').style.display = 'block'; 
        loadPending(); 
    } else { alert("Incorrect!"); }
}

function loadPending() {
    db.ref('pending_shops').on('value', snap => {
        const list = document.getElementById('pendingList');
        list.innerHTML = "";
        snap.forEach(child => {
            const v = child.val();
            const div = document.createElement('div');
            div.style = "padding:12px; border-bottom:1px solid #eee; background:#fff; margin-bottom:8px; border-radius:10px;";
            div.innerHTML = `
                <b>${v.name}</b> (${v.city})<br>
                <small>${v.phone}</small><br><br>
                <button onclick="approve('${child.key}')" style="background:green; color:#fff; border:none; padding:6px 12px; border-radius:6px;">Approve</button>
                <button onclick="reject('${child.key}')" style="background:red; color:#fff; border:none; padding:6px 12px; border-radius:6px; margin-left:10px;">Reject</button>
            `;
            list.appendChild(div);
        });
    });
}

function approve(key) { 
    db.ref('pending_shops/' + key).once('value', s => { 
        const data = s.val();
        data.timestamp = Date.now();
        db.ref('shops').push(data).then(() => {
            db.ref('pending_shops/' + key).remove(); 
        }); 
    }); 
}

function reject(key) { if(confirm("Reject?")) db.ref('pending_shops/' + key).remove(); }

// --- INITIALIZE ---
// Safe Event Listeners
window.onload = () => {
    requestPermission();
    loadShops();
    
    // Check if elements exist before adding listeners
    const imgFileInput = document.getElementById('imgFile');
    if(imgFileInput) {
        imgFileInput.onchange = (e) => {
            if(e.target.files[0]) document.getElementById('fileName').innerText = e.target.files[0].name;
        };
    }

    const itemFileInput = document.getElementById('itemFile');
    if(itemFileInput) {
        itemFileInput.onchange = (e) => {
            if(e.target.files[0]) document.getElementById('itemFileName').innerText = e.target.files[0].name;
        };
    }
    
    const sInput = document.getElementById('searchInput');
    if(sInput) sInput.oninput = () => loadShops();
};