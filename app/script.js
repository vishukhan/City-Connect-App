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
const _0xAdmin = "NzQxOTEzMDI3Mg=="; 

let currentShopKey = null;
let currentCategory = 'all';

// --- 2. IMPROVED AUTO SCROLL LOGIC ---
function scrollToPost(postId) {
    setTimeout(() => {
        const target = document.getElementById('post-' + postId);
        const container = document.getElementById('detailsPage');

        if (target && container) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.style.transition = "background 0.5s ease";
            target.style.backgroundColor = "#e0e7ff"; 
            setTimeout(() => { target.style.backgroundColor = "#ffffff"; }, 2000);
        } else {
            setTimeout(() => {
                const retryTarget = document.getElementById('post-' + postId);
                if(retryTarget) retryTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
        }
    }, 800); 
}

// --- 3. NOTIFICATION & SOUND LOGIC ---
const notifySound = new Audio('notify.mp3'); 

function requestPermission() {
    if ("Notification" in window) { Notification.requestPermission(); }
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

db.ref('shops').limitToLast(1).on('child_added', (snap) => {
    const shop = snap.val();
    if (shop.timestamp && (Date.now() - shop.timestamp < 60000)) {
        sendPush("Nayi Shop Live!", `${shop.name} ab ${shop.city || 'aapke sheher'} mein live hai!`);
    }
});

// --- 4. UI & MODAL CONTROL ---
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

// --- 5. UPDATED DATA LOADING (CITY SEARCH ENABLED) ---
function loadShops() {
    const selectedCity = document.getElementById('cityFilter').value.toLowerCase();
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();

    db.ref('shops').on('value', snap => {
        const grid = document.getElementById('shopList');
        grid.innerHTML = "";
        
        snap.forEach(child => {
            const v = child.val();
            const shopCity = (v.city || "").toLowerCase();
            const shopName = (v.name || "").toLowerCase();

            // Logic: Search bar se City ya Shop name dono search honge
            const matchesSearch = shopName.includes(searchQuery) || shopCity.includes(searchQuery);
            
            // Logic: Dropdown filter (agar 'all' nahi hai to city match honi chaiye)
            const matchesCityFilter = (selectedCity === 'all' || shopCity === selectedCity);
            
            // Logic: Category chip filter
            const matchesCat = (currentCategory === 'all' || v.cat === currentCategory);

            if(matchesSearch && matchesCityFilter && matchesCat) {
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

// --- 6. SHOP DETAILS & UPDATES ---
function openDetails(id) {
    document.getElementById('detailsPage').style.display = 'block';
    document.getElementById('detailsPage').scrollTop = 0;

    db.ref('shops/' + id).on('value', snap => {
        const v = snap.val();
        if(!v) return;
        document.getElementById('detName').innerText = v.name;
        document.getElementById('detImg').src = v.img;
        document.getElementById('detAddr').innerHTML = `<b>Address:</b> ${v.addr}<br><b>City:</b> ${v.city}`;
        document.getElementById('detCallBtn').href = "tel:" + v.phone;
        
        const mapCont = document.getElementById('map-container');
        if(v.mapLink) {
            mapCont.style.display = "block";
            document.getElementById('mapLink').href = v.mapLink;
        } else { mapCont.style.display = "none"; }

        const updatesDiv = document.getElementById('liveUpdates');
        updatesDiv.innerHTML = "";

        if(v.updates) {
            const upds = Object.entries(v.updates).reverse(); 
            const imgPosts = upds.filter(([key, u]) => u.img);
            if(imgPosts.length > 0) {
                const h3 = document.createElement('h3');
                h3.innerText = "Featured Items";
                updatesDiv.appendChild(h3);
                const scrollDiv = document.createElement('div');
                scrollDiv.className = "horizontal-scroll"; 
                imgPosts.forEach(([postId, u]) => {
                    const item = document.createElement('div');
                    item.className = "swipe-item";
                    item.onclick = (e) => { e.stopPropagation(); scrollToPost(postId); };
                    item.innerHTML = `<img src="${u.img}"><div class="swipe-info">VIEW POST</div>`;
                    scrollDiv.appendChild(item);
                });
                updatesDiv.appendChild(scrollDiv);
            }
            const h3Feed = document.createElement('h3');
            h3Feed.innerText = "Live Updates & Stock";
            updatesDiv.appendChild(h3Feed);
            upds.forEach(([postId, upd]) => {
                const div = document.createElement('div');
                div.className = "update-card";
                div.id = 'post-' + postId;
                div.innerHTML = `<small>${upd.time}</small><p>${upd.text}</p>${upd.img ? `<img src="${upd.img}">` : ''}`;
                updatesDiv.appendChild(div);
            });
        }
    });
}

// --- 7. REGISTRATION & MERCHANT LOGIC ---
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
    const snap = await db.ref('shops').orderByChild('phone').equalTo(phone).once('value');
    if(snap.exists()) {
        let match = false;
        snap.forEach(child => { if(child.val().pin == pin) { currentShopKey = child.key; match = true; }});
        if(match) {
            document.getElementById('editFormStep1').style.display = 'none';
            document.getElementById('editFormStep2').style.display = 'block';
            loadMerchantPosts(); 
        } else { alert("Galt PIN!"); }
    } else { alert("Not registered!"); }
}

async function postUpdate() {
    const text = document.getElementById('itemText').value.trim();
    const file = document.getElementById('itemFile').files[0];
    if(!text || !currentShopKey) return alert("Details bharein!");

    const btn = document.getElementById('postBtn');
    btn.disabled = true; btn.innerText = "Posting...";

    let imgUrl = "";
    if(file) imgUrl = await uploadToImgBB(file);

    const update = { text, img: imgUrl, time: new Date().toLocaleString(), timestamp: Date.now() };
    db.ref(`shops/${currentShopKey}/updates`).push(update).then(() => {
        alert("Post Live!");
        document.getElementById('itemText').value = ""; 
        btn.disabled = false; btn.innerText = "Post Live";
    });
}

// --- 8. HELPERS ---
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
            div.innerHTML = `<span>${v.text.substring(0,20)}...</span><i class="fa fa-trash" onclick="deletePost('${child.key}')"></i>`;
            list.appendChild(div);
        });
    });
}

function deletePost(key) {
    if(confirm("Delete?")) db.ref(`shops/${currentShopKey}/updates/${key}`).remove();
}

// --- 9. ADMIN FUNCTIONS ---
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

window.onload = () => {
    requestPermission();
    loadShops();
    const sInput = document.getElementById('searchInput');
    if(sInput) sInput.oninput = () => loadShops();
};
