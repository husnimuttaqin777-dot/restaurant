// ============================================
// Kitchen Order Hub - Main Application Logic
// ============================================

// --- State ---
let orders = [];
let completedOrders = [];
let orderIdCounter = 1000;
let soundEnabled = true;
let timerInterval = null;

// --- Audio Context for Notification Sound ---
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playNotificationSound() {
    if (!soundEnabled) return;
    try {
        initAudio();
        // Pleasant two-tone chime
        const now = audioCtx.currentTime;
        
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.15);
            gain.gain.setValueAtTime(0.15, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.4);
        });
    } catch (e) {
        console.log('Audio not available');
    }
}

function playCompleteSound() {
    if (!soundEnabled) return;
    try {
        initAudio();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1046.5, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
    } catch (e) {}
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('sound-btn');
    btn.innerHTML = soundEnabled 
        ? '<i data-lucide="volume-2" class="w-4 h-4"></i>'
        : '<i data-lucide="volume-x" class="w-4 h-4"></i>';
    btn.classList.toggle('text-blue-400', soundEnabled);
    lucide.createIcons();
    showToast(soundEnabled ? '🔊 Sound enabled' : '🔇 Sound disabled', 'info');
}

// --- Menu Items Pool ---
const menuItems = [
    { name: 'Margherita Pizza', prepTime: 15, price: 14.99, category: 'Pizza' },
    { name: 'Pepperoni Pizza', prepTime: 18, price: 16.99, category: 'Pizza' },
    { name: 'Grilled Salmon', prepTime: 22, price: 24.99, category: 'Main' },
    { name: 'Caesar Salad', prepTime: 8, price: 11.99, category: 'Salad' },
    { name: 'Ribeye Steak (Medium)', prepTime: 25, price: 32.99, category: 'Main' },
    { name: 'Chicken Alfredo Pasta', prepTime: 20, price: 18.99, category: 'Pasta' },
    { name: 'Tom Yum Soup', prepTime: 12, price: 9.99, category: 'Soup' },
    { name: 'Double Cheeseburger', prepTime: 14, price: 13.99, category: 'Burger' },
    { name: 'Fish & Chips', prepTime: 18, price: 15.99, category: 'Main' },
    { name: 'Mushroom Risotto', prepTime: 22, price: 19.99, category: 'Main' },
    { name: 'Garlic Bread', prepTime: 5, price: 5.99, category: 'Side' },
    { name: 'Tiramisu', prepTime: 3, price: 8.99, category: 'Dessert' },
    { name: 'Club Sandwich', prepTime: 10, price: 12.99, category: 'Sandwich' },
    { name: 'French Fries', prepTime: 8, price: 4.99, category: 'Side' },
    { name: 'Prawn Tempura', prepTime: 12, price: 14.99, category: 'Appetizer' },
    { name: 'Lamb Chops', prepTime: 24, price: 28.99, category: 'Main' },
    { name: 'Spicy Pad Thai', prepTime: 16, price: 15.99, category: 'Pasta' },
    { name: 'New York Cheesecake', prepTime: 3, price: 9.99, category: 'Dessert' },
    { name: 'Cobb Salad', prepTime: 10, price: 13.99, category: 'Salad' },
    { name: 'BBQ Wings (8pcs)', prepTime: 18, price: 12.99, category: 'Appetizer' },
];

const specialNotes = [
    'No onions please',
    'Extra sauce on the side',
    'Well done',
    'Rare / medium rare',
    'Allergic to nuts',
    'Gluten-free if possible',
    'Extra cheese',
    'No spice / mild only',
    'Dressing on the side',
    'Substitute fries for salad',
    'Birthday celebration! 🎂',
    'VIP customer',
    '',
    '',
    '',
];

