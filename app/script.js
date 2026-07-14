// ==========================================================================
// CITYCONNECT PRO CORE ARCHITECTURE ENGINE - COMPLETE ORIGINAL MERGED ENGINE
// ==========================================================================

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
const _0xAdmin = "NzQxOTEzMDI3Mg=="; // Original Base64 PIN 7419130272

let currentShopKey = null;
let currentCategory = 'all';

// Track Core Framework Additions
let activeUserSession = null;
let globalGuestId = "";

// Global Image Input Sync Label Trigger Fix (Safe element attachment hook)
setTimeout(() => {
    const imgFileInput = document.getElementById('imgFile');
    if(imgFileInput) {
        imgFileInput.addEventListener('change', function() {
            const nameLabel = document.getElementById('fileName');
            if(nameLabel && this.files && this.files[0]) {
                nameLabel.innerText = this.files[0].name.substring(0, 18) + "...";
            }
        });
    }
}, 1000);


// Profile Image Update Logic
document.getElementById('profileImgInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const user = firebase.auth().currentUser;
    if (!user) return alert("Pehle login karein!");

    // 1. Image Upload to ImgBB
    const imgUrl = await uploadToImgBB(file);
    
    if (imgUrl) {
        // 2. Firestore mein User Profile update
        window.coreDb.collection("users").doc(user.uid).set({
            profilePic: imgUrl
        }, { merge: true }).then(() => {
            // 3. UI update
            document.getElementById("user-header-avatar").src = imgUrl;
            document.getElementById("drawer-user-avatar").src = imgUrl;
            alert("Profile photo update ho gayi!");
        }).catch(err => {
            console.error("Error updating profile:", err);
            alert("Update mein error aaya.");
        });
    } else {
        alert("Image upload fail ho gayi.");
    }
});




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

// --- 3. CRASH-PROOF NOTIFICATION SYSTEM WITH SERVICE WORKER & DEFAULT SOUND ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
    .then(reg => console.log('Service Worker Registered Setup Ready!', reg))
    .catch(err => console.log('Service Worker restricted on local origin', err));
}

function requestPermission() {
    if (window.Notification) { 
        window.Notification.requestPermission().then(permission => {
            if(permission === "granted") {
                sendPush("CityConnect Pro", "Notification system active ho gaya hai!", "shop-alerts");
            }
        }); 
    } else {
        console.log("Notification API not supported by this webview engine.");
    }
}

function sendPush(title, msg, channelTag) {
    if ('serviceWorker' in navigator && window.Notification && window.Notification.permission === "granted") {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, {
                body: msg,
                icon: 'logo.png',
                badge: 'logo.png',
                vibrate: [200, 100, 200],
                tag: channelTag || 'general-alerts', 
                renotify: true
            });
        }).catch(() => {
            fallbackLocalAlert(title, msg);
        });
    } else if (window.Notification && window.Notification.permission === "granted") {
        new window.Notification(title, { body: msg, icon: 'logo.png' });
    } else {
        fallbackLocalAlert(title, msg);
    }
}

function triggerTestNotification() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            if (registration.showNotification) {
                registration.showNotification("CityConnect Alerts Active", {
                    body: "Aapka Notification Channel process initiated! 🎉",
                    icon: 'logo.png',
                    badge: 'logo.png',
                    tag: 'shop-alerts', 
                    renotify: true
                });
            } else {
                fallbackLocalAlert("CityConnect Alerts", "Aapka Notification System background process active hai! 🎉");
            }
        }).catch(err => {
            fallbackLocalAlert("CityConnect Alerts", "Aapka Notification System background process active hai! 🎉");
        });
    } else {
        fallbackLocalAlert("CityConnect Alerts", "Aapka Notification System background process active hai! 🎉");
    };
}

function fallbackLocalAlert(title, msg) {
    console.log("Notification Fallback Log: " + title + " - " + msg);
}

