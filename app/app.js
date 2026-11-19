// Leonida Trophy Guide — tracker logic. No network: the only fetch is the
// bundled data file, and progress lives in localStorage.
const STORE_KEY = "gta6-leonida-tracker-v1";
const DATA_URL = "data/trophies.json";

const $ = (id) => document.getElementById(id);
const listEl = $("trophyList");
const detailEl = $("detailPane");
const missableListEl = $("missableList");

let trophies = [];
let earned = new Set();
let selectedId = null;

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.earned)) earned = new Set(parsed.earned);
    if (typeof parsed.spoilersHidden === "boolean") {
      $("spoilerToggle").checked = parsed.spoilersHidden;
    }
  } catch {
    earned = new Set();
  }
}

function save() {
  localStorage.setItem(
    STORE_KEY,
    JSON.stringify({ earned: [...earned].sort((a, b) => a - b), spoilersHidden: $("spoilerToggle").checked }),
  );
}

function spoilersOn() {
  return $("spoilerToggle").checked;
}

function isHidden(t) {
  return t.spoiler && spoilersOn() && !earned.has(t.id);
}

function displayName(t) {
  return isHidden(t) ? "Hidden story trophy" : t.name;
}

function displayDesc(t) {
  return isHidden(t)
    ? "Hidden on PlayStation until earned. Earn it to reveal its name and description."
    : t.description;
}

function gradeLabel(t) {
  return t.grade[0].toUpperCase() + t.grade.slice(1);
}

function kindLabel(t) {
  const labels = {
    story: "Story", side: "Side strand", activity: "Activity", collection: "Collectible",
    crime: "Crime", partner: "Partner", stunt: "Stunt", combat: "Combat",
    exploration: "Exploration", economy: "Economy", misc: "Hidden / misc",
    platinum: "Platinum", completion: "100% completion",
  };
  return labels[t.kind] || t.kind;
}

function filters() {
  return {
    q: $("searchBox").value.trim().toLowerCase(),
    grade: $("gradeFilter").value,
    kind: $("kindFilter").value,
    status: $("statusFilter").value,
    missableOnly: $("missableOnly").checked,
  };
}

function visible(t) {
  const f = filters();
  if (f.grade !== "all" && t.grade !== f.grade) return false;
  if (f.kind !== "all" && t.kind !== f.kind) return false;
  if (f.status === "earned" && !earned.has(t.id)) return false;
  if (f.status === "todo" && earned.has(t.id)) return false;
  if (f.missableOnly && !t.missable) return false;
  if (f.q) {
    const hay = `${t.name} ${t.description} ${t.guide} ${t.chapter || ""} ${t.target || ""}`.toLowerCase();
    if (!hay.includes(f.q)) return false;
  }
  return true;
}

function trophyRow(t) {
  const li = document.createElement("li");
  li.className = "trophy" + (earned.has(t.id) ? " earned" : "") + (selectedId === t.id ? " selected" : "");
  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = earned.has(t.id);
  box.setAttribute("aria-label", `Earned: ${t.name}`);
  box.addEventListener("click", (ev) => {
    ev.stopPropagation();
    toggleEarned(t.id, box.checked);
  });
  const body = document.createElement("div");
  const h = document.createElement("h3");
  h.textContent = displayName(t);
  const d = document.createElement("p");
  d.className = "desc";
  d.textContent = displayDesc(t);
  const meta = document.createElement("div");
  meta.className = "meta";
  const tags = [
    ["grade-" + t.grade, gradeLabel(t)],
    [null, kindLabel(t)],
    [null, t.target || ""],
  ];
  if (t.missable) tags.push(["miss", "Missable — one-attempt setup"]);
  for (const [cls, text] of tags) {
    if (!text) continue;
    const s = document.createElement("span");
    s.className = "tag" + (cls ? " " + cls : "");
    s.textContent = text;
    meta.append(s);
  }
  body.append(h, d, meta);
  const mark = document.createElement("span");
  mark.className = "earned-mark";
  mark.textContent = earned.has(t.id) ? "✓ Earned" : "";
  li.append(box, body, mark);
  li.addEventListener("click", () => showDetail(t.id));
  return li;
}