const serverNames = ['Alex', 'Jordan', 'Sam', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie'];

// --- Generate Random Order ---
function generateOrder() {
    const tableNum = Math.floor(Math.random() * 20) + 1;
    const numItems = Math.floor(Math.random() * 4) + 1;
    const items = [];
    const usedIndices = new Set();
    
    for (let i = 0; i < numItems; i++) {
        let idx;
        do {
            idx = Math.floor(Math.random() * menuItems.length);
        } while (usedIndices.has(idx));
        usedIndices.add(idx);
        
        const item = menuItems[idx];
        const qty = Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 2 : 1;
        items.push({
            ...item,
            quantity: qty,
            note: Math.random() < 0.3 ? specialNotes[Math.floor(Math.random() * specialNotes.length)] : '',
        });
    }

    const maxPrepTime = Math.max(...items.map(i => i.prepTime));
    const priority = maxPrepTime >= 22 ? 'high' : maxPrepTime >= 14 ? 'medium' : 'low';

    return {
        id: ++orderIdCounter,
        table: tableNum,
        items: items,
        status: 'new',
        priority: priority,
        createdAt: new Date(),
        acceptedAt: null,
        readyAt: null,
        completedAt: null,
        server: serverNames[Math.floor(Math.random() * serverNames.length)],
        totalAmount: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        estimatedPrepTime: maxPrepTime,
        guests: Math.floor(Math.random() * 4) + 1,
    };
}

// --- Simulate New Order ---
function simulateNewOrder() {
    const order = generateOrder();
    orders.push(order);
    playNotificationSound();
    renderOrders();
    showToast(`🆕 New order from Table ${order.table}!`, 'new');
    autoSimulate();
}

let autoSimulateTimeout = null;

function autoSimulate() {
    if (autoSimulateTimeout) clearTimeout(autoSimulateTimeout);
    const delay = Math.random() * 15000 + 8000; // 8-23 seconds
    autoSimulateTimeout = setTimeout(() => {
        simulateNewOrder();
    }, delay);
}

// --- Order Actions ---
function acceptOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    order.status = 'preparing';
    order.acceptedAt = new Date();
    renderOrders();
    showToast(`🔥 Table ${order.table} order is being prepared`, 'preparing');
}

function markReady(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    order.status = 'ready';
    order.readyAt = new Date();
    renderOrders();
    playCompleteSound();
    showToast(`✅ Table ${order.table} order is ready to serve!`, 'ready');
}

function completeOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    order.status = 'completed';
    order.completedAt = new Date();
    completedOrders.unshift(order);
    orders = orders.filter(o => o.id !== orderId);
    renderOrders();
    showToast(`🎉 Table ${order.table} order served!`, 'completed');
}

function cancelOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    orders = orders.filter(o => o.id !== orderId);
    renderOrders();
    showToast(`❌ Table ${order.table} order cancelled`, 'error');
}