db.ref('shops').limitToLast(1).on('child_added', (snap) => {
    const shop = snap.val();
    if (shop && shop.timestamp && (Date.now() - shop.timestamp < 60000)) {
        sendPush("Nayi Shop Live!", `${shop.name} ab aapke sheher mein live hai!`, "shop-alerts");
    }
});

// --- USER SESSION CONTROLLER SYNC ---
function initUserSession() {
    if(!localStorage.getItem('cc_guest_token')) {
        localStorage.setItem('cc_guest_token', 'GUEST-' + Math.floor(100000 + Math.random() * 900000));
    }
    globalGuestId = localStorage.getItem('cc_guest_token');

    if (firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                activeUserSession = user;
                const pName = document.getElementById('userProfileName');
                if(pName) pName.innerText = user.displayName || "My Profile";
            } else {
                activeUserSession = null;
                const pName = document.getElementById('userProfileName');
                if(pName) pName.innerText = "Guest User";
            }
            if(document.getElementById('trackingModal') && document.getElementById('trackingModal').style.display === 'block') {
                loadUserOrderHistory();
            }
        });
    }
}

// --- 4. UI & MODAL CONTROL ---
function openModal() { if(document.getElementById('shopModal')) document.getElementById('shopModal').style.display = 'block'; }
function closeModal() { if(document.getElementById('shopModal')) document.getElementById('shopModal').style.display = 'none'; }
function openEditModal() { if(document.getElementById('editModal')) document.getElementById('editModal').style.display = 'block'; }
function closeEditModal() { if(document.getElementById('editModal')) document.getElementById('editModal').style.display = 'none'; }
function closeDetails() { if(document.getElementById('detailsPage')) document.getElementById('detailsPage').style.display = 'none'; }
// Fixed mapping to use inside original template context seamlessly
function approve(key) { handleApproval(key); }
function reject(key) { handleRejection(key); }
function closeAdmin() { if(document.getElementById('adminPanel')) document.getElementById('adminPanel').style.display = 'none'; }

function openOrderModal() { if(document.getElementById('orderModal')) document.getElementById('orderModal').style.display = 'block'; }
function closeOrderModal() { if(document.getElementById('orderModal')) document.getElementById('orderModal').style.display = 'none'; }

function openTrackingModal() { 
    if(document.getElementById('trackingModal')) {
        document.getElementById('trackingModal').style.display = 'block'; 
        loadUserOrderHistory();
    }
}
function closeTrackingModal() { if(document.getElementById('trackingModal')) document.getElementById('trackingModal').style.display = 'none'; }

window.onclick = function(event) {
    const modals = ['shopModal', 'editModal', 'adminPanel', 'orderModal', 'trackingModal'];
    modals.forEach(id => {
        const m = document.getElementById(id);
        if (m && event.target == m) m.style.display = "none";
    });
}

