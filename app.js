const SIZE = 15;
const CENTER = 7;
const DICT_URL = "https://raw.githubusercontent.com/kamilmielnik/scrabble-dictionaries/master/turkish/kelimelik.txt";

// Türkçe Kelimelik / Scrabble harf puanları.
const LETTER_POINTS = {
  A:1,E:1,İ:1,K:1,L:1,R:1,N:1,T:1,
  I:2,M:2,O:2,S:2,U:2,
  B:3,D:3,Ü:3,Y:3,
  C:4,Ç:4,Ş:4,Z:4,
  G:5,H:5,P:5,
  F:7,Ö:7,V:7,
  Ğ:8,J:10
};

// Verilen ekran görüntüsündeki 15x15 bonus yerleşimi.
// H = Harf, K = Kelime.
const PREMIUM = (() => {
  const p = Array.from({length: SIZE}, () => Array(SIZE).fill(""));
  const set = (type, arr) => arr.forEach(([r,c]) => p[r][c] = type);

  set("K3", [[0,2],[0,12],[2,0],[2,14],[12,0],[12,14],[14,2],[14,12]]);
  set("K2", [[3,3],[3,11],[2,7],[7,2],[7,12],[12,7],[11,3],[11,11]]);
  set("H3", [[1,1],[1,13],[4,4],[4,10],[10,4],[10,10],[13,1],[13,13]]);
  set("H2", [
    [0,5],[0,9],
    [1,6],[1,8],
    [5,0],[5,5],[5,9],[5,14],
    [6,1],[6,6],[6,8],[6,13],
    [8,1],[8,6],[8,8],[8,13],
    [9,0],[9,5],[9,9],[9,14],
    [13,6],[13,8],
    [14,5],[14,9]
  ]);
  return p;
})();

let board = Array.from({length:SIZE}, () => Array(SIZE).fill(null));
let selected = {r:CENTER, c:CENTER};
let dictionary = new Set();
let dictionaryWords = [];
let solving = false;
let previewCells = [];

// Ekran görüntüsündeki iki özel yıldız tipi: ★2 ve ★★★.
// Her oyun farklı konumlandığı için kullanıcı bunları elle yerleştirir.
let star2Pos = null;
let star3Pos = null;
let starMode = null; // "star2" | "star3"

const boardEl = document.getElementById("board");
const rackEl = document.getElementById("rack");
const resultsEl = document.getElementById("results");
const statusEl = document.getElementById("dictStatus");
const infoEl = document.getElementById("dictInfo");
const starModeEl = document.getElementById("starMode");

// ---------------------------------------------------------------------
// ÇOKLU OYUN YÖNETİMİ
// Her oyun (tahta + el + yıldızlar + seçili hücre) tarayıcının
// localStorage'ında saklanır. Program/tarayıcı kapatılıp açılsa bile,
// kullanıcı bir oyunu "Bitir" demedikçe (✕ düğmesi) o oyun aynen durur.
// ---------------------------------------------------------------------
const STORAGE_KEY = "kelimelikYardimcisiOyunlar_v1";

function uid(){
  if(window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "g_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,8);
}

function loadStoreRaw(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){
    console.warn("Oyun deposu okunamadı:", e);
    return null;
  }
}

function saveStore(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }catch(e){
    console.warn("Oyun deposu kaydedilemedi:", e);
  }
}

function emptyGameState(name){
  return {
    id: uid(),
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    board: Array.from({length:SIZE}, () => Array(SIZE).fill(null)),
    rack: "",
    star2: null,
    star3: null,
    selected: {r:CENTER, c:CENTER}
  };
}

let store = loadStoreRaw();
if(!store || !store.games || !Object.keys(store.games).length){
  const g0 = emptyGameState("Oyun 1");
  store = {activeId: g0.id, games: {[g0.id]: g0}};
  saveStore();
}
if(!store.activeId || !store.games[store.activeId]){
  store.activeId = Object.keys(store.games)[0];
}

function getActiveGame(){ return store.games[store.activeId]; }

function loadActiveGameIntoState(){
  const g = getActiveGame();
  board = g.board.map(row => row.slice());
  selected = {r:g.selected.r, c:g.selected.c};
  star2Pos = g.star2 ? {r:g.star2.r, c:g.star2.c} : null;
  star3Pos = g.star3 ? {r:g.star3.r, c:g.star3.c} : null;
  rackEl.value = g.rack || "";
}

function persistActiveGame(){
  const g = getActiveGame();
  if(!g) return;
  g.board = board.map(row => row.slice());
  g.rack = rackEl.value;
  g.star2 = star2Pos ? {r:star2Pos.r, c:star2Pos.c} : null;
  g.star3 = star3Pos ? {r:star3Pos.r, c:star3Pos.c} : null;
  g.selected = {r:selected.r, c:selected.c};
  g.updatedAt = Date.now();
  saveStore();
  renderGamesBar();
}

