// Simple, robust step-mode visualizer for 6 sorts.
// Steps are generated from a local copy (deterministic), then executed on DOM by Next/Play.

// Globals / state
let array = [];
let lastInput = "";
let steps = [];       // array of step objects
let stepIndex = 0;
let playTimer = null;
let isPlaying = false;
let selectedAlgo = "";

// Helpers
const $ = id => document.getElementById(id);
function renderBars(arr) {
  const container = $("bars");
  container.innerHTML = "";
  for (let v of arr) {
    const b = document.createElement("div");
    b.className = "bar";
    b.style.height = `${Math.max(10, v) * 3}px`; // ensure visible
    const s = document.createElement("span");
    s.textContent = v;
    b.appendChild(s);
    container.appendChild(b);
  }
}
function clearTempClasses() {
  document.querySelectorAll(".bar").forEach(b => {
    b.classList.remove("compare","swap","pivot");
  });
}
function markAllSorted() {
  document.querySelectorAll(".bar").forEach(b => {
    b.classList.remove("compare","swap","pivot");
    b.classList.add("sorted");
  });
}
function updateStepInfo() {
  $("step-info").textContent = steps.length ? `Step ${stepIndex}/${steps.length} — next: ${steps[stepIndex] ? steps[stepIndex].type : 'done'}` : "No steps generated";
}
function setStatus(t) { $("status").textContent = t || ""; }

// Generate bars from input
function generateArrayFromInput() {
  const raw = $("arrayInput").value.trim();
  setStatus("");
  steps = []; stepIndex = 0; selectedAlgo = "";
  if (!raw) { alert("Enter numbers separated by commas"); return; }
  const parsed = raw.split(",").map(x => Number(x.trim())).filter(x => !isNaN(x));
  if (!parsed.length) { alert("Invalid input"); return; }
  array = parsed.slice();
  lastInput = raw;
  renderBars(array);
  updateStepInfo();
  $("algo-info").innerHTML = "<p>Select algorithm to generate steps (it won't run).</p>";
}

// Reset to original array and clear steps
function resetArray() {
  stopPlay();
  steps = []; stepIndex = 0; selectedAlgo = "";
  if (lastInput) {
    $("arrayInput").value = lastInput;
    array = lastInput.split(",").map(x => Number(x.trim()));
    renderBars(array);
  } else {
    $("bars").innerHTML = "";
  }
  clearTempClasses();
  document.querySelectorAll(".bar").forEach(b => b.classList.remove("sorted"));
  updateStepInfo();
  setStatus("Reset.");
  $("algo-info").innerHTML = "<p>Select algorithm to generate steps (it won't run).</p>";
}

/* ---------- Step execution ---------- */
function executeStep(step) {
  if (!step) return;
  const bars = document.querySelectorAll(".bar");
  clearTempClasses();

  switch(step.type) {
    case "compare":
      bars[step.i].classList.add("compare");
      bars[step.j].classList.add("compare");
      break;

    case "swap":
      {
        // swap heights and labels
        const bi = bars[step.i], bj = bars[step.j];
        const hi = bi.style.height, hj = bj.style.height;
        const ti = bi.children[0].textContent, tj = bj.children[0].textContent;
        bi.style.height = hj; bj.style.height = hi;
        bi.children[0].textContent = tj; bj.children[0].textContent = ti;
        bi.classList.add("swap"); bj.classList.add("swap");
      }
      break;

    case "assign":
      {
        // set index to a value (used in merge)
        const b = bars[step.index];
        b.style.height = `${step.value * 3}px`;
        b.children[0].textContent = step.value;
        b.classList.add("swap");
      }
      break;

    case "pivot":
      bars[step.index].classList.add("pivot");
      break;

    case "markSorted":
      bars[step.index].classList.add("sorted");
      break;

    case "clear":
      // nothing: clearTempClasses already ran
      break;
  }
}

// Next step (single)
function nextStep() {
  if (!steps.length) { alert("No steps generated. Choose an algorithm first."); return; }
  if (stepIndex >= steps.length) { setStatus("Finished."); return; }
  const step = steps[stepIndex++];
  executeStep(step);
  updateStepInfo();
  if (stepIndex >= steps.length) {
    markAllSorted();
    stopPlay();
    setStatus("Finished.");
  } else {
    setStatus(`Executed step ${stepIndex}`);
  }
}

// Play steps automatically
function playSteps(speed = 500) {
  if (!steps.length) { alert("No steps generated."); return; }
  if (isPlaying) return;
  isPlaying = true;
  setStatus("Playing...");
  playTimer = setInterval(() => {
    if (stepIndex < steps.length) nextStep(); else stopPlay();
  }, speed);
}
function stopPlay() {
  isPlaying = false;
  if (playTimer) { clearInterval(playTimer); playTimer = null; }
}

/* ---------- Algorithm selection & Step generation ---------- */

