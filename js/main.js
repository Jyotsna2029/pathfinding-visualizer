// js/main.js

let GRID_ROWS = 20, GRID_COLS = 50;
let grid = [], startNode = null, endNode = null;
let isMouseDown = false, isDraggingNode = false, draggedNodeType = null;
let animationDelay = 210; // Will be calculated from speed
let algorithmRunning = false, shouldStop = false;

document.addEventListener('DOMContentLoaded', () => {
  initializeGrid();
  setupEventListeners();
  updateStatus('Ready');
});

// Build and reset grid
function initializeGrid() {
  try {
    const container = document.querySelector('.grid-container');
    if (!container) throw new Error('Grid container not found');
    
    container.innerHTML = '';
    const gridEl = document.createElement('div');
    gridEl.className = 'grid';
    gridEl.style.gridTemplateColumns = `repeat(${GRID_COLS}, 1fr)`;
    gridEl.style.gridTemplateRows = `repeat(${GRID_ROWS}, 1fr)`;
    gridEl.setAttribute('role', 'grid');
    gridEl.setAttribute('aria-label', `Pathfinding grid ${GRID_ROWS} by ${GRID_COLS}`);
    
    grid = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      grid[r] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-label', `Cell row ${r + 1}, column ${c + 1}`);
        
        grid[r][c] = {
          row: r, col: c,
          isWall: false, isStart: false, isEnd: false,
          isVisited: false, isPath: false,
          distance: Infinity, previousNode: null,
          element: cell
        };
        gridEl.appendChild(cell);
      }
    }
    
    container.appendChild(gridEl);
    setStartNode(Math.floor(GRID_ROWS / 2), Math.floor(GRID_COLS / 4));
    setEndNode(Math.floor(GRID_ROWS / 2), Math.floor(GRID_COLS * 3 / 4));
    
  } catch (error) {
    console.error('Error initializing grid:', error);
    updateStatus('Error: Failed to initialize grid');
  }
}

// Node setters with validation
function setStartNode(r, c) {
  if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) return;
  
  if (startNode) {
    startNode.isStart = false;
    startNode.element.classList.remove('start');
    startNode.element.setAttribute('aria-label', `Cell row ${startNode.row + 1}, column ${startNode.col + 1}`);
  }
  
  const node = grid[r][c];
  node.isStart = true;
  node.isWall = false;
  node.element.classList.remove('wall');
  node.element.classList.add('start');
  node.element.setAttribute('aria-label', `Start node, row ${r + 1}, column ${c + 1}`);
  startNode = node;
}

function setEndNode(r, c) {
  if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) return;
  
  if (endNode) {
    endNode.isEnd = false;
    endNode.element.classList.remove('end');
    endNode.element.setAttribute('aria-label', `Cell row ${endNode.row + 1}, column ${endNode.col + 1}`);
  }
  
  const node = grid[r][c];
  node.isEnd = true;
  node.isWall = false;
  node.element.classList.remove('wall');
  node.element.classList.add('end');
  node.element.setAttribute('aria-label', `End node, row ${r + 1}, column ${c + 1}`);
  endNode = node;
}

// Neighbors utility with bounds checking
function getNeighbors(node) {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  return dirs.map(([dr, dc]) => {
    const nr = node.row + dr, nc = node.col + dc;
    return (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) ? grid[nr][nc] : null;
  }).filter(n => n);
}

// Animation with proper delay calculation
function animateNode(node, cls, delay) {
  return new Promise(res => {
    setTimeout(() => {
      if (node && node.element) {
        node.element.classList.add(cls);
      }
      res();
    }, delay);
  });
}

// Clear paths/visits
function clearPathAndVisits() {
  grid.flat().forEach(n => {
    n.isVisited = false;
    n.element.classList.remove('visited', 'path');
    n.previousNode = null;
    n.distance = Infinity;
  });
}

// Status updates
function updateStatus(message) {
  const statusElement = document.getElementById('status-text');
  if (statusElement) {
    statusElement.textContent = message;
  }
}

// UI state management
function setUIState(running) {
  const startBtn = document.getElementById('start-visualization');
  const stopBtn = document.getElementById('stop-visualization');
  const clearBtn = document.getElementById('clear-grid');
  const resetBtn = document.getElementById('reset-path');
  const mazeBtn = document.getElementById('generate-maze');
  const gridSelect = document.getElementById('grid-size');
  
  if (startBtn) startBtn.disabled = running;
  if (stopBtn) stopBtn.disabled = !running;
  if (clearBtn) clearBtn.disabled = running;
  if (resetBtn) resetBtn.disabled = running;
  if (mazeBtn) mazeBtn.disabled = running;
  if (gridSelect) gridSelect.disabled = running;
  
  // Lock/unlock start and end nodes
  setLockedState(running);
}