function renderGamesBar(){
  const wrap = document.getElementById("gamesList");
  if(!wrap) return;
  wrap.innerHTML = "";
  const games = Object.values(store.games).sort((a,b)=>a.createdAt-b.createdAt);
  for(const g of games){
    const chip = document.createElement("div");
    chip.className = "game-chip" + (g.id===store.activeId ? " active" : "");
    chip.title = "Açmak için tıkla · Adını değiştirmek için çift tıkla";

    const label = document.createElement("span");
    label.className = "game-chip-label";
    label.textContent = g.name;
    chip.appendChild(label);

    const endBtn = document.createElement("button");
    endBtn.className = "game-chip-end";
    endBtn.textContent = "✕";
    endBtn.title = "Bu oyunu bitir";
    endBtn.addEventListener("click", e => { e.stopPropagation(); endGame(g.id); });
    chip.appendChild(endBtn);

    chip.addEventListener("click", () => switchGame(g.id));
    chip.addEventListener("dblclick", () => renameGame(g.id));

    wrap.appendChild(chip);
  }
}

function switchGame(id){
  if(id === store.activeId || !store.games[id]) return;
  store.activeId = id;
  saveStore();
  loadActiveGameIntoState();
  starMode = null;
  updateStarMode();
  clearResults(true);
  renderBoard();
  renderRack();
  renderGamesBar();
}

function renameGame(id){
  const g = store.games[id];
  if(!g) return;
  const name = prompt("Oyun adı:", g.name);
  if(name && name.trim()){
    g.name = name.trim();
    saveStore();
    renderGamesBar();
  }
}

function newGame(){
  const count = Object.keys(store.games).length + 1;
  const name = prompt("Yeni oyunun adı:", `Oyun ${count}`);
  if(name === null) return; // vazgeçildi
  const g = emptyGameState(name.trim() || `Oyun ${count}`);
  store.games[g.id] = g;
  store.activeId = g.id;
  saveStore();
  loadActiveGameIntoState();
  starMode = null;
  updateStarMode();
  clearResults(true);
  renderBoard();
  renderRack();
  renderGamesBar();
}

function endGame(id){
  const g = store.games[id];
  if(!g) return;
  const ok = confirm(`"${g.name}" oyununu bitiriyorsun.\nTahta ve el bilgileri silinecek, bu işlem geri alınamaz.\nDevam edilsin mi?`);
  if(!ok) return;

  const wasActive = (id === store.activeId);
  delete store.games[id];

  if(wasActive){
    const remaining = Object.keys(store.games);
    if(remaining.length){
      store.activeId = remaining[0];
    }else{
      const ng = emptyGameState("Oyun 1");
      store.games[ng.id] = ng;
      store.activeId = ng.id;
    }
    loadActiveGameIntoState();
    starMode = null;
    updateStarMode();
    clearResults(true);
    renderBoard();
    renderRack();
  }
  saveStore();
  renderGamesBar();
}

document.getElementById("newGameBtn").addEventListener("click", newGame);

function trUpper(s){ return s.toLocaleUpperCase("tr-TR"); }
function normalizeWord(s){
  return trUpper(s.trim()).replace(/[ÂÎÛ]/g, ch => ({Â:"A", Î:"İ", Û:"U"}[ch] || ch));
}
function isLetterWord(s){ return /^[A-ZÇĞİÖŞÜI]+$/u.test(s); }
function inside(r,c){ return r>=0 && r<SIZE && c>=0 && c<SIZE; }
function boardEmpty(){ return board.every(row => row.every(x => !x)); }
function cloneBoard(b){ return b.map(row => row.slice()); }
function keyOf(r,c){ return `${r},${c}`; }

function makeBoard(){
  boardEl.innerHTML = "";
  for(let r=0; r<SIZE; r++){
    for(let c=0; c<SIZE; c++){
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.r = r;
      cell.dataset.c = c;
      cell.addEventListener("click", () => selectCell(r,c));
      boardEl.appendChild(cell);
    }
  }
  renderBoard();
}

function selectCell(r,c){
  selected = {r,c};
  if(starMode){
    if(board[r][c]){
      alert("Önce bu karedeki harfi silmelisin; yıldız harfin altında gösterilmez.");
      renderBoard();
      return;
    }
    if(starMode === "star2") star2Pos = {r,c};
    if(starMode === "star3") star3Pos = {r,c};
    starMode = null;
    updateStarMode();
  }
  clearResults(false);
  renderBoard();
  persistActiveGame();
  // Dokunmatik cihazda ekran klavyesini açmak için: bu odaklama, kullanıcının
  // dokunma hareketiyle aynı anda gerçekleştiği için tarayıcı klavyeyi
  // göstermeye izin verir (masaüstünde görünmez, zararsızdır).
  mobileCaptureEl.value = "";
  mobileCaptureEl.focus({preventScroll:true});
}

function cellAt(r,c){ return boardEl.children[r*SIZE+c]; }
function getStarType(r,c){
  if(star2Pos && star2Pos.r===r && star2Pos.c===c) return 2;
  if(star3Pos && star3Pos.r===r && star3Pos.c===c) return 3;
  return 0;
}