function selectAlgo(algo) {
  if (!array || !array.length) { alert("Generate array first."); return; }
  stopPlay();
  steps = []; stepIndex = 0;
  selectedAlgo = algo;
  $("algo-info").innerHTML = algoDetails(algo);
  // generate steps using a local copy so it is deterministic
  const copy = array.slice();
  switch(algo) {
    case "bubble": generateBubbleSteps(copy); break;
    case "selection": generateSelectionSteps(copy); break;
    case "insertion": generateInsertionSteps(copy); break;
    case "merge": generateMergeSteps(copy); break;
    case "quick": generateQuickSteps(copy); break;
    case "heap": generateHeapSteps(copy); break;
  }
  updateStepInfo();
  setStatus(`Generated ${steps.length} steps for ${algo}. Use Next or Play.`);
}


function algoDetails(algo) {
    const d = {
      bubble: `
        <h3>Bubble Sort</h3>
        <p><strong>How it works:</strong> Repeatedly compare adjacent elements and swap if they are in the wrong order. Each pass pushes the largest unsorted element to its correct position.</p>
        <p><strong>Time Complexity:</strong> Best: O(n) (already sorted), Average: O(n²), Worst: O(n²)</p>
        <p><strong>Space Complexity:</strong> O(1) — in-place</p>
        <p><strong>Stability:</strong> Stable (preserves order of equal elements)</p>
        <p><strong>Use-case:</strong> Educational purposes or very small arrays.</p>
      `,
      
      selection: `
        <h3>Selection Sort</h3>
        <p><strong>How it works:</strong> Repeatedly find the minimum element from the unsorted portion and swap it with the first unsorted element. Progressively builds a sorted portion at the start.</p>
        <p><strong>Time Complexity:</strong> Best/Average/Worst: O(n²)</p>
        <p><strong>Space Complexity:</strong> O(1) — in-place</p>
        <p><strong>Stability:</strong> Not stable (swapping may change relative order)</p>
        <p><strong>Use-case:</strong> Small arrays where memory writes are costly, simple to implement.</p>
      `,
      
      insertion: `
        <h3>Insertion Sort</h3>
        <p><strong>How it works:</strong> Build the sorted portion of the array one element at a time by inserting the current element into its correct position among the already sorted elements.</p>
        <p><strong>Time Complexity:</strong> Best: O(n) (already sorted), Average/Worst: O(n²)</p>
        <p><strong>Space Complexity:</strong> O(1) — in-place</p>
        <p><strong>Stability:</strong> Stable</p>
        <p><strong>Use-case:</strong> Small arrays, nearly sorted arrays, or as part of hybrid algorithms like TimSort.</p>
      `,
      
      merge: `
        <h3>Merge Sort</h3>
        <p><strong>How it works:</strong> Divide the array into two halves, recursively sort each half, then merge the sorted halves. Uses additional memory for merging.</p>
        <p><strong>Time Complexity:</strong> Best/Average/Worst: O(n log n)</p>
        <p><strong>Space Complexity:</strong> O(n) — requires temporary array for merging</p>
        <p><strong>Stability:</strong> Stable</p>
        <p><strong>Use-case:</strong> Large arrays, linked lists, or when stability is important.</p>
      `,
      
      quick: `
        <h3>Quick Sort</h3>
        <p><strong>How it works:</strong> Pick a pivot, partition the array into elements less than and greater than the pivot, then recursively sort the partitions.</p>
        <p><strong>Time Complexity:</strong> Best/Average: O(n log n), Worst: O(n²) (rare, depends on pivot selection)</p>
        <p><strong>Space Complexity:</strong> O(log n) — recursion stack</p>
        <p><strong>Stability:</strong> Not stable</p>
        <p><strong>Use-case:</strong> Large arrays; often faster in practice than Merge Sort due to cache efficiency.</p>
      `,
      
      heap: `
        <h3>Heap Sort</h3>
        <p><strong>How it works:</strong> Build a max heap, then repeatedly extract the maximum element and place it at the end of the array. Maintains heap property during extraction.</p>
        <p><strong>Time Complexity:</strong> Best/Average/Worst: O(n log n)</p>
        <p><strong>Space Complexity:</strong> O(1) — in-place</p>
        <p><strong>Stability:</strong> Not stable</p>
        <p><strong>Use-case:</strong> When guaranteed O(n log n) time is required and in-place sorting is needed.</p>
      `
    };
  
    return d[algo] || "<p>No details available.</p>";
  }
  


/* ---------- Step generators (operate on local copy) ---------- */