// Lock UI for start/end nodes
function setLockedState(lock) {
  document.querySelectorAll('.grid-cell.start, .grid-cell.end')
    .forEach(el => el.classList.toggle('locked', lock));
}

// Speed conversion: User speed (1-100) to delay (1000-10 ms)
function speedToDelay(speed) {
  // Speed 1 = 1000ms delay (very slow)
  // Speed 100 = 10ms delay (very fast)
  return Math.max(10, 1010 - (speed * 10));
}

// Event bindings
function setupEventListeners() {
  const container = document.querySelector('.grid-container');
  
  // Grid events
  container.addEventListener('mousedown', handleMouseDown);
  container.addEventListener('mousemove', handleMouseMove);
  container.addEventListener('mouseup', handleMouseUp);
  container.addEventListener('mouseleave', handleMouseUp);
  container.addEventListener('touchstart', handleTouchStart, { passive: false });
  container.addEventListener('touchmove', handleTouchMove, { passive: false });
  container.addEventListener('touchend', handleMouseUp);
  container.addEventListener('contextmenu', e => e.preventDefault());
  
  // Control events
  document.getElementById('clear-grid')?.addEventListener('click', clearGrid);
  document.getElementById('reset-path')?.addEventListener('click', resetGrid);
  document.getElementById('generate-maze')?.addEventListener('click', generateMaze);
  document.getElementById('start-visualization')?.addEventListener('click', startVisualization);
  document.getElementById('stop-visualization')?.addEventListener('click', stopVisualization);
  document.getElementById('grid-size')?.addEventListener('change', changeGridSize);
  
  // Speed control with corrected logic
  document.getElementById('speed-range')?.addEventListener('input', e => {
    const speed = parseInt(e.target.value);
    animationDelay = speedToDelay(speed);
    document.getElementById('speed-value').textContent = `Speed: ${speed}`;
  });
  
  // Keyboard support
  document.addEventListener('keydown', handleKeyboard);
  
  // Initialize speed display
  const speedSlider = document.getElementById('speed-range');
  if (speedSlider) {
    const speed = parseInt(speedSlider.value);
    animationDelay = speedToDelay(speed);
    document.getElementById('speed-value').textContent = `Speed: ${speed}`;
  }
}

// Keyboard shortcuts
function handleKeyboard(e) {
  if (algorithmRunning) {
    if (e.key === 'Escape') {
      e.preventDefault();
      stopVisualization();
    }
    return;
  }
  
  switch (e.key.toLowerCase()) {
    case 'c':
      e.preventDefault();
      clearGrid();
      break;
    case 'r':
      e.preventDefault();
      resetGrid();
      break;
    case 'm':
      e.preventDefault();
      generateMaze();
      break;
    case ' ':
    case 'Enter':
      if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SELECT') {
        e.preventDefault();
        startVisualization();
      }
      break;
  }
}

// Mouse/touch handlers
function handleMouseDown(e) {
  if (algorithmRunning || !e.target.classList.contains('grid-cell')) return;
  e.preventDefault();
  
  const r = parseInt(e.target.dataset.row);
  const c = parseInt(e.target.dataset.col);
  const node = grid[r][c];
  
  isMouseDown = true;
  
  if (node.isStart) {
    isDraggingNode = true;
    draggedNodeType = 'start';
  } else if (node.isEnd) {
    isDraggingNode = true;
    draggedNodeType = 'end';
  } else {
    toggleWall(r, c);
  }
}

function handleMouseMove(e) {
  if (algorithmRunning || !isMouseDown || !e.target.classList.contains('grid-cell')) return;
  
  const r = parseInt(e.target.dataset.row);
  const c = parseInt(e.target.dataset.col);
  const node = grid[r][c];
  
  if (isDraggingNode) {
    if (draggedNodeType === 'start' && !node.isEnd) {
      setStartNode(r, c);
    } else if (draggedNodeType === 'end' && !node.isStart) {
      setEndNode(r, c);
    }
  } else {
    if (!node.isStart && !node.isEnd) {
      toggleWall(r, c);
    }
  }
}