function renderBoard(preview=null){
  const previewMap = new Map((preview||[]).map(x => [keyOf(x.r,x.c), x.letter]));

  for(let r=0;r<SIZE;r++){
    for(let c=0;c<SIZE;c++){
      const el = cellAt(r,c);
      el.className = "cell";
      el.innerHTML = "";
      if(selected.r===r && selected.c===c) el.classList.add("selected");

      const p = PREMIUM[r][c];
      const st = getStarType(r,c);
      const val = board[r][c];

      if(val){
        el.classList.add("tile");
        const letter = document.createElement("span");
        letter.className = "tile-letter";
        letter.textContent = val;
        el.appendChild(letter);

        const pts = document.createElement("span");
        pts.className = "pts";
        pts.textContent = LETTER_POINTS[val] ?? 0;
        el.appendChild(pts);
      } else if(st===2){
        el.classList.add("star2");
        const s = document.createElement("span");
        s.className = "star-icon";
        s.textContent = "★";
        el.appendChild(s);
        const n = document.createElement("span");
        n.className = "star-number";
        n.textContent = "2";
        el.appendChild(n);
      } else if(st===3){
        el.classList.add("star3");
        const s = document.createElement("span");
        s.className = "star-icon small";
        s.textContent = "★★★";
        el.appendChild(s);
      } else if(p){
        el.classList.add(p.toLowerCase());
        const b = document.createElement("span");
        b.className = "bonus-text";
        b.innerHTML = p[0] + "<sup>" + p[1] + "</sup>";
        el.appendChild(b);
      }

      const previewLetter = previewMap.get(keyOf(r,c));
      if(previewLetter){
        el.classList.add("preview");
        el.innerHTML = "";
        const span = document.createElement("span");
        span.className = "preview-letter";
        span.textContent = previewLetter;
        el.appendChild(span);
        const pts = document.createElement("span");
        pts.className = "pts";
        pts.textContent = LETTER_POINTS[previewLetter] ?? 0;
        el.appendChild(pts);
      }
    }
  }
  updateBoardStats();
}

function updateBoardStats(){
  const placed = board.flat().filter(Boolean).length;
  document.getElementById("boardCount").textContent = placed;
  document.getElementById("rackCount").textContent = `${rackEl.value.length}/7`;
}

function updateStarMode(){
  const active = !!starMode;
  starModeEl.hidden = !active;
  if(active){
    starModeEl.textContent = starMode === "star2"
      ? "★2 yerleştirme modu: şimdi tahtadaki hedef kareye tıkla."
      : "★★★ yerleştirme modu: şimdi tahtadaki hedef kareye tıkla.";
  }
  document.getElementById("placeStar2").classList.toggle("active", starMode === "star2");
  document.getElementById("placeStar3").classList.toggle("active", starMode === "star3");
}

function placeLetterAtSelected(k){
  const {r,c} = selected;
  board[r][c] = k;
  if(c<SIZE-1) selected.c++;
  clearResults(false);
  renderBoard();
  persistActiveGame();
}

function deleteLetterAtSelected(){
  const {r,c} = selected;
  board[r][c] = null;
  if(c>0) selected.c--;
  clearResults(false);
  renderBoard();
  persistActiveGame();
}

function setCellFromKey(key){
  if(key === "Backspace" || key === "Delete"){
    deleteLetterAtSelected();
    return;
  }
  const k = trUpper(key);
  if(/^[A-ZÇĞİÖŞÜI]$/u.test(k)){
    placeLetterAtSelected(k);
  }
}