function renderList() {
  listEl.replaceChildren();
  const shown = trophies.filter(visible);
  for (const t of shown) listEl.append(trophyRow(t));
  $("emptyMsg").hidden = shown.length > 0;
  const total = trophies.length;
  $("listHint").textContent =
    `Showing ${shown.length} of ${total} trophies · ${earned.size} earned · ` +
    `${trophies.filter((t) => t.missable).length} missable in total.`;
  missableListEl.replaceChildren();
  for (const t of trophies.filter((x) => x.missable)) missableListEl.append(trophyRow(t));
  $("missableCount").textContent = trophies.filter((t) => t.missable).length;
}

function renderProgress() {
  $("earnedCount").textContent = earned.size;
  $("progressFill").style.width = `${(earned.size / Math.max(1, trophies.length)) * 100}%`;
  const byGrade = {};
  for (const t of trophies) {
    if (earned.has(t.id)) byGrade[t.grade] = (byGrade[t.grade] || 0) + 1;
  }
  const totals = {};
  for (const t of trophies) totals[t.grade] = (totals[t.grade] || 0) + 1;
  $("gradeCounts").textContent = ["platinum", "gold", "silver", "bronze"]
    .map((g) => `${gradeLabel({ grade: g })} ${byGrade[g] || 0}/${totals[g] || 0}`)
    .join(" · ");
  $("platinumNote").textContent =
    earned.size >= 54
      ? "Platinum earned — Vice Got a Price! is yours."
      : `Platinum: Vice Got a Price! unlocks at 54 / 54 — ${54 - earned.size} to go.`;
}

function toggleEarned(id, on) {
  if (on) earned.add(id);
  else earned.delete(id);
  save();
  renderProgress();
  renderList();
  if (selectedId === id) showDetail(id);
}

function showDetail(id) {
  selectedId = id;
  const t = trophies.find((x) => x.id === id);
  if (!t) return;
  detailEl.replaceChildren();
  const h = document.createElement("h2");
  h.textContent = displayName(t);
  const off = document.createElement("p");
  off.className = "official";
  off.textContent = `Official: “${displayDesc(t)}” — ${gradeLabel(t)}`;
  const g = document.createElement("p");
  g.textContent = isHidden(t)
    ? "This story trophy is hidden until you earn it. Its guide is revealed with it, so the story stays unspoiled."
    : t.guide;
  detailEl.append(h, off, g);
  if (!isHidden(t)) {
    const stepsTitle = document.createElement("h3");
    stepsTitle.textContent = "Steps";
    const ol = document.createElement("ol");
    for (const s of t.steps || []) {
      const li = document.createElement("li");
      li.textContent = s;
      ol.append(li);
    }
    const src = document.createElement("p");
    src.className = "sources";
    src.textContent = "Sources: " + (t.sources || []).join(" · ");
    const meta = document.createElement("p");
    meta.className = "sources";
    meta.textContent =
      `Kind: ${kindLabel(t)} · Target: ${t.target || "—"} · ` +
      (t.missable ? "Missable: needs a specific setup in one attempt — retry if it fails." : "Not missable: cumulative or story progress.");
    detailEl.append(stepsTitle, ol, meta, src);
  }
  document.querySelectorAll(".trophy.selected").forEach((el) => el.classList.remove("selected"));
  renderList();
}

const STAGES = [
  {
    title: "Play the story",
    text: "Chapters 1 to 4, the finale, and the named missions along the way. This stage alone earns the 12 story trophies plus the gold finale trophy.",
    kinds: ["story"],
  },
  {
    title: "Side strands and contacts",
    text: "Finish Andy, Kenton, Billy, Randy and Tyrone, Bret's hunt, and 8 stranger strands. Do a strand's missions as they appear so none is left half-done.",
    kinds: ["side"],
  },
  {
    title: "Activities and skills",
    text: "The sampler (9 activity types), 42 Shooting Range golds, 14 drone race wins, 20 different race wins, fishing against Cal, one arcade game, bowling, and 50 challenges.",
    kinds: ["activity"],
  },
  {
    title: "Collectibles and exploration",
    text: "18 meditation spots, 3 card sets, 100 WAiNK spots, 100 vehicles, all 52 areas of Leonida, and the Ocean Beach cocktail. Start WAiNK early — it is the longest grind.",
    kinds: ["collection", "exploration"],
  },
  {
    title: "Crime, economy and cleanup",
    text: "Partner trophies, robberies and vaults, the one-attempt missables, $250,000 laundered, $100,000 spent, 8 garages, 10 Scooter Bros registrations, 250 stunts — then 100% completion and the platinum.",
    kinds: ["partner", "crime", "stunt", "combat", "economy", "misc", "completion", "platinum"],
  },
];

