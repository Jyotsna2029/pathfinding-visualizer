// js/astar.js

// Manhattan distance heuristic
function heuristic(a, b) {
  if (!a || !b) return Infinity;
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

// A* specific MinHeap that compares f values
class AStarHeap {
  constructor() {
    this.heap = [];
  }
  
  insert(node) {
    if (!node) return;
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }
  
  bubbleUp(idx) {
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const currentF = this.heap[idx].f || Infinity;
      const parentF = this.heap[parentIdx].f || Infinity;
      
      if (parentF <= currentF) break;
      
      [this.heap[parentIdx], this.heap[idx]] = [this.heap[idx], this.heap[parentIdx]];
      idx = parentIdx;
    }
  }
  
  extractMin() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();
    
    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.bubbleDown(0);
    return min;
  }
  
  bubbleDown(idx) {
    const lastIdx = this.heap.length - 1;
    
    while (true) {
      const leftIdx = 2 * idx + 1;
      const rightIdx = 2 * idx + 2;
      let swapIdx = null;
      
      const currentF = this.heap[idx].f || Infinity;
      
      if (leftIdx <= lastIdx) {
        const leftF = this.heap[leftIdx].f || Infinity;
        if (leftF < currentF) {
          swapIdx = leftIdx;
        }
      }
      
      if (rightIdx <= lastIdx) {
        const rightF = this.heap[rightIdx].f || Infinity;
        const compareF = swapIdx === null ? currentF : (this.heap[leftIdx].f || Infinity);
        if (rightF < compareF) {
          swapIdx = rightIdx;
        }
      }
      
      if (swapIdx === null) break;
      
      [this.heap[idx], this.heap[swapIdx]] = [this.heap[swapIdx], this.heap[idx]];
      idx = swapIdx;
    }
  }
  
  isEmpty() {
    return this.heap.length === 0;
  }
}

async function visualizeAStar(grid, startNode, endNode, getNeighbors, animateNode, animationDelay) {
  if (!startNode || !endNode || !grid) {
    throw new Error('A*: Missing required parameters');
  }
  
  const openSet = new AStarHeap();
  const maxNodes = grid.length * (grid[0] ? grid[0].length : 0);
  let nodesProcessed = 0;
  
  startNode.distance = 0; // g score
  startNode.f = heuristic(startNode, endNode); // f score
  openSet.insert(startNode);
  
  while (!openSet.isEmpty()) {
    if (shouldStop) return;
    if (nodesProcessed > maxNodes) {
      console.warn('A*: Maximum iterations exceeded');
      break;
    }
    
    const current = openSet.extractMin();
    if (!current || current.isWall || current.isVisited) continue;
    
    current.isVisited = true;
    nodesProcessed++;
    
    if (!current.isStart && !current.isEnd) {
      await animateNode(current, 'visited', animationDelay);
      if (shouldStop) return;
    }
    
    if (current === endNode) break;
    
    for (const neighbor of getNeighbors(current)) {
      if (neighbor.isWall || neighbor.isVisited) continue;
      
      const tentativeGScore = current.distance + 1;
      
      if (tentativeGScore < neighbor.distance) {
        neighbor.previousNode = current;
        neighbor.distance = tentativeGScore; // g score
        neighbor.f = tentativeGScore + heuristic(neighbor, endNode); // f score
        openSet.insert(neighbor);
      }
    }
  }
  
  // Reconstruct and animate path
  let node = endNode;
  const path = [];
  const maxPathLength = maxNodes;
  let pathLength = 0;
  
  while (node && node !== startNode && pathLength < maxPathLength) {
    path.push(node);
    node = node.previousNode;
    pathLength++;
  }
  
  if (pathLength >= maxPathLength) {
    console.warn('A*: Path reconstruction exceeded maximum length');
  }
  
  path.reverse();
  
  for (const step of path) {
    if (shouldStop) return;
    if (!step.isEnd) {
      await animateNode(step, 'path', animationDelay);
    }
  }
}

