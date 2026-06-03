/* ==========================================================================
   NEO-HELIOS APPLICATION LOGIC
   Core: Dual-Engine Multi-Agent AI (Ollama + Simulated NLP Router)
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. GLOBAL STATE DEFINITION
// --------------------------------------------------------------------------
const state = {
    guest: {
        name: "",
        room: "",
        luggageCount: 3,
        checkedIn: false
    },
    ambience: {
        lightsOn: true,
        shieldOn: false
    },
    activeAgent: "omni", // "omni" | "aria" | "dexter" | "celeste" | "valedictor"
    coreMode: "sim",    // "sim" | "ollama"
    ollama: {
        url: "http://localhost:11434",
        model: "llama3",
        status: "offline"
    },
    ledger: [],
    pricing: {
        lodging: 150,     // Daily base lodging cost
        sweeper: 25,      // Drone room cleaning
        dining: 45,       // Quantum fusion dinner
        towels: 10,       // Hydro-towels replenishing
        beachTour: 75,    // Neon Beach excursion
        hoverboard: 35,   // Hoverboard park pass
        cyberTower: 50    // Cyber Tower viewing tickets
    }
};

// Agent configuration meta
const AGENTS = {
    aria: {
        name: "ARIA",
        role: "Welcome Liaison",
        color: "var(--neon-cyan)",
        class: "aria-bubble",
        icon: "fa-handshake-angle",
        avatar: "fa-user-astronaut",
        sysPrompt: "You are ARIA.AI, the Welcomer Liaison at Neo-Helios Cyber-Hotel. Welcome guests with warm futuristic hospitality, register their luggage count, and speak in friendly tech jargon. Keep responses concise (2-3 sentences)."
    },
    dexter: {
        name: "DEXTER",
        role: "System Services",
        color: "var(--neon-magenta)",
        class: "dexter-bubble",
        icon: "fa-bell-concierge",
        avatar: "fa-cogs",
        sysPrompt: "You are DEXTER.AI, the System Services Operator at Neo-Helios. You handle cleaning, drone sweepers, fusion meals, and room items. You speak with high mechanical efficiency. When servicing room requests, explicitly state the dummy cost added to the bill (e.g. $25 for drone sweeper). Keep responses concise."
    },
    celeste: {
        name: "CELESTE",
        role: "Voyage Advisor",
        color: "var(--neon-purple)",
        class: "celeste-bubble",
        icon: "fa-compass",
        avatar: "fa-location-dot",
        sysPrompt: "You are CELESTE.AI, the cosmic Voyage Advisor. Recommed futuristic tourist sites (Neon Beach, Hoverboard Park, Cyber Tower) and book passes/excursions. Speak in an adventurous explorer style and note the charge added to their ledger. Keep responses concise."
    },
    valedictor: {
        name: "VALEDICTOR",
        role: "Farewell Core",
        color: "var(--neon-amber)",
        class: "valedictor-bubble",
        icon: "fa-door-open",
        avatar: "fa-user-shield",
        sysPrompt: "You are VALEDICTOR.AI, the Farewell Sentinel. Assist guests with checkouts, summarize stay, and serve randomized sci-fi slogans. Keep responses warm, epic, and concise."
    }
};

// --------------------------------------------------------------------------
// 2. SYSTEM INITIATION (BOOT PROCESS)
// --------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    // Start real-time telemetry clock
    updateTelemetryClock();
    setInterval(updateTelemetryClock, 1000);

    // Initial UI state setup
    updateLedgerUI();
    updateLuggageCount(0); // sync initial state display
    
    // Add default system logs to terminal viewport
    appendSystemLog("Quantum mainframe operational. Core-encryption: ACTIVE.");
    appendSystemLog("Welcome Node ARIA online. Ready for Guest check-in.");
});

// Telemetry clock tic-tac
function updateTelemetryClock() {
    const clockElem = document.getElementById("hud-time");
    if (clockElem) {
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        clockElem.textContent = timeStr;
    }
}

// --------------------------------------------------------------------------
// 3. CORE MODE CONTROLS (SIMULATOR VS. OLLAMA LIVE)
// --------------------------------------------------------------------------
function setMode(mode) {
    state.coreMode = mode;
    
    const btnSim = document.getElementById("btn-mode-sim");
    const btnOllama = document.getElementById("btn-mode-ollama");
    const configPanel = document.getElementById("ollama-config");
    const statusText = document.getElementById("status-text");
    const statusDot = document.getElementById("status-dot");

    if (mode === "sim") {
        btnSim.classList.add("active");
        btnOllama.classList.remove("active");
        configPanel.classList.add("hidden");
        statusText.textContent = "SIMULATION READY";
        statusText.className = "status-text text-online";
        statusDot.className = "status-dot online";
        appendSystemLog("Switched system logic to Simulated Offline Core.");
    } else {
        btnSim.classList.remove("active");
        btnOllama.classList.add("active");
        configPanel.classList.remove("hidden");
        
        // Trigger ping check
        pingOllama();
    }
}

async function pingOllama() {
    const urlInput = document.getElementById("ollama-url").value.trim();
    const statusText = document.getElementById("status-text");
    const statusDot = document.getElementById("status-dot");
    
    statusText.textContent = "PINGING OLLAMA...";
    statusText.className = "status-text font-mono";
    statusDot.className = "status-dot offline";

    try {
        const response = await fetch(`${urlInput}/api/tags`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            statusText.textContent = "OLLAMA CONNECTED";
            statusText.className = "status-text text-online";
            statusDot.className = "status-dot online";
            state.ollama.status = "online";
            appendSystemLog("Ollama API connection handshake SUCCESSFUL.");
        } else {
            throw new Error("HTTP failure");
        }
    } catch (e) {
        statusText.textContent = "CONNECTION ERROR";
        statusText.className = "status-text text-offline";
        statusDot.className = "status-dot offline";
        state.ollama.status = "offline";
        appendSystemLog("Ollama API handshake failed. Server might be offline.", true);
    }
}

// --------------------------------------------------------------------------
// 4. GUEST STATE & LIFECYCLE (CHECK-IN / CHECK-OUT)
// --------------------------------------------------------------------------
function updateLuggageCount(diff) {
    let current = state.guest.luggageCount + diff;
    if (current < 0) current = 0;
    if (current > 10) current = 10;
    state.guest.luggageCount = current;
    
    document.getElementById("luggage-count-display").textContent = current;
}

function performCheckIn() {
    const nameVal = document.getElementById("guest-name").value.trim();
    const roomVal = document.getElementById("room-num").value.trim();
    
    if (!nameVal) {
        alert("System error: Guest Identifier (Name) cannot be empty.");
        return;
    }
    if (!roomVal) {
        alert("System error: Room Deck Allocation cannot be empty.");
        return;
    }

    // Set guest state
    state.guest.name = nameVal;
    state.guest.room = roomVal;
    state.guest.checkedIn = true;

    // Trigger visual updates
    document.getElementById("checkin-panel").classList.add("hidden");
    document.getElementById("guest-details-panel").classList.remove("hidden");
    
    document.getElementById("active-guest-name").textContent = nameVal.toUpperCase();
    document.getElementById("active-room-display").textContent = `DECK ${roomVal}`;
    document.getElementById("active-luggage-display").textContent = `${state.guest.luggageCount} UNITS`;
    
    document.getElementById("billing-room-tag").textContent = `ROOM_${roomVal}`;

    // Add Base Lodging cost automatically
    addLedgerItem("Room Base Lodging", "lodging", 1, state.pricing.lodging, "ARIA");

    // HUD Biometric activity animation trigger
    animateBiometrics();

    // Trigger ARIA check-in welcome greeting
    appendSystemLog(`Guest ${nameVal} checked into Deck ${roomVal} with ${state.guest.luggageCount} bags.`);
    triggerAgentWelcome();
}

function performCheckOut() {
    if (!state.guest.checkedIn) return;
    
    appendSystemLog(`Initiating discharge sequence for ${state.guest.name}.`);
    
    // Trigger goodbye agent checkout response
    triggerAgentFarewell();
    
    // Reset guest state after animation delay or user logs
    setTimeout(() => {
        state.guest.checkedIn = false;
        state.guest.name = "";
        state.guest.room = "";
        
        // Reset registry deck panels
        document.getElementById("checkin-panel").classList.remove("hidden");
        document.getElementById("guest-details-panel").classList.add("hidden");
        document.getElementById("billing-room-tag").textContent = `ROOM_EMPTY`;

        // Clear ledger list
        state.ledger = [];
        updateLedgerUI();
        
        appendSystemLog("Mainframe reset. Guest record scrubbed.");
    }, 8000);
}

// Simulated room ambiance dials
function toggleAmbience(type) {
    if (!state.guest.checkedIn) return;
    
    const lightsBtn = document.getElementById("dial-lights");
    const shieldBtn = document.getElementById("dial-shield");

    if (type === 'lights') {
        state.ambience.lightsOn = !state.ambience.lightsOn;
        if (state.ambience.lightsOn) {
            lightsBtn.classList.add("active");
            lightsBtn.querySelector("span").textContent = "LIGHTS ON";
            appendSystemLog("Lux core set to 100% illumination.");
        } else {
            lightsBtn.classList.remove("active");
            lightsBtn.querySelector("span").textContent = "LIGHTS OFF";
            appendSystemLog("Ambient room photon emission deactivated.");
        }
    } else if (type === 'shield') {
        state.ambience.shieldOn = !state.ambience.shieldOn;
        if (state.ambience.shieldOn) {
            shieldBtn.classList.add("danger-active");
            shieldBtn.querySelector("span").textContent = "DEFENSE ON";
            appendSystemLog("Quantum blast deflection shields ENGAGED.", true);
        } else {
            shieldBtn.classList.remove("danger-active");
            shieldBtn.querySelector("span").textContent = "DEFENSE OFF";
            appendSystemLog("Quantum perimeter defense shields disengaged.");
        }
    }
}

// --------------------------------------------------------------------------
// 5. INTERACTIVE CHAT TRANSMISSION ENGINE
// --------------------------------------------------------------------------
function switchAgent(agentKey) {
    state.activeAgent = agentKey;
    
    // Update visual tab indicator class
    const tabs = document.querySelectorAll(".agent-tab");
    tabs.forEach(tab => {
        if (tab.getAttribute("data-agent") === agentKey) {
            tab.classList.add("active");
        } else {
            tab.classList.remove("active");
        }
    });

    // Animate central portal colors based on active agent
    const portalEmitter = document.getElementById("portal-emitter-text");
    const outerRing = document.querySelector(".portal-outer-ring-dashed");
    
    if (agentKey === 'omni') {
        portalEmitter.textContent = "SYSTEMS STABLE: OMNI";
        portalEmitter.style.color = "var(--neon-cyan)";
        outerRing.style.borderColor = "var(--neon-cyan)";
    } else {
        const agent = AGENTS[agentKey];
        portalEmitter.textContent = `SYSTEM ACTIVE: ${agent.name}`;
        portalEmitter.style.color = agent.color;
        outerRing.style.borderColor = agent.color;
    }
    
    appendSystemLog(`Quantum channel routed to channel: ${agentKey.toUpperCase()}`);
}

async function transmitMessage() {
    const inputField = document.getElementById("chat-input");
    const query = inputField.value.trim();
    if (!query) return;

    // Clear input
    inputField.value = "";

    // Append user message in viewport
    appendMessage("USER", query, "user", "fa-user");
    
    // Auto-scroll chat viewport
    scrollToChatBottom();

    // Check if guest is checked in. If not, only Welcomer (Aria) can respond.
    if (!state.guest.checkedIn) {
        showTypingIndicator("aria");
        setTimeout(() => {
            removeTypingIndicator();
            appendMessage("ARIA", "Greetings, traveler! I am Aria, Welcomer Core of Neo-Helios. Please check into your room deck first in the guest registry panel so our quantum grid can allocate your stay details!", "aria-bubble", "fa-handshake-angle");
            scrollToChatBottom();
        }, 1200);
        return;
    }

    // Determine target agent
    let targetAgentKey = state.activeAgent;
    if (targetAgentKey === "omni") {
        targetAgentKey = routeQuery(query);
        appendSystemLog(`OMNI Router: Auto-forwarding request to ${targetAgentKey.toUpperCase()} Core.`);
    }

    // Update active agent bio-monitor panel highlights
    highlightAgentBioMonitor(targetAgentKey);

    // Call AI Engine (Simulation or Ollama live)
    showTypingIndicator(targetAgentKey);
    
    let botResponse = "";
    
    if (state.coreMode === "ollama" && state.ollama.status === "online") {
        botResponse = await callOllamaAPI(targetAgentKey, query);
    } else {
        // Fallback or explicit Simulated responds
        botResponse = generateSimResponse(targetAgentKey, query);
    }
    
    // Parse output for potential charges to bill
    parseBillingTriggers(targetAgentKey, query, botResponse);
    
    // Deliver response
    setTimeout(() => {
        removeTypingIndicator();
        const agent = AGENTS[targetAgentKey];
        appendMessage(agent.name, botResponse, agent.class, agent.icon);
        scrollToChatBottom();
    }, 1500);
}

// Smart NLP Router for Omni-Core Tab
function routeQuery(text) {
    const query = text.toLowerCase();
    
    // Checkout keywords
    if (query.includes("checkout") || query.includes("check out") || query.includes("leave") || query.includes("goodbye") || query.includes("exit")) {
        return "valedictor";
    }
    
    // Service keywords
    if (query.includes("clean") || query.includes("sweeper") || query.includes("food") || query.includes("eat") || query.includes("dinner") || query.includes("towel") || query.includes("service") || query.includes("water") || query.includes("shampoo")) {
        return "dexter";
    }
    
    // Tour keywords
    if (query.includes("tour") || query.includes("visit") || query.includes("sight") || query.includes("excursion") || query.includes("where to go") || query.includes("attraction") || query.includes("beach") || query.includes("hoverboard") || query.includes("tower")) {
        return "celeste";
    }

    // Default welcoming response
    return "aria";
}

// --------------------------------------------------------------------------
// 6. LLM ENGINES: OLLAMA CORE CONNECTION
// --------------------------------------------------------------------------
async function callOllamaAPI(agentKey, query) {
    const agent = AGENTS[agentKey];
    const url = document.getElementById("ollama-url").value.trim();
    const model = document.getElementById("ollama-model").value.trim();

    try {
        const requestBody = {
            model: model,
            messages: [
                { role: "system", content: `${agent.sysPrompt} Guest Name is ${state.guest.name}, Room Deck ${state.guest.room}, Luggage units checked in: ${state.guest.luggageCount}.` },
                { role: "user", content: query }
            ],
            stream: false
        };

        const response = await fetch(`${url}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            return data.choices[0].message.content;
        } else {
            throw new Error("API error response");
        }
    } catch (e) {
        appendSystemLog("Ollama link timed out. Switched back to Simulation Core.", true);
        return `[SYSTEM ERROR - OLLAMA STANDBY] ${generateSimResponse(agentKey, query)}`;
    }
}

// --------------------------------------------------------------------------
// 7. HIGH-FIDELITY SIMULATION OFFLINE CORE
// --------------------------------------------------------------------------
function generateSimResponse(agentKey, userQuery) {
    const query = userQuery.toLowerCase();
    const name = state.guest.name;
    const room = state.guest.room;
    const bags = state.guest.luggageCount;

    if (agentKey === "aria") {
        if (query.includes("luggage") || query.includes("bag")) {
            return `Acknowledged, ${name}. Our automated hover-drones have cataloged your ${bags} luggage containers into vault ${room}. All products remain accounted for and secure.`;
        }
        const greets = [
            `Welcome to Neo-Helios Cyber-Hotel, ${name}! Your induction to room deck ${room} is fully verified. We are honored to host your consciousness in this sector.`,
            `Salutations, traveler ${name}. I am ARIA.AI. Your luggage items (${bags} units) are securely stored. What parameter can I configure for you today?`,
            `Quantum parameters are fully synced for Room ${room}, ${name}. Let me know if you need any service dispatches or excursions booked!`
        ];
        return greets[Math.floor(Math.random() * greets.length)];
    }

    if (agentKey === "dexter") {
        if (query.includes("clean") || query.includes("sweeper") || query.includes("sweep")) {
            return `Direct order received. Dispatching cybernetic drone sweeper unit to Deck ${room} immediately. A dummy service fee of $${state.pricing.sweeper} has been logged to your ledger.`;
        }
        if (query.includes("food") || query.includes("eat") || query.includes("dinner") || query.includes("tacos")) {
            return `Acknowledged, guest ${name}. Pre-heating quantum fusion oven... Reconstructing a high-nutrient molecular dinner. Sent to Deck ${room}. Charge registered: $${state.pricing.dining}.`;
        }
        if (query.includes("towel") || query.includes("shampoo") || query.includes("water")) {
            return `Initiating restocking cycle. Sending standard cyber-towels and hydrogen-infused hydration amenities to Deck ${room}. Charge registered: $${state.pricing.towels}.`;
        }
        return `Dexter System Services online. Room ${room} is stable. I can dispatch drone cleaning ($${state.pricing.sweeper}), fusion culinary delights ($${state.pricing.dining}), or towels ($${state.pricing.towels}) upon command.`;
    }

    if (agentKey === "celeste") {
        if (query.includes("beach") || query.includes("neon")) {
            return `Excellent choice! Booking exclusive VIP passes to Neon Beach. Holographic sunsets and plasma-waves await you. Added $${state.pricing.beachTour} to your hotel folio. Enjoy!`;
        }
        if (query.includes("hover") || query.includes("hoverboard") || query.includes("board")) {
            return `Thrilling! Registering hoverboard racing simulator passes. The antigravity tracks are fully active today. Fee of $${state.pricing.hoverboard} logged.`;
        }
        if (query.includes("tower") || query.includes("cyber")) {
            return `Securing tickets for the Cyber Tower Observation Deck. Observe the cloud-canyons from 1,000 meters above. Fee of $${state.pricing.cyberTower} recorded.`;
        }
        
        return `Hello explorer! Nearby sectors offer beautiful wonders: Neon Beach ($${state.pricing.beachTour}), Hoverboard Racing ($${state.pricing.hoverboard}), and Cyber Tower Viewports ($${state.pricing.cyberTower}). Ask me to book any excursion to add it to your ledger!`;
    }

    if (agentKey === "valedictor") {
        const slogans = [
            "May your quantum paths remain forever coherent!",
            "Journey safe through the digital grid, traveler!",
            "Live long, and let the network stay connected!",
            "The cosmic horizon is never the end of lines!"
        ];
        const randomSlogan = slogans[Math.floor(Math.random() * slogans.length)];
        return `Discharge protocol initiated. Thank you for utilizing Neo-Helios Cyber-Hotel, ${name}. Your check out is complete. ${randomSlogan}`;
    }
}

// --------------------------------------------------------------------------
// 8. BILING TRIGGER & TRANSACTION ANALYZER
// --------------------------------------------------------------------------
function parseBillingTriggers(agentKey, queryText, responseText) {
    const query = queryText.toLowerCase();
    const response = responseText.toLowerCase();

    // Check Service Charges (Dexter)
    if (agentKey === "dexter") {
        if (query.includes("clean") || query.includes("sweeper") || query.includes("sweep")) {
            addLedgerItem("Drone Room Cleaning", "service", 1, state.pricing.sweeper, "DEXTER");
        } else if (query.includes("food") || query.includes("eat") || query.includes("dinner") || query.includes("tacos")) {
            addLedgerItem("Molecular Fusion Dinner", "service", 1, state.pricing.dining, "DEXTER");
        } else if (query.includes("towel") || query.includes("shampoo") || query.includes("water")) {
            addLedgerItem("Cyber-Towel & Amenities", "service", 1, state.pricing.towels, "DEXTER");
        }
    }

    // Check Tour Charges (Celeste)
    if (agentKey === "celeste") {
        if (query.includes("beach") || query.includes("neon")) {
            addLedgerItem("Neon Beach VIP Excursion", "tour", 1, state.pricing.beachTour, "CELESTE");
        } else if (query.includes("hover") || query.includes("hoverboard") || query.includes("board")) {
            addLedgerItem("Hoverboard Anti-Grav Pass", "tour", 1, state.pricing.hoverboard, "CELESTE");
        } else if (query.includes("tower") || query.includes("cyber")) {
            addLedgerItem("Cyber Tower Sky Tickets", "tour", 1, state.pricing.cyberTower, "CELESTE");
        }
    }
}

function addLedgerItem(name, category, qty, cost, agent) {
    // Generate simple incremental ID
    const id = state.ledger.length + 1;
    
    state.ledger.push({ id, name, category, qty, cost, agent });
    
    // Re-calculate billing analytics & refresh UI
    updateLedgerUI();
    
    appendSystemLog(`Ledger Transaction: Posted $${cost} charge [ID: ${id}] via agent ${agent}.`);
}

function updateLedgerUI() {
    const rowsContainer = document.getElementById("ledger-rows");
    const emptyNotice = document.getElementById("empty-ledger-text");
    const totalTally = document.getElementById("billing-grand-total");
    
    if (!state.guest.checkedIn || state.ledger.length === 0) {
        rowsContainer.innerHTML = "";
        rowsContainer.appendChild(emptyNotice);
        totalTally.textContent = "$0";
        updateCategoryProgressRings(0, 0, 0);
        return;
    }

    // Remove empty notice if present
    if (rowsContainer.contains(emptyNotice)) {
        rowsContainer.innerHTML = "";
    }

    // Generate dynamic items list
    let grandTotal = 0;
    let categorySums = { lodging: 0, service: 0, tour: 0 };
    
    // Clear and rebuild
    rowsContainer.innerHTML = "";
    
    state.ledger.forEach((item, index) => {
        grandTotal += item.cost * item.qty;
        categorySums[item.category] += item.cost * item.qty;

        const row = document.createElement("div");
        row.className = `ledger-item-row ${item.category}-row`;
        
        // Stagger entrance animations
        row.style.animationDelay = `${index * 0.1}s`;
        
        row.innerHTML = `
            <div class="item-details">
                <span class="item-name">${item.name}</span>
                <span class="item-agent">&bull; ${item.agent.toUpperCase()} AI</span>
            </div>
            <span class="item-qty">x${item.qty}</span>
            <span class="item-cost">$${item.cost * item.qty}</span>
        `;
        
        rowsContainer.appendChild(row);
    });

    // Rolling visual total update
    animateRollingTotal(grandTotal);

    // Calculate percentage divisions
    const totalAlloc = grandTotal > 0 ? grandTotal : 1;
    const lodgingPct = Math.round((categorySums.lodging / totalAlloc) * 100);
    const servicePct = Math.round((categorySums.service / totalAlloc) * 100);
    const tourPct = Math.round((categorySums.tour / totalAlloc) * 100);

    updateCategoryProgressRings(lodgingPct, servicePct, tourPct);
}

function animateRollingTotal(targetVal) {
    const totalTally = document.getElementById("billing-grand-total");
    let currentVal = parseInt(totalTally.textContent.replace('$', '')) || 0;
    
    if (currentVal === targetVal) return;
    
    const diff = targetVal - currentVal;
    const step = Math.ceil(diff / 10);
    
    let timer = setInterval(() => {
        currentVal += step;
        if ((step > 0 && currentVal >= targetVal) || (step < 0 && currentVal <= targetVal)) {
            currentVal = targetVal;
            clearInterval(timer);
        }
        totalTally.textContent = `$${currentVal}`;
    }, 40);
}

function updateCategoryProgressRings(lodging, services, tours) {
    // Sync percentage labels
    document.getElementById("tally-lodging-pct").textContent = `${lodging}%`;
    document.getElementById("tally-services-pct").textContent = `${services}%`;
    document.getElementById("tally-tours-pct").textContent = `${tours}%`;

    // Sync SVG path strokes
    // SVGs have stroke-dasharray="strokePercentage, 100"
    document.getElementById("chart-lodging").setAttribute("stroke-dasharray", `${lodging}, 100`);
    document.getElementById("chart-services").setAttribute("stroke-dasharray", `${services}, 100`);
    document.getElementById("chart-tours").setAttribute("stroke-dasharray", `${tours}, 100`);
}

// --------------------------------------------------------------------------
// 9. HELPER FUNCTIONS & UI ANIMATION POLISH
// --------------------------------------------------------------------------
function appendSystemLog(msg, isAlert = false) {
    const viewport = document.getElementById("chat-viewport");
    
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    
    const log = document.createElement("div");
    log.className = `system-log font-mono ${isAlert ? 'alert-log' : ''}`;
    log.innerHTML = `
        <span class="time">[${timeStr}]</span>
        <span class="sig">[MAIN_CORE]</span>
        <span class="msg">${msg}</span>
    `;
    
    viewport.appendChild(log);
    scrollToChatBottom();
}

function appendMessage(sender, text, cssClass, icon) {
    const viewport = document.getElementById("chat-viewport");
    
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    
    const bubble = document.createElement("div");
    bubble.className = `chat-msg-bubble ${cssClass}`;
    
    bubble.innerHTML = `
        <div class="msg-avatar-core">
            <i class="fa-solid ${icon}"></i>
        </div>
        <div class="msg-body-deck">
            <div class="msg-hud-tag font-mono">
                <span>[${sender.toUpperCase()}]</span>
                <span>TIME: ${timeStr}</span>
            </div>
            <div class="msg-bubble-content">
                ${text}
            </div>
        </div>
    `;
    
    viewport.appendChild(bubble);
}

function showTypingIndicator(agentKey) {
    const viewport = document.getElementById("chat-viewport");
    const agent = AGENTS[agentKey];
    
    const bubble = document.createElement("div");
    bubble.className = `chat-msg-bubble ${agent.class} typing-indicator-bubble`;
    bubble.id = "typing-indicator";
    
    bubble.innerHTML = `
        <div class="msg-avatar-core">
            <i class="fa-solid ${agent.icon}"></i>
        </div>
        <div class="msg-body-deck">
            <div class="msg-hud-tag font-mono">
                <span>[${agent.name}.AI]</span>
                <span>PROCESSING...</span>
            </div>
            <div class="msg-bubble-content">
                <div class="typing-dots">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>
        </div>
    `;
    
    viewport.appendChild(bubble);
    scrollToChatBottom();
}

function removeTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) {
        indicator.remove();
    }
}

function scrollToChatBottom() {
    const chatViewport = document.getElementById("chat-viewport");
    chatViewport.scrollTop = chatViewport.scrollHeight;
}

// Biometric update triggers
function animateBiometrics() {
    const bars = document.querySelectorAll(".bio-bar");
    bars.forEach(bar => {
        const origWidth = bar.style.width;
        bar.style.width = "0%";
        setTimeout(() => {
            bar.style.width = origWidth;
        }, 300);
    });
}

function highlightAgentBioMonitor(agentKey) {
    // Reset all status lines
    const items = document.querySelectorAll(".bio-item");
    items.forEach(item => {
        item.classList.remove("active");
        item.querySelector(".bio-status").textContent = "STANDBY";
    });

    // Activate the triggered agent
    const activeItem = document.getElementById(`bio-${agentKey}`);
    if (activeItem) {
        activeItem.classList.add("active");
        activeItem.querySelector(".bio-status").textContent = "PROCESSING";
        
        // Revert status to ready after a short delay
        setTimeout(() => {
            activeItem.querySelector(".bio-status").textContent = "ONLINE";
        }, 2000);
    }
}

// Auto greets when checked in
function triggerAgentWelcome() {
    showTypingIndicator("aria");
    setTimeout(() => {
        removeTypingIndicator();
        appendMessage("ARIA", `Salutations, traveler ${state.guest.name}! I am ARIA, your Welcome Liaison at Neo-Helios. Your luggage core of ${state.guest.luggageCount} chests has been cataloged into Room Deck ${state.guest.room}. We have configured your life-support parameters to optimal comfort levels. Please engage our service channels (Omni-Core router or individual tabs) for amenities or local guidance!`, "aria-bubble", "fa-handshake-angle");
        scrollToChatBottom();
    }, 1500);
}

// Auto bids farewell on checkout
function triggerAgentFarewell() {
    showTypingIndicator("valedictor");
    setTimeout(() => {
        removeTypingIndicator();
        
        // Sum cost
        let grandTotal = 0;
        state.ledger.forEach(item => grandTotal += item.cost * item.qty);

        const farewellTemplates = [
            `Discharge protocols completed, traveler ${state.guest.name}. Room Base Deck ${state.guest.room} has been fully cleared of your biometric signature. Your cumulative dues are $${grandTotal}. May your quantum pathways remain forever coherent!`,
            `Decoupling quantum matrix from Room ${state.guest.room}, guest ${state.guest.name}. Finalizing transaction receipts totaling $${grandTotal}. Safe journey through the stars! Remember, the digital horizon is never the end!`,
            `Archiving guest log... ${state.guest.name}... Discharge finalized. Your luggage chests are disengaged and loaded to your landing shuttle. Ledger cleared at $${grandTotal}. Live long, and let the cosmic network guide your path!`
        ];

        const val = farewellTemplates[Math.floor(Math.random() * farewellTemplates.length)];
        appendMessage("VALEDICTOR", val, "valedictor-bubble", "fa-door-open");
        scrollToChatBottom();
    }, 1500);
}