/* Bubble: push compare + swap + clear + markSorted */
function generateBubbleSteps(arr) {
  const n = arr.length;
  for (let i=0;i<n-1;i++) {
    for (let j=0;j<n-i-1;j++) {
      steps.push({type:"compare", i:j, j:j+1});
      if (arr[j] > arr[j+1]) {
        steps.push({type:"swap", i:j, j:j+1});
        [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
      }
      steps.push({type:"clear"});
    }
    steps.push({type:"markSorted", index:n-1-i});
  }
  steps.push({type:"markSorted", index:0});
}

/* Selection: highlight min via compare, swap if needed, mark sorted */
function generateSelectionSteps(arr) {
  const n = arr.length;
  for (let i=0;i<n;i++) {
    let minIdx = i;
    for (let j=i+1;j<n;j++) {
      steps.push({type:"compare", i:j, j:minIdx});
      if (arr[j] < arr[minIdx]) minIdx = j;
      steps.push({type:"clear"});
    }
    if (minIdx !== i) {
      steps.push({type:"swap", i:i, j:minIdx});
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
    steps.push({type:"markSorted", index:i});
  }
}

/* Insertion: model shifts as swaps (clear afterwards) */
function generateInsertionSteps(arr) {
  const n = arr.length;
  for (let i=1;i<n;i++) {
    let j = i;
    while (j>0 && arr[j-1] > arr[j]) {
      steps.push({type:"compare", i:j-1, j:j});
      steps.push({type:"swap", i:j-1, j:j});
      [arr[j-1], arr[j]] = [arr[j], arr[j-1]];
      steps.push({type:"clear"});
      j--;
    }
    // optional: mark the sorted prefix boundary
    steps.push({type:"markSorted", index:j});
  }
  // final mark all sorted
  for (let k=0;k<n;k++) steps.push({type:"markSorted", index:k});
}

/* Merge: we push compare between next left/right elements then assign to k */
function generateMergeSteps(arr) {
  function _merge(a, l, m, r) {
    const left = a.slice(l, m+1);
    const right = a.slice(m+1, r+1);
    let i=0,j=0,k=l;
    while (i < left.length && j < right.length) {
      // compare left[i] and right[j] (we show their original positions relative to k for clarity)
      steps.push({type:"compare", i: l + i, j: m+1 + j});
      if (left[i] <= right[j]) {
        steps.push({type:"assign", index:k, value:left[i]});
        a[k++] = left[i++];
      } else {
        steps.push({type:"assign", index:k, value:right[j]});
        a[k++] = right[j++];
      }
      steps.push({type:"clear"});
    }
    while (i < left.length) {
      steps.push({type:"assign", index:k, value:left[i]});
      a[k++] = left[i++];
      steps.push({type:"clear"});
    }
    while (j < right.length) {
      steps.push({type:"assign", index:k, value:right[j]});
      a[k++] = right[j++];
      steps.push({type:"clear"});
    }
  }
  function _ms(a, l, r) {
    if (l >= r) return;
    const m = Math.floor((l + r)/2);
    _ms(a, l, m);
    _ms(a, m+1, r);
    _merge(a, l, m, r);
  }
  _ms(arr, 0, arr.length-1);
  for (let i=0;i<arr.length;i++) steps.push({type:"markSorted", index:i});
}

/* Quick: classic Lomuto partition steps (pivot at high) */
function generateQuickSteps(arr) {
  function _partition(a, low, high) {
    const pivot = a[high];
    steps.push({type:"pivot", index:high});
    let i = low - 1;
    for (let j=low;j<high;j++) {
      steps.push({type:"compare", i:j, j:high});
      if (a[j] < pivot) {
        i++;
        steps.push({type:"swap", i:i, j:j});
        [a[i], a[j]] = [a[j], a[i]];
      }
      steps.push({type:"clear"});
    }
    steps.push({type:"swap", i:i+1, j:high});
    [a[i+1], a[high]] = [a[high], a[i+1]];
    steps.push({type:"clear"});
    return i+1;
  }
  function _qs(a, low, high) {
    if (low < high) {
      const p = _partition(a, low, high);
      _qs(a, low, p-1);
      _qs(a, p+1, high);
    }
  }
  _qs(arr, 0, arr.length-1);
  for (let i=0;i<arr.length;i++) steps.push({type:"markSorted", index:i});
}

/* Heap: build heap then extract; heapify produces swaps */
function generateHeapSteps(arr) {
  const n = arr.length;
  function _heapify(a, size, i) {
    let largest = i;
    const l = 2*i+1, r = 2*i+2;
    if (l < size) {
      steps.push({type:"compare", i:l, j:largest});
      if (a[l] > a[largest]) largest = l;
      steps.push({type:"clear"});
    }
    if (r < size) {
      steps.push({type:"compare", i:r, j:largest});
      if (a[r] > a[largest]) largest = r;
      steps.push({type:"clear"});
    }
    if (largest !== i) {
      steps.push({type:"swap", i:i, j:largest});
      [a[i], a[largest]] = [a[largest], a[i]];
      _heapify(a, size, largest);
    }
  }
  // build max-heap
  for (let i = Math.floor(n/2)-1; i>=0; i--) _heapify(arr, n, i);
  // extract
  for (let i = n-1; i>0; i--) {
    steps.push({type:"swap", i:0, j:i});
    [arr[0], arr[i]] = [arr[i], arr[0]];
    steps.push({type:"markSorted", index:i});
    _heapify(arr, i, 0);
  }
  steps.push({type:"markSorted", index:0});
}

/* ---------- init ---------- */
updateStepInfo();
setStatus("");
