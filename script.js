(() => {
  "use strict";
  const STORAGE_KEY = "studybloom-data-v1";
  const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const $ = (id) => document.getElementById(id);
  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const starterData = () => ({
    tasks: [
      {id:uid(),title:"Review notes for tomorrow",subject:"Study",due:todayISO(),priority:"high",done:false},
      {id:uid(),title:"Work on project documentation",subject:"Project",due:"",priority:"medium",done:false},
      {id:uid(),title:"Organize my school files",subject:"Personal",due:"",priority:"low",done:true}
    ],
    classes: [
      {id:uid(),name:"Computer Networking",day:"Monday",time:"08:00",room:"Networking Lab"},
      {id:uid(),name:"Web Development",day:"Tuesday",time:"10:00",room:"Computer Lab"},
      {id:uid(),name:"Systems Analysis",day:"Wednesday",time:"13:00",room:"Room 204"},
      {id:uid(),name:"Database Management",day:"Thursday",time:"09:00",room:"Computer Lab"},
      {id:uid(),name:"Project Consultation",day:"Friday",time:"14:00",room:"Faculty Room"}
    ],
    ojtLogs: [], ojtGoal:700
  });
  let data = loadData();
  let taskFilter = "all";
  let editingTaskId = null;
  let timerSeconds = 25*60;
  let timerInitial = 25*60;
  let timerInterval = null;
  let toastTimeout = null;

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return starterData();
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.classes) || !Array.isArray(parsed.ojtLogs)) return starterData();
      return {...starterData(), ...parsed};
    } catch (err) {
      console.warn("Could not load saved StudyBloom data:", err);
      return starterData();
    }
  }
  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      showToast("Couldn't save data. Your browser storage may be full.");
    }
  }
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  }
  function formatDate(dateStr) {
    if (!dateStr) return "No due date";
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return "No due date";
    return d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
  }
  function formatTime(time) {
    if (!time) return "";
    const [h,m] = time.split(":").map(Number);
    const d = new Date(); d.setHours(h,m,0,0);
    return d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
  }
  function showToast(message) {
    const toast = $("toast"); toast.textContent = message; toast.classList.add("show");
    clearTimeout(toastTimeout); toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
  }
  function openModal(id) { $(id).classList.add("open"); const first = $(id).querySelector("input,select,textarea"); if(first) setTimeout(()=>first.focus(),50); }
  function closeModal(id) { $(id).classList.remove("open"); }
  function navigate(view) {
    document.querySelectorAll(".view").forEach(el=>el.classList.toggle("active",el.id===`${view}View`));
    document.querySelectorAll(".nav-link").forEach(el=>el.classList.toggle("active",el.dataset.view===view));
    const titles = {dashboard:"A little progress is still progress ♡",tasks:"Your tasks, your pace ♡",schedule:"Make room for learning ♡",ojt:"Every hour brings you closer ♡"};
    $("pageTitle").textContent = titles[view] || titles.dashboard;
    $("sidebar").classList.remove("open");
    if(view==="tasks") renderTasks();
    if(view==="schedule") renderSchedule();
    if(view==="ojt") renderOjt();
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function taskMarkup(task) {
    const subject = task.subject ? escapeHTML(task.subject) : "Personal";
    const due = task.due ? `Due ${escapeHTML(formatDate(task.due))}` : "No due date";
    return `<article class="task-item ${task.done?"is-complete":""}">
      <input class="task-check" type="checkbox" data-toggle-task="${escapeHTML(task.id)}" ${task.done?"checked":""} aria-label="Mark ${escapeHTML(task.title)} complete">
      <div class="task-copy"><span class="task-title">${escapeHTML(task.title)}</span><div class="task-meta"><span>✿ ${subject}</span><span>• ${due}</span></div></div>
      <span class="priority ${escapeHTML(task.priority)}">${task.priority==="high"?"High":task.priority==="medium"?"Medium":"Low"}</span>
      <button class="icon-button" data-delete-task="${escapeHTML(task.id)}" aria-label="Delete task">×</button>
    </article>`;
  }
  function renderTasks() {
    const sorted = [...data.tasks].sort((a,b)=>Number(a.done)-Number(b.done) || ((a.due||"9999").localeCompare(b.due||"9999")));
    const pending = sorted.filter(t=>!t.done);
    $("dashboardTaskList").innerHTML = pending.slice(0,4).map(taskMarkup).join("");
    $("emptyDashboardTasks").style.display = pending.length ? "none":"block";
    const query = $("taskSearch").value.trim().toLowerCase();
    const filtered = sorted.filter(t => (taskFilter==="all" || (taskFilter==="active"&&!t.done) || (taskFilter==="completed"&&t.done)) && `${t.title} ${t.subject}`.toLowerCase().includes(query));
    $("allTaskList").innerHTML = filtered.map(taskMarkup).join("");
    $("emptyAllTasks").style.display = filtered.length ? "none":"block";
    $("navTaskCount").textContent = pending.length;
    $("statTasks").textContent = pending.length;
    $("statCompleted").textContent = data.tasks.filter(t=>t.done).length;
    const rate = data.tasks.length ? Math.round(data.tasks.filter(t=>t.done).length/data.tasks.length*100):0;
    $("statRate").textContent = `${rate}%`;
  }
  function renderSchedule() {
    $("scheduleGrid").innerHTML = DAY_ORDER.map((day,index)=>{
      const classes = data.classes.filter(c=>c.day===day).sort((a,b)=>a.time.localeCompare(b.time));
      const colors=["#fff3f8","#f6f1ff","#fff7ec","#effaf3","#fff1f5","#f1f7ff","#f8f2ff"];
      return `<section class="day-card"><div class="day-heading"><h3>${day}</h3><span class="day-dot" style="background:${colors[index].includes("fff")?"#edb1d0":"#c5b3e9"}"></span></div>
      ${classes.length ? classes.map(c=>`<div class="class-entry"><span class="class-time">${escapeHTML(formatTime(c.time))}</span><div class="class-info"><strong>${escapeHTML(c.name)}</strong><small>${escapeHTML(c.room||"No room added")}</small></div><button class="icon-button" data-delete-class="${escapeHTML(c.id)}" aria-label="Delete class">×</button></div>`).join("") : `<div class="empty-state"><p>No classes planned ♡</p></div>`}
      </section>`;
    }).join("");
  }
  function renderOjt() {
    const total = data.ojtLogs.reduce((sum,log)=>sum+Number(log.hours||0),0);
    const goal = Math.max(1,Number(data.ojtGoal)||700);
    const percent = Math.min(100,Math.round(total/goal*100));
    $("statOjt").innerHTML = `${Number(total.toFixed(2))} <small>hrs</small>`;
    $("ojtProgressLabel").textContent = `${percent}% of your goal`;
    $("ojtTotalBig").textContent = Number(total.toFixed(2));
    $("ojtRemaining").textContent = total>=goal ? "Goal reached! Be proud of yourself 🎉" : `${Number((goal-total).toFixed(2))} hours remaining — keep going!`;
    $("ojtProgressBar").style.width = `${percent}%`;
    $("ojtPercent").textContent = `${percent}% complete`;
    $("ojtGoalLabel").textContent = `${goal} hours`;
    $("ojtGoalInput").value = goal;
    const logs=[...data.ojtLogs].sort((a,b)=>b.date.localeCompare(a.date));
    $("ojtLogList").innerHTML=logs.map(log=>`<article class="ojt-log"><div class="ojt-log-icon">🌷</div><div class="ojt-log-copy"><strong>${escapeHTML(log.company||"OJT work day")}</strong><small>${escapeHTML(formatDate(log.date))}${log.notes?` · ${escapeHTML(log.notes)}`:""}</small></div><span class="ojt-log-hours">+${Number(log.hours)}h</span><button class="icon-button" data-delete-ojt="${escapeHTML(log.id)}" aria-label="Delete OJT entry">×</button></article>`).join("");
    $("emptyOjtLogs").style.display=logs.length?"none":"block";
  }
  function renderAll() {
    renderTasks(); renderSchedule(); renderOjt();
    const now = new Date();
    $("todayLabel").textContent = now.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"}).toUpperCase();
    $("todayPill").querySelector("span").textContent=now.toLocaleDateString(undefined,{month:"short",day:"numeric"});
  }
  function newTask() {
    editingTaskId=null; $("taskForm").reset(); $("taskModalTitle").textContent="Add a little task"; $("taskDue").value="";
    openModal("taskModal");
  }
  function bindEvents() {
    document.querySelectorAll(".nav-link").forEach(btn=>btn.addEventListener("click",()=>navigate(btn.dataset.view)));
    document.querySelectorAll("[data-go]").forEach(btn=>btn.addEventListener("click",()=>navigate(btn.dataset.go)));
    $("mobileMenu").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
    $("bannerAddTask").addEventListener("click",newTask); $("addTaskButton").addEventListener("click",newTask);
    $("addClassButton").addEventListener("click",()=>{$("classForm").reset();$("classTime").value="08:00";openModal("classModal");});
    $("addOjtButton").addEventListener("click",()=>{$("ojtForm").reset();$("ojtDate").value=todayISO();openModal("ojtModal");});
    document.querySelectorAll("[data-close]").forEach(btn=>btn.addEventListener("click",()=>closeModal(btn.dataset.close)));
    document.querySelectorAll(".modal-backdrop").forEach(backdrop=>backdrop.addEventListener("click",e=>{if(e.target===backdrop)closeModal(backdrop.id);}));
    document.addEventListener("keydown",e=>{if(e.key==="Escape")document.querySelectorAll(".modal-backdrop.open").forEach(m=>closeModal(m.id));});
    $("taskForm").addEventListener("submit",e=>{
      e.preventDefault();
      const task={id:uid(),title:$("taskTitle").value.trim(),subject:$("taskSubject").value.trim(),due:$("taskDue").value,priority:$("taskPriority").value,done:false};
      if(!task.title)return;
      data.tasks.unshift(task); saveData(); renderAll(); closeModal("taskModal"); showToast("Task added. You've got this! 🌸");
    });
    $("classForm").addEventListener("submit",e=>{
      e.preventDefault();
      data.classes.push({id:uid(),name:$("className").value.trim(),day:$("classDay").value,time:$("classTime").value,room:$("classRoom").value.trim()});
      saveData();renderSchedule();closeModal("classModal");showToast("Class added to your schedule 📚");
    });
    $("ojtForm").addEventListener("submit",e=>{
      e.preventDefault();
      const hours=Number($("ojtHours").value);
      if(!Number.isFinite(hours)||hours<=0||hours>24){showToast("Enter hours greater than 0 and no more than 24.");return;}
      data.ojtLogs.push({id:uid(),date:$("ojtDate").value,hours,company:$("ojtCompany").value.trim(),notes:$("ojtNotes").value.trim()});
      saveData();renderOjt();renderTasks();closeModal("ojtModal");showToast("OJT hours saved. Every hour counts! 💗");
    });
    document.addEventListener("change",e=>{
      const toggle=e.target.closest("[data-toggle-task]");
      if(toggle){const task=data.tasks.find(t=>t.id===toggle.dataset.toggleTask);if(task){task.done=toggle.checked;saveData();renderAll();showToast(task.done?"Task completed — well done! ✨":"Task moved back to to-do.");}}
    });
    document.addEventListener("click",e=>{
      const delTask=e.target.closest("[data-delete-task]");
      const delClass=e.target.closest("[data-delete-class]");
      const delOjt=e.target.closest("[data-delete-ojt]");
      if(delTask){data.tasks=data.tasks.filter(t=>t.id!==delTask.dataset.deleteTask);saveData();renderAll();showToast("Task deleted.");}
      if(delClass){data.classes=data.classes.filter(c=>c.id!==delClass.dataset.deleteClass);saveData();renderSchedule();showToast("Class removed.");}
      if(delOjt){if(confirm("Delete this OJT log entry?")){data.ojtLogs=data.ojtLogs.filter(l=>l.id!==delOjt.dataset.deleteOjt);saveData();renderOjt();showToast("OJT entry deleted.");}}
    });
    $("taskFilters").addEventListener("click",e=>{const btn=e.target.closest("[data-filter]");if(!btn)return;taskFilter=btn.dataset.filter;document.querySelectorAll(".filter-tab").forEach(b=>b.classList.toggle("active",b===btn));renderTasks();});
    $("taskSearch").addEventListener("input",renderTasks);
    $("saveOjtGoal").addEventListener("click",()=>{const goal=Number($("ojtGoalInput").value);if(!Number.isFinite(goal)||goal<1||goal>10000){showToast("Set a goal between 1 and 10,000 hours.");return;}data.ojtGoal=goal;saveData();renderOjt();showToast("OJT goal updated 🎓");});
    document.querySelectorAll("[data-minutes]").forEach(btn=>btn.addEventListener("click",()=>{stopTimer();timerInitial=Number(btn.dataset.minutes)*60;timerSeconds=timerInitial;updateTimer();document.querySelectorAll(".preset").forEach(b=>b.classList.toggle("active",b===btn));$("timerMode").textContent=Number(btn.dataset.minutes)===5?"BREAK TIME":"FOCUS TIME";$("timerMessage").textContent="Ready when you are ✨";}));
    $("timerStart").addEventListener("click",()=>{
      if(timerInterval){stopTimer();$("timerStart").textContent="▶ Resume";return;}
      if(timerSeconds<=0)timerSeconds=timerInitial;
      $("timerStart").textContent="Ⅱ Pause";
      timerInterval=setInterval(()=>{timerSeconds--;updateTimer();if(timerSeconds<=0){stopTimer();$("timerStart").textContent="▶ Start";$("timerMessage").textContent="Time's up! Take a little stretch 🌷";showToast("Session complete! Great job ✨");}},1000);
    });
    $("timerReset").addEventListener("click",()=>{stopTimer();timerSeconds=timerInitial;updateTimer();$("timerStart").textContent="▶ Start";$("timerMessage").textContent="Fresh start. You've got this! ✨";});
    $("exportData").addEventListener("click",()=>{
      const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`studybloom-backup-${todayISO()}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);showToast("Your backup file is ready to save 💾");
    });
    $("resetData").addEventListener("click",()=>{
      if(confirm("Reset all tasks, classes, and OJT logs in this browser? Export your data first if you want a backup.")){data=starterData();saveData();renderAll();showToast("Demo data restored.");}
    });
  }
  function stopTimer(){if(timerInterval){clearInterval(timerInterval);timerInterval=null;}}
  function updateTimer(){const min=Math.floor(timerSeconds/60),sec=timerSeconds%60;$("timerDisplay").textContent=`${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;}
  function setInitialDate(){ $("ojtDate").value=todayISO(); }
  bindEvents();setInitialDate();renderAll();
})();