function renderRoadmap() {
  const ol = $("stageList");
  ol.replaceChildren();
  for (const stage of STAGES) {
    const li = document.createElement("li");
    const h = document.createElement("h3");
    h.textContent = stage.title;
    const p = document.createElement("p");
    p.textContent = stage.text;
    const inStage = trophies.filter((t) => stage.kinds.includes(t.kind));
    const done = inStage.filter((t) => earned.has(t.id)).length;
    const c = document.createElement("p");
    c.innerHTML = "";
    const strong = document.createElement("span");
    strong.className = "count";
    strong.textContent = `${done} / ${inStage.length} trophies in this stage`;
    c.append(strong, document.createTextNode(` — ${inStage.map((t) => t.name).join(", ")}`));
    li.append(h, p, c);
    ol.append(li);
  }
}

function exportProgress() {
  const blob = new Blob(
    [JSON.stringify({ game: "Grand Theft Auto VI", exported: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b) }, null, 2)],
    { type: "application/json" },
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "gta6-trophy-progress.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const ids = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(ids)) throw new Error("no earned list");
      const valid = new Set(trophies.map((t) => t.id));
      earned = new Set(ids.filter((n) => valid.has(n)));
      save();
      renderProgress();
      renderList();
      renderRoadmap();
      alert(`Imported ${earned.size} earned trophies.`);
    } catch {
      alert("That file is not a valid progress export.");
    }
  };
  reader.readAsText(file);
}

function switchView(name) {
  for (const btn of document.querySelectorAll(".tab")) {
    btn.classList.toggle("active", btn.dataset.view === name);
  }
  $("view-checklist").hidden = name !== "checklist";
  $("view-roadmap").hidden = name !== "roadmap";
  $("view-missables").hidden = name !== "missables";
  $("controls").style.display = name === "checklist" ? "" : "none";
  if (name === "roadmap") renderRoadmap();
}

async function boot() {
  const res = await fetch(DATA_URL);
  const data = await res.json();
  trophies = data.trophies;
  loadSaved();
  renderProgress();
  renderList();
  renderRoadmap();
  for (const el of ["searchBox", "gradeFilter", "kindFilter", "statusFilter", "missableOnly"]) {
    $(el).addEventListener("input", renderList);
  }
  $("spoilerToggle").addEventListener("change", () => { save(); renderList(); if (selectedId) showDetail(selectedId); });
  for (const btn of document.querySelectorAll(".tab")) {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  }
  $("exportBtn").addEventListener("click", exportProgress);
  $("importFile").addEventListener("change", (ev) => {
    if (ev.target.files[0]) importProgress(ev.target.files[0]);
    ev.target.value = "";
  });
  $("resetBtn").addEventListener("click", () => {
    if (confirm("Clear all earned trophies?")) {
      earned = new Set();
      selectedId = null;
      detailEl.innerHTML = '<p class="detail-empty">Select a trophy to read its guide, steps and sources.</p>';
      save();
      renderProgress();
      renderList();
      renderRoadmap();
    }
  });
  // Deep-link a view or a grade: ?view=roadmap, ?grade=silver, ?spoiler=off
  const params = new URLSearchParams(location.search);
  if (params.get("grade")) {
    $("gradeFilter").value = params.get("grade");
    renderList();
  }
  if (params.get("spoiler") === "off") {
    $("spoilerToggle").checked = false;
    renderList();
  }
  if (params.get("view") && ["checklist", "roadmap", "missables"].includes(params.get("view"))) {
    switchView(params.get("view"));
  }
  if (params.get("trophy")) {
    const id = Number(params.get("trophy"));
    if (trophies.some((t) => t.id === id)) showDetail(id);
  }
}

boot();