document.addEventListener("keydown", e => {
  if(["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) return;
  setCellFromKey(e.key);
});

// MOBİL KLAVYE DESTEĞİ: Dokunmatik cihazlarda, bir hücreye dokunmak hiçbir
// gerçek <input> alanını odaklamadığı için ekran klavyesi hiç açılmıyordu.
// Bu görünmez input, hücre seçildiğinde odaklanarak klavyeyi açar; girilen
// her karakter aynı harf/silme mantığını (yukarıdaki fonksiyonlar) kullanır.
const mobileCaptureEl = document.getElementById("mobileCapture");

mobileCaptureEl.addEventListener("input", () => {
  const ch = mobileCaptureEl.value.slice(-1);
  mobileCaptureEl.value = "";
  if(!ch) return;
  const k = trUpper(ch);
  if(/^[A-ZÇĞİÖŞÜI]$/u.test(k)){
    placeLetterAtSelected(k);
  }
});

mobileCaptureEl.addEventListener("keydown", e => {
  if(e.key === "Backspace" || e.key === "Delete"){
    e.preventDefault();
    deleteLetterAtSelected();
  }
});

rackEl.addEventListener("input", () => {
  rackEl.value = trUpper(rackEl.value).replace(/[^A-ZÇĞİÖŞÜI*]/gu, "").slice(0,7);
  renderRack();
  updateBoardStats();
  clearResults(false);
  persistActiveGame();
});

function renderRack(){
  const box = document.getElementById("rackTiles");
  box.innerHTML = "";
  for(const ch of rackEl.value){
    const d = document.createElement("div");
    d.className = "rack-tile";
    d.textContent = ch;
    const s = document.createElement("small");
    s.textContent = ch === "*" ? "0" : (LETTER_POINTS[ch] || 0);
    d.appendChild(s);
    box.appendChild(d);
  }
}

function clearResults(resetMessage=true){
  if(resetMessage) resultsEl.innerHTML = '<div class="empty">Elini girip hamle aramayı başlat.</div>';
  else resultsEl.innerHTML = '<div class="empty">Tahta/el değişti. Hamleleri yeniden hesapla.</div>';
  document.getElementById("resultCount").textContent = "0";
  document.getElementById("resultCountLabel").textContent = "0 hamle";
  previewCells = [];
  hasSearched = false;
  lastMoves = [];
}

function rackCounts(rack){
  const counts = {blank:0};
  for(const ch of rack){
    if(ch === "*") counts.blank++;
    else counts[ch] = (counts[ch] || 0) + 1;
  }
  return counts;
}

function hasNeighbor(r,c,b=board){
  return (inside(r-1,c) && b[r-1][c]) ||
         (inside(r+1,c) && b[r+1][c]) ||
         (inside(r,c-1) && b[r][c-1]) ||
         (inside(r,c+1) && b[r][c+1]);
}

function getWordAt(b,r,c,dr,dc){
  let rr=r, cc=c;
  while(inside(rr-dr,cc-dc) && b[rr-dr][cc-dc]){ rr-=dr; cc-=dc; }
  let word="";
  const cells=[];
  while(inside(rr,cc) && b[rr][cc]){
    word += b[rr][cc];
    cells.push({r:rr,c:cc});
    rr += dr; cc += dc;
  }
  return {word,cells};
}

function crossesCenter(r,c,wordLen,dr,dc){
  for(let i=0;i<wordLen;i++){
    const rr=r+dr*i, cc=c+dc*i;
    if(rr===CENTER && cc===CENTER) return true;
  }
  return false;
}

function canUseWordAt(word,r,c,dr,dc,rack){
  const counts = rackCounts(rack);
  let blanks = counts.blank;
  let newTiles = 0;
  let touches = false;
  const placed=[];

  for(let i=0;i<word.length;i++){
    const rr=r+dr*i, cc=c+dc*i;
    if(!inside(rr,cc)) return null;
    const existing = board[rr][cc];
    const ch = word[i];

    if(existing){
      if(existing !== ch) return null;
      touches = true;
    }else{
      newTiles++;
      let usedBlank=false;
      if((counts[ch]||0)>0){ counts[ch]--; }
      else if(blanks>0){ blanks--; usedBlank=true; }
      else return null;
      placed.push({r:rr,c:cc,letter:ch,blank:usedBlank});
      if(hasNeighbor(rr,cc)) touches=true;
    }
  }

  if(newTiles===0) return null;

  // İlk hamle: Kelimelik/Scrabble kuralı gereği merkez kareden geçmeli.
  if(boardEmpty()){
    if(!crossesCenter(r,c,word.length,dr,dc)) return null;
  }else if(!touches){
    return null;
  }

  const beforeR=r-dr, beforeC=c-dc;
  const afterR=r+dr*word.length, afterC=c+dc*word.length;
  if(inside(beforeR,beforeC) && board[beforeR][beforeC]) return null;
  if(inside(afterR,afterC) && board[afterR][afterC]) return null;

  return placed;
}

function starAt(r,c){
  if(star2Pos && star2Pos.r===r && star2Pos.c===c) return 2;
  if(star3Pos && star3Pos.r===r && star3Pos.c===c) return 3;
  return 0;
}

function scoreLine(cells,temp,placedSet){
  let sum=0;
  let wordMult=1;
  for(const q of cells){
    let val=LETTER_POINTS[temp[q.r][q.c]] || 0;
    if(placedSet.has(keyOf(q.r,q.c))){
      const pr=PREMIUM[q.r][q.c];
      if(pr==="H2") val*=2;
      if(pr==="H3") val*=3;
      if(pr==="K2") wordMult*=2;
      if(pr==="K3") wordMult*=3;
      const st=starAt(q.r,q.c);
      if(st===2) wordMult*=2;
      if(st===3) wordMult*=3;
    }
    sum += val;
  }
  return sum * wordMult;
}

function buildCandidate(word,r,c,dr,dc,rack){
  const placed = canUseWordAt(word,r,c,dr,dc,rack);
  if(!placed) return null;

  const temp = cloneBoard(board);
  for(const p of placed) temp[p.r][p.c] = p.letter;

  const main = getWordAt(temp,r,c,dr,dc);
  if(main.word !== word || !dictionary.has(main.word)) return null;

  const crossDir = {dr:-dc,dc:dr};
  const crossWords=[];
  const crossStarts=new Set();
  for(const p of placed){
    const cross=getWordAt(temp,p.r,p.c,crossDir.dr,crossDir.dc);
    if(cross.word.length>1){
      if(!dictionary.has(cross.word)) return null;
      const k=`${cross.word}@${cross.cells[0].r},${cross.cells[0].c}`;
      if(!crossStarts.has(k)){
        crossStarts.add(k);
        crossWords.push(cross.word);
      }
    }
  }

  const placedSet = new Set(placed.map(p=>keyOf(p.r,p.c)));
  const mainScore = scoreLine(main.cells,temp,placedSet);
  let crossScore = 0;
  for(const p of placed){
    const cross=getWordAt(temp,p.r,p.c,crossDir.dr,crossDir.dc);
    if(cross.word.length>1 && crossStarts.has(`${cross.word}@${cross.cells[0].r},${cross.cells[0].c}`)){
      // Aynı cross kelimeyi yalnızca bir kez say.
      crossStarts.delete(`${cross.word}@${cross.cells[0].r},${cross.cells[0].c}`);
      crossScore += scoreLine(cross.cells,temp,placedSet);
    }
  }

  // Joker taş harf değerini 0 yapar.
  const jokerKeys = new Set(placed.filter(p=>p.blank).map(p=>keyOf(p.r,p.c)));
  let score = mainScore + crossScore;
  if(jokerKeys.size){
    // Bonusları tekrar hesaplamak zorunda kalmamak için toplamdan jokerin normal katkısını çıkar.
    // Jokerin bulunduğu harf ayrıca yan kelimelerde de katkı yapmış olabilir.
    // En güvenli yöntem: hamleyi jokerleri 0 puanlı olacak şekilde tekrar hesaplamak.
    score = scoreWithBlanks(word,placed,temp,r,c,dr,dc);
  }

  if(placed.length===7) score += 30;

  const risk = assessRisk(temp, main.cells);

  return {word,r,c,dr,dc,placed,score,crossWords,risk:risk.level,riskyCells:risk.cells};
}

// Bu hamle sonrasında rakibin bir sonraki turda kullanabileceği,
// henüz kullanılmamış büyük çarpan kareleri (K3/★★★ = yüksek risk,
// K2/★2/H3 = orta risk) açığa çıkıyor mu? Kelimenin bulunduğu her
// hücrenin dört komşusuna bakıp boş ve "tehlikeli" olanları toplar.
function assessRisk(temp, mainCells){
  const rank = {none:0, medium:1, high:2};
  let level = "none";
  const found = [];
  const seen = new Set();

  for(const cell of mainCells){
    const neigh = [[cell.r-1,cell.c],[cell.r+1,cell.c],[cell.r,cell.c-1],[cell.r,cell.c+1]];
    for(const [nr,nc] of neigh){
      if(!inside(nr,nc) || temp[nr][nc]) continue;
      const k = keyOf(nr,nc);
      if(seen.has(k)) continue;

      const pr = PREMIUM[nr][nc];
      const st = starAt(nr,nc);
      let lvl=null, label=null;
      if(pr==="K3" || st===3){ lvl="high"; label = st===3 ? "★★★" : "K³"; }
      else if(pr==="K2" || st===2){ lvl="medium"; label = st===2 ? "★2" : "K²"; }
      else if(pr==="H3"){ lvl="medium"; label="H³"; }

      if(lvl){
        seen.add(k);
        found.push({r:nr,c:nc,label,level:lvl});
        if(rank[lvl] > rank[level]) level = lvl;
      }
    }
  }
  return {level, cells:found};
}

function cellLabel(r,c){ return String.fromCharCode(65+c) + (r+1); }

function scoreLineWithBlanks(cells,temp,placedSet,jokerKeys){
  let sum=0, wordMult=1;
  for(const q of cells){
    const k=keyOf(q.r,q.c);
    let val=jokerKeys.has(k) ? 0 : (LETTER_POINTS[temp[q.r][q.c]] || 0);
    if(placedSet.has(k)){
      const pr=PREMIUM[q.r][q.c];
      if(pr==="H2") val*=2;
      if(pr==="H3") val*=3;
      if(pr==="K2") wordMult*=2;
      if(pr==="K3") wordMult*=3;
      const st=starAt(q.r,q.c);
      if(st===2) wordMult*=2;
      if(st===3) wordMult*=3;
    }
    sum += val;
  }
  return sum*wordMult;
}

function scoreWithBlanks(word,placed,temp,r,c,dr,dc){
  const placedSet = new Set(placed.map(p=>keyOf(p.r,p.c)));
  const jokerKeys = new Set(placed.filter(p=>p.blank).map(p=>keyOf(p.r,p.c)));
  const main = getWordAt(temp,r,c,dr,dc);
  const crossDir={dr:-dc,dc:dr};
  const mainScore=scoreLineWithBlanks(main.cells,temp,placedSet,jokerKeys);
  let total=mainScore;
  const seen=new Set();
  for(const p of placed){
    const cross=getWordAt(temp,p.r,p.c,crossDir.dr,crossDir.dc);
    if(cross.word.length<=1) continue;
    const id=`${cross.word}@${cross.cells[0].r},${cross.cells[0].c}`;
    if(seen.has(id)) continue;
    seen.add(id);
    total += scoreLineWithBlanks(cross.cells,temp,placedSet,jokerKeys);
  }
  return total;
}

function findMoves(){
  const rack=rackEl.value;
  if(!rack){ alert("Önce elindeki harfleri gir."); return []; }
  if(dictionary.size===0){ alert("Sözlük henüz yüklenmedi."); return []; }

  const moves=[];
  const seen=new Set();
  const empty=boardEmpty();

  function tryCandidate(word,r,c,dr,dc){
    // Tahtanın dışına taşan uzunlukları ucuz şekilde ele: pahalı
    // buildCandidate'i (tahta kopyalama + sözlük kontrolü) çağırmadan önce.
    if(dc && c+word.length>SIZE) return;
    if(dr && r+word.length>SIZE) return;
    const cand=buildCandidate(word,r,c,dr,dc,rack);
    if(!cand) return;
    const moveKey=`${word}|${r}|${c}|${dr}|${dc}|${cand.placed.map(p=>p.blank?"*":p.letter).join("")}`;
    if(!seen.has(moveKey)){
      seen.add(moveKey);
      moves.push(cand);
    }
  }

  if(empty){
    for(const word of dictionaryWords){
      if(word.length<2 || word.length>15) continue;
      for(const [dr,dc] of [[0,1],[1,0]]){
        for(let i=0;i<word.length;i++){
          const sr=CENTER-dr*i, sc=CENTER-dc*i;
          if(inside(sr,sc)) tryCandidate(word,sr,sc,dr,dc);
        }
      }
    }
    moves.sort((a,b)=>b.score-a.score || b.word.length-a.word.length || a.word.localeCompare(b.word,"tr"));
    return moves;
  }

  const occupied=[];
  const anchors=[];
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++){
    if(board[r][c]) occupied.push({r,c,ch:board[r][c]});
    else if(hasNeighbor(r,c)) anchors.push({r,c});
  }

  // 1) Mevcut taşların ÜZERİNDEN geçen (çakışan) yerleşimler: tüm sözlük,
  //    harf eşleşmesiyle hızlıca eleniyor (mevcut, hızlı yöntem).
  for(const word of dictionaryWords){
    if(word.length<2 || word.length>15) continue;
    for(const [dr,dc] of [[0,1],[1,0]]){
      for(const o of occupied){
        for(let i=0;i<word.length;i++){
          if(word[i]!==o.ch) continue;
          const sr=o.r-dr*i, sc=o.c-dc*i;
          if(inside(sr,sc)) tryCandidate(word,sr,sc,dr,dc);
        }
      }
    }
  }

  // 2) Mevcut taşlara ÇAKIŞMADAN, sadece BİTİŞİK duran yerleşimler (paralel
  //    kelime oynayıp yan kelimeler oluşturma). Bu olmadan çoğu yüksek puanlı
  //    hamle hiç aday olarak üretilmiyordu.
  //    Önemli hız notu: çakışmasız bir hamlede TÜM yeni harfler elden gelir,
  //    dolayısıyla kelime uzunluğu elin uzunluğunu (en fazla 7) hiçbir zaman
  //    aşamaz — daha uzun kelimeler zaten (1)'de bulunmuş olurdu. Bu sayede
  //    binlerce kelimeyi değil, sadece elin uzunluğuna kadar olanları
  //    tarıyoruz.
  if(anchors.length){
    const maxLen = Math.min(15, rack.length);
    for(const word of dictionaryWords){
      if(word.length<2 || word.length>maxLen) continue;
      for(const [dr,dc] of [[0,1],[1,0]]){
        for(const a of anchors){
          for(let i=0;i<word.length;i++){
            const sr=a.r-dr*i, sc=a.c-dc*i;
            if(inside(sr,sc)) tryCandidate(word,sr,sc,dr,dc);
          }
        }
      }
    }
  }

  moves.sort((a,b)=>b.score-a.score || b.word.length-a.word.length || a.word.localeCompare(b.word,"tr"));
  return moves;
}

function formatPos(m){
  const row=m.r+1;
  const col=String.fromCharCode(65+m.c);
  return `${col}${row} ${m.dr===0?"→":"↓"}`;
}

let lastMoves = [];
let hasSearched = false;
const onlyBingoEl = document.getElementById("onlyBingo");
const hideRiskyEl = document.getElementById("hideRisky");

function getFilteredMoves(moves){
  let out = moves;
  if(onlyBingoEl.checked) out = out.filter(m => m.placed.length === 7);
  if(hideRiskyEl.checked) out = out.filter(m => m.risk !== "high");
  return out;
}

function showResults(moves){
  lastMoves = moves;
  hasSearched = true;
  lastMoves = moves;
  const filtered = getFilteredMoves(moves);
  const limit=Math.max(1,Math.min(100,Number(document.getElementById("limit").value)||20));
  const top=filtered.slice(0,limit);

  const countLabel = filtered.length===moves.length
    ? `${moves.length} hamle`
    : `${filtered.length} / ${moves.length} hamle`;
  document.getElementById("resultCountLabel").textContent = countLabel;
  document.getElementById("resultCount").textContent = filtered.length;

  if(!top.length){
    resultsEl.innerHTML = moves.length
      ? '<div class="empty">Filtrelere uyan hamle yok. Süzgeçleri gevşetmeyi dene.</div>'
      : '<div class="empty">Bu el ve tahta için geçerli bir hamle bulunamadı.</div>';
    return;
  }

  resultsEl.innerHTML="";
  top.forEach((m,i)=>{
    const d=document.createElement("div");
    d.className="result"+(i===0?" best":"");
    const starInfo=[];
    for(const p of m.placed){
      const st=starAt(p.r,p.c);
      if(st===2) starInfo.push("★2");
      if(st===3) starInfo.push("★★★");
    }

    const badges=[];
    if(m.placed.length===7) badges.push('<span class="badge badge-bingo">🎉 BİNGO</span>');
    if(m.risk==="high") badges.push('<span class="badge badge-risk-high">⚠ Yüksek risk</span>');
    else if(m.risk==="medium") badges.push('<span class="badge badge-risk-medium">⚠ Orta risk</span>');

    d.innerHTML=`
      <div class="result-top">
        <span class="rank">#${i+1}</span>
        <span class="word">${m.word}</span>
        <span class="score">${m.score} puan</span>
      </div>
      ${badges.length?`<div class="badges">${badges.join("")}</div>`:""}
      <div class="meta">
        <b>Konum:</b> ${formatPos(m)}
        &nbsp; • &nbsp; <b>Yeni taş:</b> ${m.placed.map(p=>p.letter+(p.blank?" (J)":"")).join(" ")}
        ${m.crossWords.length?`<br><b>Yan kelimeler:</b> ${m.crossWords.join(", ")}`:""}
        ${starInfo.length?`<br><b>Yıldız bonusu:</b> ${starInfo.join(", ")}`:""}
        ${m.riskyCells.length?`<br><b>Açabileceği kareler:</b> ${m.riskyCells.map(c=>`${c.label}@${cellLabel(c.r,c.c)}`).join(", ")}`:""}
      </div>
      <div class="result-actions">
        <button type="button" class="apply-btn">TAHTAYA UYGULA</button>
      </div>`;
    d.addEventListener("click",()=>previewMove(m));
    d.querySelector(".apply-btn").addEventListener("click", e=>{
      e.stopPropagation();
      applyMove(m);
    });
    resultsEl.appendChild(d);
  });
}

onlyBingoEl.addEventListener("change", () => { if(hasSearched) showResults(lastMoves); });
hideRiskyEl.addEventListener("change", () => { if(hasSearched) showResults(lastMoves); });

function applyMove(m){
  // Yeni taşları tahtaya yaz (mevcut taşların üzerine dokunmaz, sadece boş kareler doldurulur).
  for(const p of m.placed){
    board[p.r][p.c] = p.letter;
  }

  // Kullanılan harfleri (jokerler dahil) elden düş.
  const rackLetters = rackEl.value.split("");
  for(const p of m.placed){
    const target = p.blank ? "*" : p.letter;
    const idx = rackLetters.indexOf(target);
    if(idx !== -1) rackLetters.splice(idx,1);
  }
  rackEl.value = rackLetters.join("");

  const last = m.placed[m.placed.length-1];
  selected = {r:last.r, c:last.c};

  renderRack();
  resultsEl.innerHTML = `<div class="empty">✅ <b>${m.word}</b> tahtaya uygulandı (+${m.score} puan). Yeni ele göre istersen tekrar hamle arayabilirsin.</div>`;
  document.getElementById("resultCount").textContent = "0";
  document.getElementById("resultCountLabel").textContent = "0 hamle";
  previewCells = [];
  hasSearched = false;
  lastMoves = [];

  renderBoard();
  persistActiveGame();
}

function previewMove(m){
  previewCells=m.placed;
  renderBoard(previewCells);
}

function startStarPlacement(type){
  starMode = starMode===type ? null : type;
  updateStarMode();
}

document.getElementById("placeStar2").addEventListener("click",()=>startStarPlacement("star2"));
document.getElementById("placeStar3").addEventListener("click",()=>startStarPlacement("star3"));
document.getElementById("removeStars").addEventListener("click",()=>{
  star2Pos=null;
  star3Pos=null;
  starMode=null;
  updateStarMode();
  clearResults(false);
  renderBoard();
  persistActiveGame();
});

document.getElementById("solve").addEventListener("click",()=>{
  if(solving) return;
  solving=true;
  const btn=document.getElementById("solve");
  btn.disabled=true;
  btn.textContent="HESAPLANIYOR…";
  resultsEl.innerHTML='<div class="empty">Tahtadaki olası yerleşimler taranıyor…</div>';
  setTimeout(()=>{
    try{
      const moves=findMoves();
      showResults(moves);
    }catch(err){
      console.error(err);
      resultsEl.innerHTML=`<div class="empty">Hata: ${err.message}</div>`;
    }finally{
      solving=false;
      btn.disabled=false;
      btn.textContent="EN İYİ HAMLELERİ BUL";
    }
  },20);
});

document.getElementById("clearBoard").addEventListener("click",()=>{
  board=Array.from({length:SIZE},()=>Array(SIZE).fill(null));
  selected={r:CENTER,c:CENTER};
  clearResults(true);
  renderBoard();
  persistActiveGame();
});

document.getElementById("loadExample").addEventListener("click",()=>{
  board=Array.from({length:SIZE},()=>Array(SIZE).fill(null));
  const put=(r,c,w,dr=0,dc=1)=>[...w].forEach((ch,i)=>board[r+dr*i][c+dc*i]=ch);

  // Ekran görüntüsündeki iki özel yıldızı örnek olarak göster.
  star2Pos={r:7,c:7};
  star3Pos={r:10,c:1};

  put(7,4,"KALEM");
  put(5,7,"BULANTI",1,0);
  rackEl.value="MERAKI";
  renderRack();
  selected={r:7,c:4};
  clearResults(true);
  statusEl.textContent += " • örnek tahta hazır";
  renderBoard();
  persistActiveGame();
});

document.getElementById("dictFile").addEventListener("change",async e=>{
  const file=e.target.files[0];
  if(!file) return;
  try{
    const text=await file.text();
    setDictionary(text,"Yerel dosya");
  }catch(err){ alert("Sözlük okunamadı: "+err.message); }
});
document.getElementById("reloadDict").addEventListener("click",()=>loadDictionary());

function setDictionary(text,source){
  const set=new Set();
  for(const raw of text.split(/\r?\n/)){
    const w=normalizeWord(raw.split(/[;,]/)[0]);
    if(w.length>=2 && w.length<=15 && isLetterWord(w)) set.add(w);
  }
  dictionary=set;
  dictionaryWords=Array.from(set);
  statusEl.textContent=`Sözlük hazır: ${dictionary.size.toLocaleString("tr-TR")} kelime`;
  infoEl.textContent=`Kaynak: ${source}. 2–15 harf aralığı kullanılıyor.`;
}

async function loadDictionary(){
  statusEl.textContent="Sözlük yükleniyor…";
  infoEl.textContent="Yerel sözlük dosyası kontrol ediliyor…";

  // 1) Önce sayfayla birlikte gelen yerel dictionary.txt'yi dene. Bu dosya
  //    hem GitHub Pages'e hem de APK'nın içine gömülü olarak konursa,
  //    uygulama internete hiç ihtiyaç duymadan açılabilir.
  try{
    const res=await fetch("dictionary.txt",{cache:"no-store"});
    if(res.ok){
      const text=await res.text();
      if(text && text.length>100){
        setDictionary(text,"Yerel gömülü sözlük (dictionary.txt)");
        return;
      }
    }
  }catch(err){
    console.warn("Yerel sözlük bulunamadı, internetten denenecek:", err);
  }

  // 2) Yerel dosya yoksa internetten indirmeyi dene.
  statusEl.textContent="Sözlük yükleniyor…";
  infoEl.textContent="İnternetten Türkçe kelime listesi getiriliyor.";
  try{
    const res=await fetch(DICT_URL,{cache:"no-store"});
    if(!res.ok) throw new Error("HTTP "+res.status);
    const text=await res.text();
    setDictionary(text,"Kelimelik Türkçe kelime listesi (internet)");
  }catch(err){
    statusEl.textContent="Sözlük yüklenemedi";
    infoEl.innerHTML='Yerel ya da internet sözlüğü bulunamadı. <b>.txt</b> sözlük dosyası seçerek devam edebilirsin.';
    console.warn(err);
  }
}

loadActiveGameIntoState();
makeBoard();
renderRack();
updateStarMode();
renderGamesBar();
loadDictionary();

// PWA: Service Worker'ı kaydet (offline çalışma + telefonda "yükle" istemi için).
// Not: Bu yalnızca "güvenli bağlam"da çalışır — https:// veya http://localhost.
// Düz http://192.168.x.x gibi yerel ağ adreslerinde tarayıcı bunu güvenli
// saymadığından servis çalışanı kaydolmaz; sayfa yine de normal açılır.
if("serviceWorker" in navigator){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js")
      .catch(err => console.warn("Service worker kaydedilemedi (güvenli bağlam değil olabilir):", err));
  });
}
