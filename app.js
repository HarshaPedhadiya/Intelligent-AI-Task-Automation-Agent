const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const planButton = document.querySelector("#plan-button");
const workflowTitle = document.querySelector("#workflow-title");
const workflowBadge = document.querySelector("#workflow-badge");
const workflowBody = document.querySelector("#workflow-body");
const toast = document.querySelector("#toast");
let toastTimer;
let currentPlan;

document.querySelectorAll(".suggestion").forEach((button) => {
  button.addEventListener("click", () => {
    taskInput.value = button.dataset.example;
    taskInput.focus();
  });
});

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const task = taskInput.value.trim();
  if (!task) return;

  setPlanning(true);
  try {
    const response = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not build this workflow.");
    currentPlan = result;
    renderPlan(result);
  } catch (error) {
    showToast(error.message || "Something went wrong while building the workflow.");
  } finally {
    setPlanning(false);
  }
});

function setPlanning(isPlanning) {
  planButton.disabled = isPlanning;
  planButton.querySelector("span:nth-child(2)").textContent = isPlanning ? "Thinking..." : "Build workflow";
}

function renderPlan(plan) {
  workflowTitle.textContent = "Review your workflow";
  setBadge("Ready to review", "ready");

  const summary = document.createElement("p");
  summary.className = "plan-summary";
  summary.textContent = plan.summary;

  const stepList = document.createElement("div");
  stepList.className = "step-list";
  plan.steps.forEach((step, index) => {
    const item = document.createElement("article");
    item.className = "step";

    const number = document.createElement("span");
    number.className = "step-number";
    number.textContent = String(index + 1);

    const content = document.createElement("div");
    content.className = "step-content";
    const title = document.createElement("strong");
    title.className = "step-title";
    title.textContent = step.title;
    const description = document.createElement("p");
    description.className = "step-description";
    description.textContent = `${step.action} ${step.details}`.trim();
    content.append(title, description);

    const app = document.createElement("span");
    app.className = "step-app";
    app.textContent = step.app;
    item.append(number, content, app);
    stepList.append(item);
  });

  const actions = document.createElement("div");
  actions.className = "workflow-actions";
  const disclaimer = document.createElement("span");
  disclaimer.className = "workflow-disclaimer";
  disclaimer.textContent = "Demo only — no external tools will be changed.";
  const runButton = document.createElement("button");
  runButton.className = "secondary-button";
  runButton.type = "button";
  runButton.textContent = "▶  Simulate run";
  runButton.addEventListener("click", () => {
    if (runButton.dataset.completed === "true") {
      const steps = [...workflowBody.querySelectorAll(".step")];
      steps.forEach((item, index) => {
        item.classList.remove("complete");
        item.querySelector(".step-number").textContent = String(index + 1);
        item.querySelector(".step-status")?.remove();
      });
      runButton.dataset.completed = "false";
    }
    simulateRun(runButton);
  });
  actions.append(disclaimer, runButton);

  workflowBody.replaceChildren(summary, stepList, actions);
}

async function simulateRun(button) {
  if (!currentPlan || button.disabled) return;
  const steps = [...workflowBody.querySelectorAll(".step")];
  button.disabled = true;
  button.textContent = "Running preview...";
  setBadge("Simulating", "running");

  for (const [index, step] of steps.entries()) {
    await new Promise((resolve) => window.setTimeout(resolve, 550));
    step.classList.add("complete");
    const status = document.createElement("span");
    status.className = "step-status";
    status.textContent = "Previewed";
    step.append(status);
    step.querySelector(".step-number").textContent = "✓";
    if (index === steps.length - 1) {
      button.textContent = "✓  Preview complete";
      setBadge("Preview complete", "done");
      button.disabled = false;
      button.dataset.completed = "true";
    }
  }
}

function setBadge(text, state) {
  workflowBadge.className = `review-badge ${state}`;
  workflowBadge.lastChild.textContent = text;
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 5000);
}
