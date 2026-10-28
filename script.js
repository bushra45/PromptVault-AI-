const DEFAULT_CATEGORIES = ["Writing", "Marketing", "Coding", "Image Generation", "Video", "Business", "Study", "Other"];
const SAMPLE_PROMPTS = [
  {title:"Social Media Caption Writer",category:"Marketing",tool:"ChatGPT",content:"Act as a social media content strategist. Write 5 engaging captions for [brand/product] targeting [audience]. Tone: [tone]. Include a strong hook, a clear call to action, and relevant hashtags. Keep each caption concise.",tags:["social media","captions","marketing"],notes:"Replace the bracketed details before using."},
  {title:"Explain a Topic Simply",category:"Study",tool:"Claude",content:"Explain [topic] in very simple beginner-friendly language. Include: 1) a one-line definition, 2) a real-life example, 3) key points to memorize, and 4) five quick quiz questions with answers. Avoid unnecessary jargon.",tags:["learning","explanation","study"],notes:"Useful for revision and exam preparation."},
  {title:"Python Code Tutor",category:"Coding",tool:"ChatGPT",content:"Act as a patient Python tutor for a complete beginner. Help me solve this task: [task]. Explain the logic step by step, write clean code with comments, and explain each important line. Point out common mistakes and give one small practice exercise.",tags:["python","programming","beginner"],notes:"Ask the AI to explain errors instead of only rewriting the code."},
  {title:"AI Image Generation Prompt",category:"Image Generation",tool:"Midjourney",content:"Create a detailed image prompt for [subject]. Style: [visual style]. Composition: [composition]. Lighting: [lighting]. Color palette: [colors]. Background: [background]. Mood: [mood]. Include clear details and avoid text unless specifically requested.",tags:["image","creative","visual"],notes:"Describe the subject, composition, lighting, and style."},
  {title:"Short Video Advertisement",category:"Video",tool:"Google Flow",content:"Create a [duration]-second advertisement for [product] aimed at [audience]. Visual style: [style]. Language: [language]. Divide it into clear scenes with timestamps, character actions, camera movement, dialogue or voiceover, sound effects, and a final product shot. Keep character and product appearance consistent.",tags:["video","advertising","storyboard"],notes:"For longer ads, generate each clip separately and maintain continuity."},
  {title:"Website Project Planner",category:"Coding",tool:"Claude",content:"Act as a senior web developer and project planner. Help me build [website idea] using [technologies]. First define the pages, user flows, components, data model, and responsive design. Then provide complete code file by file, explain how to run it, and test all interactive features. Do not leave placeholder buttons.",tags:["web development","planning","frontend"],notes:"Ask for small deliverable stages if the project is large."},
  {title:"Professional Email Draft",category:"Writing",tool:"ChatGPT",content:"Write a professional, polite email to [recipient] about [purpose]. Include a clear subject line, concise context, the main request, and an appropriate closing. Tone: [tone]. Do not invent facts or promises.",tags:["email","professional","writing"],notes:"Review names, dates, and details before sending."},
  {title:"Study Notes from Slides",category:"Study",tool:"Claude",content:"Use only the attached slides or document to create easy exam notes for [subject]. Follow the original topic order. Include simple definitions, important differences, examples, key terms, and [number] MCQs with answer key. Mark anything not covered in the source instead of guessing.",tags:["notes","MCQs","exam"],notes:"Attach the slides or PDF when using this prompt."},
  {title:"Business Name Brainstormer",category:"Business",tool:"Gemini",content:"Suggest 20 memorable names for a [type of project/business] for [target audience]. Keep them easy to spell and pronounce. Explain the idea behind each name and group the results by style. Do not claim domain or trademark availability unless checked separately.",tags:["branding","ideas","business"],notes:"Check availability and trademarks before choosing a name."},
  {title:"Product Description",category:"Marketing",tool:"ChatGPT",content:"Write a clear and persuasive product description for [product]. Audience: [audience]. Key features: [features]. Benefits: [benefits]. Tone: [tone]. Include a short headline, concise description, and call to action. Do not make unsupported claims.",tags:["ecommerce","copywriting","product"],notes:"Use verified product facts only."},
  {title:"Debug My Code",category:"Coding",tool:"Claude",content:"Review the code below and help me debug it. First explain the likely cause of the error in beginner-friendly language. Then show the smallest safe fix, explain why it works, and suggest a test to confirm it. Do not rewrite unrelated parts. Error: [error]. Code: [paste code].",tags:["debugging","code review","learning"],notes:"Include the exact error message and relevant code."},
  {title:"Weekly Content Calendar",category:"Marketing",tool:"ChatGPT",content:"Create a 7-day content calendar for [brand/niche] on [platform]. Audience: [audience]. Goal: [goal]. For each day include the content format, topic, opening hook, key message, CTA, and visual idea. Mix educational, entertaining, and promotional content.",tags:["calendar","social media","planning"],notes:"Adapt posting frequency to your actual capacity."}
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const STORE_KEY = "promptvault-prompts-v1";
const CAT_KEY = "promptvault-categories-v1";
let prompts = [];
let categories = [...DEFAULT_CATEGORIES];
let currentView = "all";
let currentCategory = "";
let currentFilter = "all";
let copiesThisSession = 0;
let toastTimer;

function uid() { return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function now() { return new Date().toISOString(); }
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
}
function loadData() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    prompts = saved ? JSON.parse(saved) : SAMPLE_PROMPTS.map(item => ({...item,id:uid(),favorite:false,uses:0,createdAt:now(),updatedAt:now()}));
    const savedCats = localStorage.getItem(CAT_KEY);
    if (savedCats) categories = JSON.parse(savedCats);
    if (!saved) savePrompts();
    saveCategories();
  } catch (error) {
    prompts = SAMPLE_PROMPTS.map(item => ({...item,id:uid(),favorite:false,uses:0,createdAt:now(),updatedAt:now()}));
    showToast("Couldn't load saved data. A sample library has been opened.");
  }
}
function savePrompts() { localStorage.setItem(STORE_KEY, JSON.stringify(prompts)); }
function saveCategories() { localStorage.setItem(CAT_KEY, JSON.stringify(categories)); }
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function formatDate(date) {
  try { return new Date(date).toLocaleDateString(undefined,{month:"short",day:"numeric"}); }
  catch { return ""; }
}
function renderCategories() {
  $("#categoryList").innerHTML = categories.map((cat,index) => `
    <button class="nav-link ${currentCategory === cat ? "active" : ""}" data-category="${escapeHTML(cat)}">
      <span class="category-dot" style="--dot:${["#8b7df7","#e78eae","#61a7e8","#f1ad5c","#55bea0","#9d8acb","#65b4b3","#a4a6b5"][index%8]}"></span>
      ${escapeHTML(cat)}
      <span class="nav-count">${prompts.filter(p=>p.category===cat).length}</span>
    </button>`).join("");
  $("#promptCategory").innerHTML = categories.map(cat=>`<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`).join("");
}
function getVisiblePrompts() {
  const query = $("#searchInput").value.trim().toLowerCase();
  let list = [...prompts];
  if (currentView === "favorites" || currentFilter === "favorites") list = list.filter(p=>p.favorite);
  if (currentView === "recent") list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).splice(8);
  if (currentCategory) list = list.filter(p=>p.category===currentCategory);
  if (query) list = list.filter(p => [p.title,p.category,p.tool,p.content,p.notes,...(p.tags||[])].join(" ").toLowerCase().includes(query));
  const sort = $("#sortSelect").value;
  if (sort === "updated") list.sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
  if (sort === "created") list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  if (sort === "title") list.sort((a,b)=>a.title.localeCompare(b.title));
  if (sort === "uses") list.sort((a,b)=>(b.uses||0)-(a.uses||0));
  return list;
}
function renderPrompts() {
  const list = getVisiblePrompts();
  $("#resultCount").textContent = `${list.length} prompt${list.length===1?"":"s"}`;
  $("#statTotal").textContent = prompts.length;
  $("#statFavorites").textContent = prompts.filter(p=>p.favorite).length;
  $("#statCategories").textContent = categories.length;
  $("#allCount").textContent = prompts.length;
  $("#favoriteCount").textContent = prompts.filter(p=>p.favorite).length;
  $("#statCopies").textContent = copiesThisSession;
  const grid = $("#promptGrid");
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">✦</div><h3>No prompts found</h3><p>Try another search, or create your first prompt.</p><button class="primary-btn" id="emptyNewBtn">＋ Create a prompt</button></div>`;
    $("#emptyNewBtn").addEventListener("click", () => openModal());
    return;
  }
  grid.innerHTML = list.map(p => `
    <article class="prompt-card">
      <div class="card-top">
        <span class="card-category">${escapeHTML(p.category || "Other")}</span>
        <div><button class="favorite-btn ${p.favorite?"active":""}" data-favorite="${p.id}" title="${p.favorite?"Remove from":"Add to"} favorites" aria-label="Toggle favorite">${p.favorite?"♥":"♡"}</button><button class="card-menu" data-edit="${p.id}" title="Edit prompt" aria-label="Edit prompt">⋯</button></div>
      </div>
      <h3 class="card-title">${escapeHTML(p.title)}</h3>
      <p class="card-content">${escapeHTML(p.content)}</p>
      <div class="card-tags">${(p.tags||[]).slice(0,3).map(tag=>`<span class="tag">#${escapeHTML(tag)}</span>`).join("")}</div>
      <div class="card-footer"><span class="tool-label">${escapeHTML(p.tool||"Any AI tool")} · ${p.uses||0} copies</span><button class="card-action" data-edit="${p.id}">Edit</button><button class="card-action copy" data-copy="${p.id}">Copy ↗</button></div>
    </article>`).join("");
}
function renderAll() { renderCategories(); renderPrompts(); updateViewLabels(); }
function updateViewLabels() {
  let name = currentCategory || (currentView==="favorites"?"Favorites":currentView==="recent"?"Recently Added":"All Prompts");
  $("#currentViewName").textContent = name;
  $("#pageTitle").textContent = currentCategory ? `${currentCategory} prompts.` : currentView==="favorites" ? "Your favorites." : currentView==="recent" ? "Recently added." : "Your prompt library.";
  $$(".side-nav .nav-link").forEach(btn=>btn.classList.toggle("active", btn.dataset.view===currentView && !currentCategory));
  $$(".filter-chips .chip").forEach(btn=>btn.classList.toggle("selected",btn.dataset.filter===currentFilter));
}
function openModal(prompt = null) {
  $("#promptForm").reset();
  $("#promptId").value = prompt?.id || "";
  $("#modalTitle").textContent = prompt ? "Edit prompt" : "Create a prompt";
  $("#promptTitle").value = prompt?.title || "";
  $("#promptCategory").value = prompt?.category || categories[0] || "Other";
  $("#promptTool").value = prompt?.tool || "Any AI tool";
  $("#promptContent").value = prompt?.content || "";
  $("#promptTags").value = (prompt?.tags || []).join(", ");
  $("#promptNotes").value = prompt?.notes || "";
  $("#promptModal").hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(()=>$("#promptTitle").focus(),50);
}
function closeModal() { $("#promptModal").hidden = true; document.body.style.overflow = ""; }
async function copyPrompt(id) {
  const prompt = prompts.find(p=>p.id===id);
  if (!prompt) return;
  try {
    await navigator.clipboard.writeText(prompt.content);
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = prompt.content;
    textArea.style.position = "fixed"; textArea.style.opacity = "0";
    document.body.appendChild(textArea); textArea.select();
    const copied = document.execCommand("copy"); textArea.remove();
    if (!copied) { showToast("Copy failed. Please select and copy the prompt manually."); return; }
  }
  prompt.uses = (prompt.uses||0)+1;
  prompt.updatedAt = now();
  copiesThisSession++;
  savePrompts(); renderPrompts(); showToast("Prompt copied to clipboard!");
}
function toggleFavorite(id) {
  const prompt = prompts.find(p=>p.id===id);
  if (!prompt) return;
  prompt.favorite = !prompt.favorite; prompt.updatedAt = now();
  savePrompts(); renderAll();
  showToast(prompt.favorite?"Added to favorites":"Removed from favorites");
}
function exportBackup() {
  const data = {app:"PromptVault AI",version:1,exportedAt:now(),categories,prompts};
  const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download=`promptvault-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
  URL.revokeObjectURL(url); showToast("Backup exported.");
}
function importBackup(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.prompts)) throw new Error("Invalid backup");
      const imported = data.prompts.map(p=>({
        id:uid(),title:String(p.title||"Untitled prompt"),category:categories.includes(p.category)?p.category:"Other",
        tool:String(p.tool||"Any AI tool"),content:String(p.content||""),tags:Array.isArray(p.tags)?p.tags.map(String):[],
        notes:String(p.notes||""),favorite:Boolean(p.favorite),uses:Number(p.uses)||0,createdAt:p.createdAt||now(),updatedAt:now()
      }));
      const newCats = Array.isArray(data.categories)?data.categories.filter(c=>typeof c==="string"): [];
      categories = [...new Set([...categories,...newCats])];
      if (!categories.includes("Other")) categories.push("Other");
      prompts = [...prompts,...imported];
      savePrompts(); saveCategories(); renderAll();
      showToast(`Imported ${imported.length} prompt(s).`);
    } catch { showToast("This file isn't a valid PromptVault backup."); }
    $("#importFile").value = "";
  };
  reader.readAsText(file);
}
function addCategory() {
  const name = window.prompt("Enter a new category name:");
  if (name === null) return;
  const clean = name.trim();
  if (!clean) return showToast("Category name can't be empty.");
  if (categories.some(c=>c.toLowerCase()===clean.toLowerCase())) return showToast("That category already exists.");
  categories.push(clean); saveCategories(); renderAll(); showToast("Category added.");
}
function setView(view) { currentView=view; currentCategory=""; currentFilter="all"; renderAll(); }
function initEvents() {
  $("#newPromptBtn").addEventListener("click",()=>openModal());
  $("#welcomeNewBtn").addEventListener("click",()=>openModal());
  $$(".close-modal").forEach(btn=>btn.addEventListener("click",closeModal));
  $("#promptModal").addEventListener("click",e=>{if(e.target===$("#promptModal"))closeModal();});
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape" && !$("#promptModal").hidden) closeModal();
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#searchInput").focus();}
  });
  $("#promptForm").addEventListener("submit",e=>{
    e.preventDefault();
    const id=$("#promptId").value;
    const old=prompts.find(p=>p.id===id);
    const title=$("#promptTitle").value.trim(), content=$("#promptContent").value.trim();
    if(!title||!content)return showToast("Please fill in the title and prompt content.");
    const item={
      id:id||uid(),title,category:$("#promptCategory").value,tool:$("#promptTool").value,content,
      tags:$("#promptTags").value.split(",").map(t=>t.trim()).filter(Boolean).slice(0,12),
      notes:$("#promptNotes").value.trim(),favorite:old?.favorite||false,uses:old?.uses||0,
      createdAt:old?.createdAt||now(),updatedAt:now()
    };
    if(old)prompts=prompts.map(p=>p.id===id?item:p);else prompts.unshift(item);
    savePrompts();closeModal();renderAll();showToast(old?"Prompt updated.":"Prompt saved.");
  });
  $("#promptGrid").addEventListener("click",e=>{
    const copy=e.target.closest("[data-copy]");
    const edit=e.target.closest("[data-edit]");
    const fav=e.target.closest("[data-favorite]");
    if(copy)copyPrompt(copy.dataset.copy);
    if(edit)openModal(prompts.find(p=>p.id===edit.dataset.edit));
    if(fav)toggleFavorite(fav.dataset.favorite);
  });
  $$(".side-nav [data-view]").forEach(btn=>btn.addEventListener("click",()=>setView(btn.dataset.view)));
  $("#categoryList").addEventListener("click",e=>{
    const btn=e.target.closest("[data-category]");if(!btn)return;
    currentCategory=btn.dataset.category;currentView="all";currentFilter="all";renderAll();
  });
  $$(".filter-chips [data-filter]").forEach(btn=>btn.addEventListener("click",()=>{
    currentFilter=btn.dataset.filter;
    if(currentFilter==="favorites")currentView="favorites";else if(currentView==="favorites")currentView="all";
    renderAll();
  }));
  $("#searchInput").addEventListener("input",renderPrompts);
  $("#sortSelect").addEventListener("change",renderPrompts);
  $("#clearSearchBtn").addEventListener("click",()=>{$("#searchInput").value="";renderPrompts();$("#searchInput").focus();});
  $("#addCategoryBtn").addEventListener("click",addCategory);
  $("#exportBtn").addEventListener("click",exportBackup);
  $("#importBtn").addEventListener("click",()=>$("#importFile").click());
  $("#importFile").addEventListener("change",e=>importBackup(e.target.files[0]));
  $("#themeBtn").addEventListener("click",()=>{document.body.classList.toggle("dark");localStorage.setItem("promptvault-dark",document.body.classList.contains("dark")?"1":"0");});
  $("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
  $("#promptGrid").addEventListener("click",e=>{if(e.target.closest("button"))$("#sidebar").classList.remove("open");});
}
loadData();
if(localStorage.getItem("promptvault-dark")==="1")document.body.classList.add("dark");
initEvents();
renderAll();