// --- Format Time ---
function formatTime(date) {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getElapsedMinutes(date) {
    if (!date) return 0;
    return Math.floor((new Date() - date) / 60000);
}

function getTimerClass(order) {
    const baseTime = order.status === 'new' ? order.createdAt : order.acceptedAt;
    if (!baseTime) return '';
    const elapsed = getElapsedMinutes(baseTime);
    if (order.priority === 'high') {
        if (elapsed >= 10) return 'timer-danger';
        if (elapsed >= 5) return 'timer-warn';
    } else {
        if (elapsed >= 20) return 'timer-danger';
        if (elapsed >= 12) return 'timer-warn';
    }
    return '';
}

function getElapsedString(order) {
    const baseTime = order.status === 'new' ? order.createdAt : order.acceptedAt;
    if (!baseTime) return '';
    const elapsed = getElapsedMinutes(baseTime);
    if (elapsed < 1) return 'Just now';
    if (elapsed === 1) return '1 min ago';
    return `${elapsed} min ago`;
}

// --- Render Orders ---
function renderOrders() {
    const newOrders = orders.filter(o => o.status === 'new');
    const preparingOrders = orders.filter(o => o.status === 'preparing');
    const readyOrders = orders.filter(o => o.status === 'ready');

    renderColumn('column-new', 'empty-new', newOrders, 'new');
    renderColumn('column-preparing', 'empty-preparing', preparingOrders, 'preparing');
    renderColumn('column-ready', 'empty-ready', readyOrders, 'ready');

    // Update stats
    const stats = {
        'stat-new': newOrders.length,
        'stat-preparing': preparingOrders.length,
        'stat-ready': readyOrders.length,
        'stat-completed': completedOrders.length,
    };

    Object.entries(stats).forEach(([id, count]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = count;
        const mel = document.getElementById(id + '-m');
        if (mel) mel.textContent = count;
    });

    // Update counts in column headers
    document.getElementById('count-new').textContent = newOrders.length;
    document.getElementById('count-preparing').textContent = preparingOrders.length;
    document.getElementById('count-ready').textContent = readyOrders.length;

    lucide.createIcons();
}

function renderColumn(containerId, emptyId, orderList, status) {
    const container = document.getElementById(containerId);
    const empty = document.getElementById(emptyId);

    // Remove existing order cards
    container.querySelectorAll('.order-card').forEach(el => el.remove());

    if (orderList.length === 0) {
        empty.classList.remove('hidden');
        return;
    }

    empty.classList.add('hidden');

    // Sort: high priority first
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    orderList.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    orderList.forEach(order => {
        const card = createOrderCard(order, status);
        container.appendChild(card);
    });
}

function createOrderCard(order, status) {
    const card = document.createElement('div');
    card.className = `order-card p-4 relative ${order.priority === 'high' && status !== 'ready' ? 'urgent' : ''} ${order.priority === 'high' && getElapsedMinutes(order.createdAt) >= 10 && status === 'new' ? 'pulse-urgent' : ''} priority-${order.priority}`;
    card.id = `order-${order.id}`;

    const priorityBadge = {
        high: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-500/20 text-red-400">Urgent</span>',
        medium: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-500/20 text-orange-400">Medium</span>',
        low: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400">Normal</span>',
    };

    const statusBadge = {
        new: '<span class="badge-new px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">New</span>',
        preparing: '<span class="badge-preparing px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Preparing</span>',
        ready: '<span class="badge-ready px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Ready</span>',
    };

    const timerClass = getTimerClass(order);
    const elapsedStr = getElapsedString(order);

    let actionsHtml = '';
    if (status === 'new') {
        actionsHtml = `
            <div class="flex gap-2 mt-3">
                <button onclick="acceptOrder(${order.id})" class="btn-action btn-accept flex-1 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2">
                    <i data-lucide="check" class="w-4 h-4"></i> Accept
                </button>
                <button onclick="cancelOrder(${order.id})" class="btn-action btn-cancel px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        `;
    } else if (status === 'preparing') {
        actionsHtml = `
            <div class="flex gap-2 mt-3">
                <button onclick="markReady(${order.id})" class="btn-action btn-ready flex-1 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2">
                    <i data-lucide="check-check" class="w-4 h-4"></i> Mark Ready
                </button>
                <button onclick="cancelOrder(${order.id})" class="btn-action btn-cancel px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        `;
    } else if (status === 'ready') {
        actionsHtml = `
            <div class="flex gap-2 mt-3">
                <button onclick="completeOrder(${order.id})" class="btn-action btn-done flex-1 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2">
                    <i data-lucide="delivery" class="w-4 h-4"></i> Served
                </button>
                <button onclick="showOrderDetail(${order.id})" class="btn-action bg-[#222633] text-gray-400 px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:text-white">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                </button>
            </div>
        `;
    }

    const itemsHtml = order.items.map(item => `
        <div class="item-row py-2 flex items-start gap-3">
            <span class="inline-flex items-center justify-center min-w-[24px] h-[24px] bg-[#222633] rounded-lg text-xs font-bold text-gray-400">${item.quantity}×</span>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-200">${item.name}</p>
                ${item.note ? `<p class="text-xs text-orange-400 mt-0.5 flex items-center gap-1"><i data-lucide="message-circle" class="w-3 h-3"></i>${item.note}</p>` : ''}
            </div>
            <span class="text-xs font-medium text-gray-500 whitespace-nowrap">$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    card.innerHTML = `
        <div class="flex items-start justify-between mb-3 cursor-pointer" onclick="showOrderDetail(${order.id})">
            <div class="flex items-center gap-2">
                <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 text-orange-400 font-bold text-sm">
                    <i data-lucide="armchair" class="w-4 h-4 mr-1"></i>${order.table}
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-bold text-white">Table ${order.table}</span>
                        ${statusBadge[status]}
                        ${priorityBadge[order.priority]}
                    </div>
                    <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-xs text-gray-500 ${timerClass}" data-order-id="${order.id}">${elapsedStr}</span>
                        <span class="text-xs text-gray-600">•</span>
                        <span class="text-xs text-gray-500">${order.server}</span>
                    </div>
                </div>
            </div>
            <div class="text-right">
                <p class="text-sm font-bold text-white">$${order.totalAmount.toFixed(2)}</p>
                <p class="text-[10px] text-gray-500">${order.guests} ${order.guests === 1 ? 'guest' : 'guests'} • ${formatTime(order.createdAt)}</p>
            </div>
        </div>
        <div class="bg-[#0f1117] rounded-xl px-3 py-1">
            ${itemsHtml}
        </div>
        ${actionsHtml}
    `;

    return card;
}

// --- Timer Update ---
function updateTimers() {
    orders.forEach(order => {
        const timerEl = document.querySelector(`[data-order-id="${order.id}"]`);
        if (timerEl) {
            const baseTime = order.status === 'new' ? order.createdAt : order.acceptedAt;
            if (!baseTime) return;
            const elapsed = getElapsedMinutes(baseTime);
            if (elapsed < 1) {
                timerEl.textContent = 'Just now';
            } else if (elapsed === 1) {
                timerEl.textContent = '1 min ago';
            } else {
                timerEl.textContent = `${elapsed} min ago`;
            }
            
            // Update timer class
            const priority = order.priority;
            if (priority === 'high' && elapsed >= 10) {
                timerEl.className = 'text-xs timer-danger';
            } else if (priority === 'high' && elapsed >= 5) {
                timerEl.className = 'text-xs timer-warn';
            } else if (elapsed >= 20) {
                timerEl.className = 'text-xs timer-danger';
            } else if (elapsed >= 12) {
                timerEl.className = 'text-xs timer-warn';
            } else {
                timerEl.className = 'text-xs text-gray-500';
            }
        }
    });
}

// --- Show Order Detail Modal ---
function showOrderDetail(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById('order-modal');
    const body = document.getElementById('modal-body');

    const statusColors = {
        new: 'from-blue-500 to-indigo-500',
        preparing: 'from-orange-500 to-red-500',
        ready: 'from-green-500 to-emerald-500',
    };

    const statusLabels = {
        new: 'New Order',
        preparing: 'Preparing',
        ready: 'Ready to Serve',
    };

    const itemsHtml = order.items.map(item => `
        <div class="flex items-center justify-between py-3 border-b border-[#2a2e3d]">
            <div class="flex-1">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-white">${item.quantity}×</span>
                    <span class="text-sm text-gray-200">${item.name}</span>
                </div>
                ${item.note ? `<p class="text-xs text-orange-400 mt-1 ml-7">📝 ${item.note}</p>` : ''}
            </div>
            <span class="text-sm font-medium text-gray-400">$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    body.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-white">Order #${order.id}</h2>
            <button onclick="closeModal()" class="text-gray-400 hover:text-white transition-colors">
                <i data-lucide="x" class="w-5 h-5"></i>
            </button>
        </div>
        
        <div class="bg-gradient-to-r ${statusColors[order.status]} rounded-xl p-4 mb-4">
            <div class="flex items-center justify-between text-white">
                <div>
                    <p class="text-2xl font-bold">Table ${order.table}</p>
                    <p class="text-sm opacity-90">${statusLabels[order.status]}</p>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-bold">$${order.totalAmount.toFixed(2)}</p>
                    <p class="text-sm opacity-90">${order.items.reduce((s, i) => s + i.quantity, 0)} items</p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="bg-[#0f1117] rounded-xl p-3">
                <p class="text-xs text-gray-500 mb-1">Server</p>
                <p class="text-sm font-semibold text-white flex items-center gap-1"><i data-lucide="user" class="w-3 h-3"></i> ${order.server}</p>
            </div>
            <div class="bg-[#0f1117] rounded-xl p-3">
                <p class="text-xs text-gray-500 mb-1">Guests</p>
                <p class="text-sm font-semibold text-white flex items-center gap-1"><i data-lucide="users" class="w-3 h-3"></i> ${order.guests} ${order.guests === 1 ? 'person' : 'people'}</p>
            </div>
            <div class="bg-[#0f1117] rounded-xl p-3">
                <p class="text-xs text-gray-500 mb-1">Est. Prep Time</p>
                <p class="text-sm font-semibold text-white flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> ${order.estimatedPrepTime} min</p>
            </div>
            <div class="bg-[#0f1117] rounded-xl p-3">
                <p class="text-xs text-gray-500 mb-1">Priority</p>
                <p class="text-sm font-semibold capitalize ${order.priority === 'high' ? 'text-red-400' : order.priority === 'medium' ? 'text-orange-400' : 'text-blue-400'}">${order.priority}</p>
            </div>
        </div>

        <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Items</h3>
        <div>${itemsHtml}</div>

        <div class="flex items-center justify-between mt-4 pt-3 border-t border-[#2a2e3d]">
            <span class="text-sm text-gray-400">Total</span>
            <span class="text-lg font-bold text-white">$${order.totalAmount.toFixed(2)}</span>
        </div>

        <div class="mt-4 text-xs text-gray-500">
            <p>Order placed: ${formatTime(order.createdAt)} ${order.acceptedAt ? '• Accepted: ' + formatTime(order.acceptedAt) : ''} ${order.readyAt ? '• Ready: ' + formatTime(order.readyAt) : ''}</p>
        </div>
    `;

    modal.classList.remove('hidden');
    lucide.createIcons();
}

function closeModal() {
    document.getElementById('order-modal').classList.add('hidden');
}

// --- History Modal ---
function showHistory() {
    const modal = document.getElementById('history-modal');
    const list = document.getElementById('history-list');

    if (completedOrders.length === 0) {
        list.innerHTML = `
            <div class="text-center py-12">
                <i data-lucide="archive" class="w-12 h-12 mx-auto text-gray-600 mb-3"></i>
                <p class="text-gray-500">No completed orders yet</p>
            </div>
        `;
    } else {
        list.innerHTML = completedOrders.slice(0, 50).map(order => `
            <div class="flex items-center justify-between py-3 border-b border-[#2a2e3d]">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                        ${order.table}
                    </div>
                    <div>
                        <p class="text-sm font-medium text-white">Table ${order.table} • #${order.id}</p>
                        <p class="text-xs text-gray-500">${order.items.reduce((s, i) => s + i.quantity, 0)} items • ${formatTime(order.completedAt)}</p>
                    </div>
                </div>
                <span class="text-sm font-bold text-gray-400">$${order.totalAmount.toFixed(2)}</span>
            </div>
        `).join('');
    }

    modal.classList.remove('hidden');
    lucide.createIcons();
}

function closeHistory() {
    document.getElementById('history-modal').classList.add('hidden');
}

// --- Toast Notifications ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const bgColors = {
        new: 'from-blue-500/20 to-indigo-500/20 border-blue-500/40',
        preparing: 'from-orange-500/20 to-red-500/20 border-orange-500/40',
        ready: 'from-green-500/20 to-emerald-500/20 border-green-500/40',
        completed: 'from-purple-500/20 to-violet-500/20 border-purple-500/40',
        error: 'from-red-500/20 to-red-500/20 border-red-500/40',
        info: 'from-gray-500/20 to-gray-500/20 border-gray-500/40',
    };

    toast.className = `notification-bar bg-gradient-to-r ${bgColors[type] || bgColors.info} border rounded-xl px-4 py-3 text-sm font-medium text-white backdrop-blur-md`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Keyboard Shortcuts ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeHistory();
    }
    // Press N for new simulated order
    if (e.key === 'n' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
        simulateNewOrder();
    }
});

// --- Initialize ---
function init() {
    // Start with a couple of sample orders
    const order1 = generateOrder();
    order1.id = ++orderIdCounter;
    order1.createdAt = new Date(Date.now() - 300000); // 5 min ago
    orders.push(order1);

    const order2 = generateOrder();
    order2.id = ++orderIdCounter;
    order2.status = 'preparing';
    order2.acceptedAt = new Date(Date.now() - 180000); // 3 min ago
    orders.push(order2);

    const order3 = generateOrder();
    order3.id = ++orderIdCounter;
    order3.status = 'new';
    order3.createdAt = new Date(Date.now() - 60000); // 1 min ago
    order3.priority = 'high';
    orders.push(order3);

    renderOrders();
    lucide.createIcons();

    // Update timers every 5 seconds
    timerInterval = setInterval(updateTimers, 5000);

    // Auto-simulate orders
    autoSimulate();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);