// --- 5. DATA LOADING & FILTERS (WITH CITY + ITEM SEARCH) ---
function loadShops() {
    const cityEl = document.getElementById('cityFilter');
    const searchEl = document.getElementById('searchInput');
    const selectedCity = cityEl ? cityEl.value.toLowerCase() : 'all';
    const searchQuery = searchEl ? searchEl.value.toLowerCase() : '';

    db.ref('shops').on('value', snap => {
        const grid = document.getElementById('shopList');
        if(!grid) return;
        grid.innerHTML = "";
        
        if(!snap.exists()) {
            grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#64748b; padding:20px;">Koi bhi shop live nahi hai.</p>`;
            return;
        }

        snap.forEach(child => {
            const v = child.val();
            const shopCity = (v.city || "").toLowerCase();
            const shopName = (v.name || "").toLowerCase();

            const matchesSearch = shopName.includes(searchQuery) || shopCity.includes(searchQuery);
            const matchesCityFilter = (selectedCity === 'all' || shopCity === selectedCity);
            const matchesCat = (currentCategory === 'all' || v.cat === currentCategory);

            if(matchesSearch && matchesCityFilter && matchesCat) {
                const card = document.createElement('div');
                card.className = "shop-card";
                card.onclick = () => openDetails(child.key);
                card.innerHTML = `
                    <img src="${v.img || 'https://via.placeholder.com/150'}" class="card-img" onerror="this.src='https://via.placeholder.com/150'">
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
    if(btn) btn.classList.add('active');
    currentCategory = cat;
    loadShops();
}

// --- 6. SHOP PROFILE DETAILS WITH DYNAMIC ITEM ORDERS ---
function openDetails(id) {
    currentShopKey = id; 
    if(document.getElementById('detailsPage')) {
        document.getElementById('detailsPage').style.display = 'block';
        document.getElementById('detailsPage').scrollTop = 0;
    }

    db.ref('shops/' + id).on('value', snap => {
        const v = snap.val();
        if(!v) return;
        if(document.getElementById('detName')) document.getElementById('detName').innerText = v.name;
        if(document.getElementById('detImg')) document.getElementById('detImg').src = v.img || 'https://via.placeholder.com/150';
        if(document.getElementById('detAddr')) document.getElementById('detAddr').innerHTML = `<b>Address:</b> ${v.addr}<br><b>City:</b> ${v.city}`;
        if(document.getElementById('detCallBtn')) document.getElementById('detCallBtn').href = "tel:" + v.phone;
        
        const mapCont = document.getElementById('map-container');
        if(v.mapLink && mapCont) {
            mapCont.style.display = "block";
            if(document.getElementById('mapLink')) document.getElementById('mapLink').href = v.mapLink;
        } else if(mapCont) { mapCont.style.display = "none"; }

        const updatesDiv = document.getElementById('liveUpdates');
        if(!updatesDiv) return;
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
                
                const cleanItemName = encodeURIComponent(upd.text.replace(/'|"/g, " ")); 
                
                div.innerHTML = `
                    <small>${upd.time || ''}</small>
                    <p>${upd.text}</p>
                    ${upd.img ? `<img src="${upd.img}">` : ''}
                    <button class="post-order-btn" onclick="openOrderFromPost('${cleanItemName}')">
                        <i class="fa fa-shopping-cart"></i> Order This Item
                    </button>
                `;
                updatesDiv.appendChild(div);
            });
        }
    });
}

// --- 7. POST SE DIRECT SPECIFIC ITEM ORDER TRIGGER ---
function openOrderFromPost(encodedItemName) {
    const itemName = decodeURIComponent(encodedItemName);
    openOrderModal();
    if(document.getElementById('ordItems')) {
        document.getElementById('ordItems').value = "Hi, mujhe aapki post se ye item chahiye:\n\"" + itemName + "\"\n\n[Baki details jaise Size, Color ya Quantity yahan likhein]";
    }
}

// --- 8. FIXED CUSTOMER ONLINE ORDER SYSTEM (CRASH PROOF FALLBACK) ---
function placeOrder() {
    const nameEl = document.getElementById('ordName');
    const phoneEl = document.getElementById('ordPhone');
    const addrEl = document.getElementById('ordAddr');
    const itemsEl = document.getElementById('ordItems');

    const custName = nameEl ? nameEl.value.trim() : '';
    const custPhone = phoneEl ? phoneEl.value.trim() : '';
    const custAddr = addrEl ? addrEl.value.trim() : '';
    const ordItems = itemsEl ? itemsEl.value.trim() : '';

    if(!custName || !custPhone || !custAddr || !ordItems) return alert("Saari details bharna zaroori hai!");

    const currentYear = new Date().getFullYear();
    const randomNumber = Math.floor(1000 + Math.random() * 9000); 
    const customOrderID = "CC-" + currentYear + "-" + randomNumber;
    const finalTrackingUID = activeUserSession ? activeUserSession.uid : globalGuestId;

    const orderData = {
        orderId: customOrderID, 
        shopKey: currentShopKey || "Global",
        userId: finalTrackingUID,
        customerName: custName,
        customerPhone: custPhone,
        customerAddress: custAddr,
        items: ordItems,
        status: "Pending",
        time: new Date().toLocaleString(),
        timestamp: Date.now()
    };

    db.ref('orders/' + customOrderID).set(orderData).then(() => {
        let localOrders = JSON.parse(localStorage.getItem('cc_user_orders') || "[]");
        localOrders.push(customOrderID);
        localStorage.setItem('cc_user_orders', JSON.stringify(localOrders));

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(customOrderID)
                .then(() => showOrderSuccessAlert(customOrderID))
                .catch(() => fallbackCopyText(customOrderID));
        } else {
            fallbackCopyText(customOrderID);
        }
    }).catch(err => alert("Database Error: " + err.message));
}

function fallbackCopyText(text) {
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed"; 
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    } catch (err) {
        console.log("Clipboard fallback copy action performed.");
    }
    showOrderSuccessAlert(text);
}

function showOrderSuccessAlert(id) {
    alert("🎉 Order Placed Successfully!\n\nAapki Tracking ID hai: " + id + "\n\n(ID ko note kar lein aur tracker mein paste karein!)");
    finalizeOrderUI();
}

function finalizeOrderUI() {
    closeOrderModal();
    if(document.getElementById('ordName')) document.getElementById('ordName').value = "";
    if(document.getElementById('ordPhone')) document.getElementById('ordPhone').value = "";
    if(document.getElementById('ordAddr')) document.getElementById('ordAddr').value = "";
    if(document.getElementById('ordItems')) document.getElementById('ordItems').value = "";
}

// --- 9. REAL-TIME ORDER TRACKING SYSTEM ---
function trackOrder() {
    const orderIdInput = document.getElementById('trackIdInput');
    if(!orderIdInput) return;
    const orderId = orderIdInput.value.trim();
    if(!orderId) return alert("Please enter a Tracking ID!");

    db.ref(`orders/${orderId}`).on('value', snap => {
        const order = snap.val();
        const trackResultDiv = document.getElementById('trackResult');
        if(!trackResultDiv) return;
        
        if(!order) {
            trackResultDiv.innerHTML = `<p style="text-align:center; color:red; font-weight:bold; padding:20px;">⚠️ Galt Tracking ID! Dubara check karein.</p>`;
            return;
        }

        db.ref(`shops/${order.shopKey}`).once('value', shopSnap => {
            const shopName = shopSnap.exists() ? shopSnap.val().name : "Local Shop";
            
            let statusBadgeColor = "#f59e0b";
            if(order.status === "Accepted") statusBadgeColor = "#3b82f6";
            if(order.status === "Out for Delivery") statusBadgeColor = "#8b5cf6";
            if(order.status === "Delivered") statusBadgeColor = "#10b981";

            trackResultDiv.innerHTML = `
                <div style="padding:15px; border-radius:10px; background:#f9fafb; border-left:5px solid ${statusBadgeColor}; line-height:1.6; text-align:left;">
                    <h3 style="margin:0 0 10px; color:${statusBadgeColor};">Status: ${order.status}</h3>
                    <p><b>Dukan:</b> ${shopName}</p>
                    <p><b>Items:</b> ${order.items}</p>
                    <p><b>Address:</b> ${order.customerAddress}</p>
                    <hr style="border:0; border-top:1px solid #eee; margin:10px 0;">
                    <div style="font-size:0.85rem; display:flex; justify-content:space-between; font-weight:bold; color:#666;">
                        <span style="${order.status==='Pending'?'color:#f59e0b':''}">${order.status==='Pending'?'⏳':'✅'} Pending</span>
                        <span style="${order.status==='Accepted'?'color:#3b82f6':''}">${(order.status==='Accepted'||order.status==='Out for Delivery'||order.status==='Delivered')?'✅':'⚪'} Accepted</span>
                        <span style="${order.status==='Out for Delivery'?'color:#8b5cf6':''}">${(order.status==='Out for Delivery'||order.status==='Delivered')?'✅':'⚪'} On Way</span>
                        <span style="${order.status==='Delivered'?'color:#10b981':''}">${order.status==='Delivered'?'🎉':'⚪'} Delivered</span>
                    </div>
                </div>
            `;
        });
    });
}

// --- 10. REGISTRATION & MERCHANT CONTROL ---
async function handleRegistration() {
    const nameEl = document.getElementById('regName');
    const cityEl = document.getElementById('regCity');
    const phoneEl = document.getElementById('regPhone');
    const fileEl = document.getElementById('imgFile');
    const btn = document.getElementById('submitBtn');

    const name = nameEl ? nameEl.value : '';
    const city = cityEl ? cityEl.value : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const file = fileEl && fileEl.files ? fileEl.files[0] : null;

    if(!name || !city || !phone || !file) return alert("Saari details bharna zaroori hai!");

    if(btn) { btn.innerText = "Processing..."; btn.disabled = true; }

    const url = await uploadToImgBB(file);
    if(url) {
        const data = {
            name, city, phone,
            cat: document.getElementById('regCat') ? document.getElementById('regCat').value : 'kirana',
            mapLink: document.getElementById('regMap') ? document.getElementById('regMap').value : '',
            pin: document.getElementById('regPin') ? document.getElementById('regPin').value : '',
            addr: document.getElementById('regAddr') ? document.getElementById('regAddr').value : '',
            img: url,
            timestamp: Date.now()
        };
        db.ref('pending_shops').push(data).then(() => {
            alert("Success! Admin approval ka wait karein.");
            location.reload();
        });
    } else {
        alert("Image upload fail ho gya, check api settings!");
        if(btn) { btn.innerText = "Register Shop"; btn.disabled = false; }
    }
}

async function verifyMerchant() {
    const phoneEl = document.getElementById('loginPhone');
    const pinEl = document.getElementById('loginPin');
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const pin = pinEl ? pinEl.value.trim() : '';

    if(!phone || !pin) return alert("Details daalein!");

    const snap = await db.ref('shops').orderByChild('phone').equalTo(phone).once('value');
    if(snap.exists()) {
        let match = false;
        snap.forEach(child => { if(child.val().pin == pin) { currentShopKey = child.key; match = true; }});
        if(match) {
            if(document.getElementById('editFormStep1')) document.getElementById('editFormStep1').style.display = 'none';
            if(document.getElementById('editFormStep2')) document.getElementById('editFormStep2').style.display = 'block';
            loadMerchantPosts(); 
            loadMerchantOrders(); 
        } else { alert("Galt PIN!"); }
    } else { alert("Not registered!"); }
}

async function postUpdate() {
    const textEl = document.getElementById('itemText');
    const fileEl = document.getElementById('itemFile');
    const text = textEl ? textEl.value.trim() : '';
    const file = fileEl && fileEl.files ? fileEl.files[0] : null;

    if(!text || !currentShopKey) return alert("Details bharein!");

    const btn = document.getElementById('postBtn');
    if(btn) { btn.disabled = true; btn.innerText = "Posting..."; }

    let imgUrl = "";
    if(file) imgUrl = await uploadToImgBB(file);

    const update = { text, img: imgUrl, time: new Date().toLocaleString(), timestamp: Date.now() };
    db.ref(`shops/${currentShopKey}/updates`).push(update).then(() => {
        alert("Post Live!");
        if(document.getElementById('itemText')) document.getElementById('itemText').value = ""; 
        if(btn) { btn.disabled = false; btn.innerText = "Post Live Now"; }
    });
}

// --- 11. MERCHANT PANEL ORDERS MANAGEMENT ---
function loadMerchantOrders() {
    db.ref('orders').orderByChild('shopKey').equalTo(currentShopKey).on('value', snap => {
        const list = document.getElementById('merchantOrderList');
        if(!list) return;
        list.innerHTML = "<h4>📦 Incoming Customer Orders</h4>";

        if(!snap.exists()) {
            list.innerHTML += `<p style="font-size: 0.8rem; color:#999; padding:10px;">Abhi koi live order nahi mila.</p>`;
            return;
        }

        snap.forEach(child => {
            const ord = child.val();
            const div = document.createElement('div');
            div.style = "padding:12px; border:1px solid #eee; background:#fff; margin-top:8px; border-radius:8px; font-size:0.85rem; text-align:left; line-height:1.5;";
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                    <b>Name: ${ord.customerName}</b>
                    <span style="font-size:0.75rem; background:#eaeaea; padding:2px 6px; border-radius:4px;">ID: ${child.key}</span>
                </div>
                <b>Phone:</b> <a href="tel:${ord.customerPhone}">${ord.customerPhone}</a><br>
                <b>Address:</b> ${ord.customerAddress}<br>
                <b>Items:</b> <span style="color:#d97706; font-weight:bold;">${ord.items}</span><br>
                <b>Status:</b> <span style="font-weight:bold; color:#2563eb;">${ord.status}</span><br>
                <div style="margin-top:10px; display:flex; gap:5px;">
                    <select onchange="updateOrderStatus('${child.key}', this.value)" style="padding:4px; font-size:0.8rem; border-radius:4px; flex:1;">
                        <option value="Pending" ${ord.status==='Pending'?'selected':''}>Pending</option>
                        <option value="Accepted" ${ord.status==='Accepted'?'selected':''}>Accept Order</option>
                        <option value="Out for Delivery" ${ord.status==='Out for Delivery'?'selected':''}>Out For Delivery</option>
                        <option value="Delivered" ${ord.status==='Delivered'?'selected':''}>Delivered ✅</option>
                    </select>
                </div>
            `;
            list.appendChild(div);
        });
    });
}

function updateOrderStatus(orderId, newStatus) {
    db.ref(`orders/${orderId}`).update({ status: newStatus })
    .then(() => alert(`Order Status badal kar: ${newStatus} kar diya gya hai.`))
    .catch(err => alert("Failed: " + err.message));
}

// --- 12. HELPERS ---
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
        if(!list) return;
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

// --- 13. ADMIN FUNCTIONS (UPDATED WITH GLOBAL ORDER VIEW) ---
function checkAdminPin() { 
    const pin = prompt("Admin PIN:");
    if(!pin) return;
    if(btoa(pin.trim()) === _0xAdmin) { 
        if(document.getElementById('adminPanel')) {
            document.getElementById('adminPanel').style.display = 'block'; 
            loadPending(); 
            loadAdminOrders(); 
        }
    } else { alert("Incorrect!"); }
}

function loadPending() {
    db.ref('pending_shops').on('value', snap => {
        const list = document.getElementById('pendingList');
        if(!list) return;
        list.innerHTML = "<h4>🏪 Pending Shop Approvals</h4>";

        if(!snap.exists()) {
            list.innerHTML += `<p style="font-size: 0.85rem; color:#999; padding:10px;">Koi nayi shop approval pending nahi hai.</p>`;
            return;
        }

        snap.forEach(child => {
            const v = child.val();
            const div = document.createElement('div');
            div.style = "padding:12px; border:1px solid #eee; background:#fff; margin-bottom:8px; border-radius:10px; font-size:0.85rem; text-align:left;";
            div.innerHTML = `
                <b>${v.name}</b> (${v.city})<br>
                <small>Phone: ${v.phone}</small><br>
                <small>Category: ${v.cat}</small><br><br>
                <button onclick="approve('${child.key}')" style="background:#10b981; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-weight:bold; cursor:pointer;">Approve</button>
                <button onclick="reject('${child.key}')" style="background:#ef4444; color:#fff; border:none; padding:6px 12px; border-radius:6px; margin-left:10px; font-weight:bold; cursor:pointer;">Reject</button>
            `;
            list.appendChild(div);
        });
    });
}

function handleApproval(key) {
    if(confirm("Confirm approve this merchant?")) {
        db.ref(`pending_shops/${key}`).once('value', snap => {
            if(snap.exists()) {
                const shopData = snap.val();
                db.ref(`shops/${key}`).set(shopData).then(() => {
                    db.ref(`pending_shops/${key}`).remove().then(() => {
                        alert("✅ Shop approved and live!");
                    });
                }).catch(err => alert("Approval failure: " + err.message));
            }
        });
    }
}

function handleRejection(key) {
    if(confirm("Are you sure to reject this request?")) {
        db.ref(`pending_shops/${key}`).remove().then(() => {
            alert("🗑️ Request rejected successfully.");
        }).catch(err => alert("Rejection database failure: " + err.message));
    }
}

function loadAdminOrders() {
    db.ref('orders').on('value', snap => {
        const list = document.getElementById('adminOrderList');
        if(!list) return;
        list.innerHTML = "<h4>📦 Global Customer Orders (All Shops)</h4>";

        if(!snap.exists()) {
            list.innerHTML += `<p style="font-size: 0.85rem; color:#999; padding:10px;">System mein koi order nahi mila.</p>`;
            return;
        }

        const ordersArray = [];
        snap.forEach(child => {
            ordersArray.unshift({ key: child.key, data: child.val() });
        });

        ordersArray.forEach(item => {
            const ord = item.data;
            const orderId = item.key;
            const div = document.createElement('div');
            
            let statusColor = "#f59e0b";
            if(ord.status === "Accepted") statusColor = "#3b82f6";
            if(ord.status === "Out for Delivery") statusColor = "#8b5cf6";
            if(ord.status === "Delivered") statusColor = "#10b981";

            div.style = `padding:12px; border:1px solid #eee; background:#f9fafb; border-left:5px solid ${statusColor}; margin-top:8px; border-radius:8px; font-size:0.85rem; text-align:left; line-height:1.5;`;
            
            db.ref(`shops/${ord.shopKey}`).once('value', shopSnap => {
                const shopName = shopSnap.exists() ? shopSnap.val().name : "Unknown/Deleted Shop";
                
                div.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                        <b>Customer: ${ord.customerName}</b>
                        <span style="font-size:0.75rem; background:#eaeaea; padding:2px 6px; border-radius:4px; font-weight:bold;">ID: ${orderId}</span>
                    </div>
                    <b>Target Shop:</b> <span style="color:#2563eb; font-weight:bold;">${shopName}</span><br>
                    <b>Phone:</b> <a href="tel:${ord.customerPhone}">${ord.customerPhone}</a><br>
                    <b>Address:</b> ${ord.customerAddress}<br>
                    <b>Items:</b> <span style="color:#d97706; font-weight:bold;">${ord.items}</span><br>
                    <b>Status:</b> <span style="font-weight:bold; color:${statusColor};">${ord.status}</span><br>
                    <div style="margin-top:10px; display:flex; gap:5px;">
                        <select onchange="updateOrderStatus('${orderId}', this.value)" style="padding:5px; font-size:0.8rem; border-radius:4px; flex:1; border:1px solid #ccc;">
                            <option value="Pending" ${ord.status==='Pending'?'selected':''}>Pending ⏳</option>
                            <option value="Accepted" ${ord.status==='Accepted'?'selected':''}>Accept Order ✅</option>
                            <option value="Out for Delivery" ${ord.status==='Out for Delivery'?'selected':''}>Out For Delivery 🚚</option>
                            <option value="Delivered" ${ord.status==='Delivered'?'selected':''}>Delivered 🎉</option>
                        </select>
                        <button onclick="deleteOrderFromAdmin('${orderId}')" style="background:#ef4444; color:#fff; border:none; padding:0 10px; border-radius:4px; cursor:pointer;" title="Delete Order">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                `;
            });
            list.appendChild(div);
        });
    });
}

function deleteOrderFromAdmin(orderId) {
    if(confirm("Kya aap is order ko system se permanent delete karna chahte hain?")) {
        db.ref(`orders/${orderId}`).remove()
        .then(() => alert("Order successfully deleted!"))
        .catch(err => alert("Error: " + err.message));
    }
}

// ==========================================
// [FIXED SECURE] 14. USERS ORDER HISTORY TRACKING SYNCHRONIZER
// ==========================================
function loadUserOrderHistory() {
    const trackResultDiv = document.getElementById("trackResult");
    if (!trackResultDiv) return;

    trackResultDiv.innerHTML = `<p style="text-align:center; padding:10px; font-size:0.85rem;">Aapke orders fetch ho rahe hain...</p>`;

    // Strict Check: Sirf current active user ya guest token hi filter query me jayega
    const activeSearchUID = activeUserSession ? activeUserSession.uid : globalGuestId;
    
    if (!activeSearchUID) {
        trackResultDiv.innerHTML = `<p style="text-align:center; color:#64748b; padding:20px; font-size:0.9rem;">Session clear. Koi tracking token nahi mila.</p>`;
        return;
    }

    // Direct Firebase Query: Kisi bhi haal me all users ka data load nahi hoga, sirf matching uid load hogi
    db.ref('orders').orderByChild('userId').equalTo(activeSearchUID).once('value', snapshot => {
        let ordersMap = {};

        if (snapshot.exists()) {
            snapshot.forEach(child => {
                ordersMap[child.key] = child.val();
            });
        }

        // Render functions me data pass karne se pehle cross check complete
        renderHistoryHTML(ordersMap, trackResultDiv);
    }).catch(err => {
        console.error("Order history security block failure:", err);
        trackResultDiv.innerHTML = `<p style="text-align:center; color:red; padding:10px;">Orders load karne me error aaya.</p>`;
    });
}

function renderHistoryHTML(ordersMap, targetDiv) {
    const entries = Object.entries(ordersMap).sort((a,b) => b[1].timestamp - a[1].timestamp);

    if (entries.length === 0) {
        targetDiv.innerHTML = `<p style="text-align:center; color:#64748b; padding:20px; font-size:0.9rem;">Aapka koi purana order nahi mila.</p>`;
        return;
    }

    let htmlContent = `<div style="display:flex; flex-direction:column; gap:10px; max-height:350px; overflow-y:auto;">`;
    let itemsProcessed = 0;
    const activeSearchUID = activeUserSession ? activeUserSession.uid : globalGuestId;

    entries.forEach(([orderId, order]) => {
        // Double-Layer Security Shield: Render hone se pehle loop ke andar bhi confirm karega ki dusre ka data leak na ho
        if (order.userId !== activeSearchUID) {
            itemsProcessed++;
            if (itemsProcessed === entries.length) {
                htmlContent += `</div>`;
                targetDiv.innerHTML = htmlContent;
            }
            return; // Skip if user ID doesn't match
        }

        db.ref(`shops/${order.shopKey}`).once('value', shopSnap => {
            const shopName = shopSnap.exists() ? shopSnap.val().name : "Local Merchant";
            let clr = "#eab308"; let bg = "#fef9c3";
            if (order.status === "Delivered") { clr = "#16a34a"; bg = "#dcfce7"; }
            if (order.status === "Cancelled") { clr = "#dc2626"; bg = "#fee2e2"; }

            htmlContent += `
                <div style="border:1px solid #e2e8f0; border-radius:8px; background:#fff; padding:12px; text-align:left;">
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem;">
                        <b>${shopName}</b>
                        <span style="background:${bg}; color:${clr}; padding:2px 8px; border-radius:10px; font-size:0.75rem; font-weight:bold;">${order.status || 'Pending'}</span>
                    </div>
                    <p style="margin:5px 0; font-size:0.85rem; color:#475569;">${order.items}</p>
                    <small style="color:#94a3b8; font-size:0.7rem;">ID: #${orderId}</small>
                </div>`;

            itemsProcessed++;
            if (itemsProcessed === entries.length) {
                htmlContent += `</div>`;
                targetDiv.innerHTML = htmlContent;
            }
        });
    });
}


// --- 15. WINDOW INITIALIZATION RUNNER ---
window.onload = () => {
    initUserSession();
    requestPermission();
    loadShops();
    const sInput = document.getElementById('searchInput');
    if(sInput) sInput.oninput = () => loadShops();
};
