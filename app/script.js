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

// FORCE TEST VIA BELL ICON - BYPASSING SECURE ORIGIN AND NOTIFICATION OBJECT CRASHES
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
    if (shop.timestamp && (Date.now() - shop.timestamp < 60000)) {
        sendPush("Nayi Shop Live!", `${shop.name} ab aapke sheher mein live hai!`, "shop-alerts");
    }
});

// --- 4. UI & MODAL CONTROL ---
function openModal() { document.getElementById('shopModal').style.display = 'block'; }
function closeModal() { document.getElementById('shopModal').style.display = 'none'; }
function openEditModal() { document.getElementById('editModal').style.display = 'block'; }
function closeEditModal() { document.getElementById('editModal').style.display = 'none'; }
function closeDetails() { document.getElementById('detailsPage').style.display = 'none'; }
function closeAdmin() { document.getElementById('adminPanel').style.display = 'none'; }

function openOrderModal() { document.getElementById('orderModal').style.display = 'block'; }
function closeOrderModal() { document.getElementById('orderModal').style.display = 'none'; }
function openTrackingModal() { document.getElementById('trackingModal').style.display = 'block'; }
function closeTrackingModal() { document.getElementById('trackingModal').style.display = 'none'; }

window.onclick = function(event) {
    const modals = ['shopModal', 'editModal', 'adminPanel', 'orderModal', 'trackingModal'];
    modals.forEach(id => {
        const m = document.getElementById(id);
        if (event.target == m) m.style.display = "none";
    });
}

// --- 5. DATA LOADING & FILTERS (WITH CITY + ITEM SEARCH) ---
function loadShops() {
    const selectedCity = document.getElementById('cityFilter').value.toLowerCase();
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();

    db.ref('shops').on('value', snap => {
        const grid = document.getElementById('shopList');
        if(!grid) return;
        grid.innerHTML = "";
        
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

// --- 6. SHOP PROFILE DETAILS WITH DYNAMIC ITEM ORDERS ---
function openDetails(id) {
    currentShopKey = id; 
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
                
                const cleanItemName = encodeURIComponent(upd.text.replace(/'|"/g, " ")); 
                
                div.innerHTML = `
                    <small>${upd.time}</small>
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
    document.getElementById('ordItems').value = "Hi, mujhe aapki post se ye item chahiye:\n\"" + itemName + "\"\n\n[Baki details jaise Size, Color ya Quantity yahan likhein]";
}

// --- 8. FIXED CUSTOMER ONLINE ORDER SYSTEM (CRASH PROOF FALLBACK) ---
function placeOrder() {
    const custName = document.getElementById('ordName').value.trim();
    const custPhone = document.getElementById('ordPhone').value.trim();
    const custAddr = document.getElementById('ordAddr').value.trim();
    const ordItems = document.getElementById('ordItems').value.trim();

    if(!custName || !custPhone || !custAddr || !ordItems) return alert("Saari details bharna zaroori hai!");

    const currentYear = new Date().getFullYear();
    const randomNumber = Math.floor(1000 + Math.random() * 9000); 
    const customOrderID = "CC-" + currentYear + "-" + randomNumber;

    const orderData = {
        orderId: customOrderID, 
        shopKey: currentShopKey,
        customerName: custName,
        customerPhone: custPhone,
        customerAddress: custAddr,
        items: ordItems,
        status: "Pending",
        time: new Date().toLocaleString(),
        timestamp: Date.now()
    };

    db.ref('orders/' + customOrderID).set(orderData).then(() => {
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
    document.getElementById('ordName').value = "";
    document.getElementById('ordPhone').value = "";
    document.getElementById('ordAddr').value = "";
    document.getElementById('ordItems').value = "";
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
                <div style="padding:15px; border-radius:10px; background:#f9fafb; border-left:5px solid ${statusBadgeColor}; line-height:1.6;">
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
            loadMerchantOrders(); 
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
        btn.disabled = false; btn.innerText = "Post Live Now";
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
    if(btoa(pin) === _0xAdmin) { 
        document.getElementById('adminPanel').style.display = 'block'; 
        loadPending(); 
        loadAdminOrders(); // Admin panel khulte hi saare orders load honge
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
            div.style = "padding:12px; border:1px solid #eee; background:#fff; margin-bottom:8px; border-radius:10px; font-size:0.85rem;";
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

// ADMIN DASHBOARD KE LIYE GLOBAL ORDERS LISTENER
function loadAdminOrders() {
    db.ref('orders').on('value', snap => {
        const list = document.getElementById('adminOrderList');
        if(!list) return;
        list.innerHTML = "<h4>📦 Global Customer Orders (All Shops)</h4>";

        if(!snap.exists()) {
            list.innerHTML += `<p style="font-size: 0.85rem; color:#999; padding:10px;">System mein koi order nahi mila.</p>`;
            return;
        }

        // Saare orders ko reverse order (latest first) mein dikhane ke liye array banayenge
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
            
            // Shop details fetch karke naam dikhane ke liye
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

// Admin panel se kisi fake/galt order ko delete karne ke liye helper function
function deleteOrderFromAdmin(orderId) {
    if(confirm("Kya aap is order ko system se permanent delete karna chahte hain?")) {
        db.ref(`orders/${orderId}`).remove()
        .then(() => alert("Order successfully deleted!"))
        .catch(err => alert("Error: " + err.message));
    }
}


window.onload = () => {
    requestPermission();
    loadShops();
    const sInput = document.getElementById('searchInput');
    if(sInput) sInput.oninput = () => loadShops();
};