function handleMouseUp() {
  isMouseDown = false;
  isDraggingNode = false;
  draggedNodeType = null;
}

// Touch handlers
function handleTouchStart(e) {
  if (algorithmRunning) return;
  e.preventDefault();
  
  const touch = e.touches[0];
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  if (el?.classList.contains('grid-cell')) {
    handleMouseDown({ target: el, preventDefault: () => {} });
  }
}

function handleTouchMove(e) {
  if (algorithmRunning) return;
  e.preventDefault();
  
  const touch = e.touches[0];
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  if (el?.classList.contains('grid-cell')) {
    handleMouseMove({ target: el });
  }
}

// Wall toggle
function toggleWall(r, c) {
  const node = grid[r][c];
  if (node.isStart || node.isEnd) return;
  
  node.isWall = !node.isWall;
  node.element.classList.toggle('wall', node.isWall);
  
  const state = node.isWall ? 'wall' : 'empty';
  node.element.setAttribute('aria-label', `${state} cell, row ${r + 1}, column ${c + 1}`);
}

// Grid operations
function clearGrid() {
  if (algorithmRunning) return;
  
  grid.flat().forEach(n => {
    n.isWall = n.isVisited = n.isPath = false;
    n.distance = Infinity;
    n.previousNode = null;
    n.element.className = 'grid-cell';
    n.element.setAttribute('aria-label', `Empty cell, row ${n.row + 1}, column ${n.col + 1}`);
  });
  
  setStartNode(Math.floor(GRID_ROWS / 2), Math.floor(GRID_COLS / 4));
  setEndNode(Math.floor(GRID_ROWS / 2), Math.floor(GRID_COLS * 3 / 4));
  updateStatus('Grid cleared');
}

function resetGrid() {
  if (algorithmRunning) return;
  
  clearPathAndVisits();
  updateStatus('Path reset');
}

function generateMaze() {
  if (algorithmRunning) return;
  
  clearGrid();
  updateStatus('Generating maze...');
  
  // Generate maze with some randomization
  for (let i = 0; i < GRID_ROWS; i++) {
    for (let j = 0; j < GRID_COLS; j++) {
      const node = grid[i][j];
      if (node.isStart || node.isEnd) continue;
      
      if (Math.random() < 0.25) {
        node.isWall = true;
        node.element.classList.add('wall');
        node.element.setAttribute('aria-label', `Wall cell, row ${i + 1}, column ${j + 1}`);
      }
    }
  }
  
  updateStatus('Maze generated');
}

function changeGridSize() {
  if (algorithmRunning) return;
  
  const value = document.getElementById('grid-size').value;
  const [r, c] = value.split('x').map(Number);
  
  if (r > 0 && c > 0) {
    GRID_ROWS = r;
    GRID_COLS = c;
    initializeGrid();
    updateStatus(`Grid resized to ${r}×${c}`);
  }
}

// Stop visualization
function stopVisualization() {
  shouldStop = true;
  algorithmRunning = false;
  setUIState(false);
  updateStatus('Visualization stopped');
}

// Start visualization dispatcher
async function startVisualization() {
  if (algorithmRunning) return;
  
  if (!startNode || !endNode) {
    updateStatus('Error: Start or end node missing');
    return;
  }
  
  algorithmRunning = true;
  shouldStop = false;
  setUIState(true);
  clearPathAndVisits();
  
  const algo = document.getElementById('algorithm-select')?.value;
  updateStatus(`Running ${algo.toUpperCase()}...`);
  
  try {
    switch (algo) {
      case 'bfs':
        await visualizeBFS(grid, startNode, endNode, getNeighbors, animateNode, animationDelay);
        break;
      case 'dfs':
        await visualizeDFS(grid, startNode, endNode, getNeighbors, animateNode, animationDelay);
        break;
      case 'dijkstra':
        await visualizeDijkstra(grid, startNode, endNode, getNeighbors, animateNode, animationDelay);
        break;
      case 'astar':
        await visualizeAStar(grid, startNode, endNode, getNeighbors, animateNode, animationDelay);
        break;
      default:
        throw new Error(`Algorithm ${algo} not implemented`);
    }
    
    if (!shouldStop) {
      updateStatus(`${algo.toUpperCase()} completed`);
    }
    
  } catch (error) {
    console.error('Visualization error:', error);
    updateStatus(`Error: ${error.message}`);
  } finally {
    algorithmRunning = false;
    setUIState(false);
  }
}
