// ---------- 1. SETTINGS ----------
// Where the Flask server lives. If you change the port in app.py, change it here too.
const API_URL = "http://127.0.0.1:5000/api/coach";

// ---------- 2. GRAB THE PAGE ELEMENTS (once, up front) ----------
const nameInput = document.querySelector("#nameInput");
const sleepInput = document.querySelector("#sleepInput");
const waterInput = document.querySelector("#waterInput");
const stepsInput = document.querySelector("#stepsInput");
const button = document.querySelector("#btn");
const outParagraph = document.querySelector("#outcome");
const msgParagraph = document.querySelector("#message");
const errorParagraph = document.querySelector("#error");
const helloParagraph = document.querySelector("#greet");

// ---------- 3. RESET THE SCREEN ----------
// Empties every text area and hides every <h2>, so each run starts clean.
function clearResults() {
  errorParagraph.textContent = "";
  helloParagraph.textContent = "";
  outParagraph.textContent = "";
  msgParagraph.textContent = "";
  document.querySelectorAll("h2").forEach(heading => heading.hidden = true);
}

// ---------- 4. ANALYZE ----------
// "async" lets us use "await" inside, so the function can wait for the server
// without freezing the page.
async function analyze() {
  clearResults();

  // .value is always a string. Number() converts it. .trim() removes extra spaces.
  const name = nameInput.value.trim().toUpperCase();
  const sleep = Number(sleepInput.value);
  const water = Number(waterInput.value);
  const steps = Number(stepsInput.value);

  // --- Validation in the browser: fast feedback, no server trip needed ---
  if (name === "") {
    errorParagraph.textContent = "Please enter your name.";
    return;
  }

  // An empty box gives "", and Number("") is 0, so check the raw text too.
  if (sleepInput.value === "" || waterInput.value === "" || stepsInput.value === "") {
    errorParagraph.textContent = "Please fill in sleep, water, and steps.";
    return;
  }

  if (Number.isNaN(sleep) || Number.isNaN(water) || Number.isNaN(steps)) {
    errorParagraph.textContent = "Sleep, water, and steps must be numbers.";
    return;
  }

  if (sleep <= 0 || water <= 0 || steps <= 0) {
    errorParagraph.textContent = "Sleep, water, and steps must be greater than 0.";
    return;
  }

  if (sleep >= 24) {
    errorParagraph.textContent = "Sleep cannot exceed 24 hours.";
    return;
  }

  if (steps < 100) {
    errorParagraph.textContent = "Minimum step count is 100.";
    return;
  }

  // --- Ask the Flask server for the prediction ---
  button.disabled = true;                  // stop double-clicks while we wait
  button.textContent = "Thinking...";

  try {
    // fetch(url, options) sends the request. "await" pauses until the reply arrives.
    const response = await fetch(API_URL, {
      method: "POST",                                    // we are SENDING data
      headers: { "Content-Type": "application/json" },   // tells Flask the body is JSON
      body: JSON.stringify({ name, sleep, water, steps }) // JS object -> JSON text
    });

    // Read the JSON first. Flask sends JSON even for errors ({"error": "..."}).
    const result = await response.json();

    // fetch does NOT throw on 400/500, so we check response.ok ourselves.
    if (!response.ok) {
      errorParagraph.textContent = result.error;
      return;
    }

    // --- Show the results (same display code as before, now using server data) ---
    helloParagraph.textContent = `Hello ${name}, here is your daily coach results:`;

    const goal = result.hitGoal ? "Hit goal" : "Missed goal";
    outParagraph.textContent =
      `[${goal.toUpperCase()}] (${(result.confidence * 100).toFixed(0)}% confidence • Score: ${result.score}/100)`;
    msgParagraph.textContent = result.message;

    document.querySelectorAll("h2[hidden]").forEach(heading => heading.hidden = false);
  } catch (error) {
    // Runs only if the request itself failed: server off, wrong port, no network.
    errorParagraph.textContent = "Could not reach the coach server. Is app.py running?";
  } finally {
    // finally runs after try/catch, whether it succeeded, failed, or returned early.
    button.disabled = false;
    button.textContent = "Get my coaching";
  }
}

// ---------- 5. EVENTS ----------
button.addEventListener("click", analyze);

// Pressing Enter in any input also runs analyze().
[nameInput, sleepInput, waterInput, stepsInput].forEach(function (box) {
  box.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      analyze();
    }
  });
});