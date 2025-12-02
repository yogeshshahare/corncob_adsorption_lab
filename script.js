// Helper: clamp number into [min, max]
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Core empirical model (mirrors your Python dataset logic)
function calcRemoval(time, dose, conc) {
    if (time <= 0 || dose <= 0 || conc <= 0) {
        return NaN;
    }

    // Normalisation similar to Python
    const t_norm = time / 120.0;          // 10–120 mapped roughly 0.08–1
    const d_norm = dose / 1.0;           // 0.1–1.0 mapped 0.1–1
    const c_norm = (80 - conc) / 70.0;   // 10 -> ~1, 80 -> 0

    let eff = 60 + 30 * t_norm + 20 * d_norm + 10 * c_norm;

    // Clamp between 60 and 99
    eff = clamp(eff, 60, 99);

    return Math.round(eff * 10) / 10; // 1 decimal
}

// DOM references
const timeInput = document.getElementById("time-input");
const timeRange = document.getElementById("time-range");
const doseInput = document.getElementById("dose-input");
const doseRange = document.getElementById("dose-range");
const concInput = document.getElementById("conc-input");
const concRange = document.getElementById("conc-range");

const btnPredict = document.getElementById("btn-predict");
const btnPresetOptimal = document.getElementById("btn-preset-optimal");

const resultValue = document.getElementById("result-value");
const resultTagQuality = document.getElementById("result-tag-quality");
const resultTagRange = document.getElementById("result-tag-range");
const interpretationList = document.getElementById("interpretation-list");

// Sync number ↔ range controls
function setupSync(numberInput, rangeInput) {
    rangeInput.addEventListener("input", () => {
        numberInput.value = rangeInput.value;
    });

    numberInput.addEventListener("change", () => {
        const val = parseFloat(numberInput.value);
        if (!isNaN(val)) {
            rangeInput.value = clamp(val, parseFloat(rangeInput.min), parseFloat(rangeInput.max));
        }
    });
}

setupSync(timeInput, timeRange);
setupSync(doseInput, doseRange);
setupSync(concInput, concRange);

// Preset typical optimal conditions
btnPresetOptimal.addEventListener("click", () => {
    timeRange.value = 90;
    doseRange.value = 0.75;
    concRange.value = 40;

    timeInput.value = 90;
    doseInput.value = 0.75;
    concInput.value = 40;
});

// Main prediction handler
btnPredict.addEventListener("click", () => {
    const time = parseFloat(timeInput.value || timeRange.value);
    const dose = parseFloat(doseInput.value || doseRange.value);
    const conc = parseFloat(concInput.value || concRange.value);

    if (isNaN(time) || isNaN(dose) || isNaN(conc)) {
        alert("Please enter valid numeric values for all fields.");
        return;
    }

    const eff = calcRemoval(time, dose, conc);

    if (isNaN(eff)) {
        resultValue.textContent = "--";
        resultTagQuality.textContent = "Invalid input";
        resultTagQuality.className = "tag danger";
        return;
    }

    resultValue.textContent = eff.toFixed(1);

    // Quality tag based on efficiency
    if (eff >= 95) {
        resultTagQuality.textContent = "Excellent removal";
        resultTagQuality.className = "tag";
    } else if (eff >= 90) {
        resultTagQuality.textContent = "Very good removal";
        resultTagQuality.className = "tag";
    } else if (eff >= 85) {
        resultTagQuality.textContent = "Good removal";
        resultTagQuality.className = "tag secondary";
    } else {
        resultTagQuality.textContent = "Moderate removal";
        resultTagQuality.className = "tag warning";
    }

    // Range tag
    const inTimeRange = time >= 10 && time <= 120;
    const inDoseRange = dose >= 0.1 && dose <= 1.0;
    const inConcRange = conc >= 10 && conc <= 80;

    if (inTimeRange && inDoseRange && inConcRange) {
        resultTagRange.textContent = "Within recommended lab range";
        resultTagRange.className = "tag secondary";
    } else {
        resultTagRange.textContent = "Outside typical lab range";
        resultTagRange.className = "tag warning";
    }

    // Interpretation bullets
    const items = [];

    if (time < 40) {
        items.push("Contact time is relatively low; increasing time may improve removal.");
    } else if (time > 100) {
        items.push("Contact time is high; system may already be near equilibrium.");
    } else {
        items.push("Contact time is in a typical equilibrium range for adsorption studies.");
    }

    if (dose < 0.25) {
        items.push("Adsorbent dose is low; higher dose usually increases removal efficiency.");
    } else if (dose > 0.8) {
        items.push("Adsorbent dose is high; additional dose may give diminishing returns.");
    } else {
        items.push("Adsorbent dose is in a balanced range for efficient removal.");
    }

    if (conc > 60) {
        items.push("Initial dye concentration is high; percentage removal may decrease due to site saturation.");
    } else if (conc < 20) {
        items.push("Initial dye concentration is low; high percentage removal is easier to achieve.");
    } else {
        items.push("Initial dye concentration is in a moderate range.");
    }

    items.push("This is a simulation based on an empirical model. For final design, confirm with experimental data.");

    interpretationList.innerHTML = "";
    items.forEach((text) => {
        const li = document.createElement("li");
        li.textContent = text;
        interpretationList.appendChild(li);
    });
});

// Initialise with default recommended values
btnPresetOptimal.click();
btnPredict.click();
