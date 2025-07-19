// js/dijkstra.js

class MinHeap {
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
      if (this.heap[parentIdx].distance <= this.heap[idx].distance) break;
      
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
      
      if (leftIdx <= lastIdx && this.heap[leftIdx].distance < this.heap[idx].distance) {
        swapIdx = leftIdx;
      }
      
      if (rightIdx <= lastIdx && 
          this.heap[rightIdx].distance < 
          (swapIdx === null ? this.heap[idx].distance : this.heap[leftIdx].distance)) {
        swapIdx = rightIdx;
      }
      
      if (swapIdx === null) break;
      
      [this.heap[idx], this.heap[swapIdx]] = [this.heap[swapIdx], this.heap[idx]];
      idx = swapIdx;
    }
  }
  
  isEmpty() {
    return this.heap.length === 0;
  }
  
  size() {
    return this.heap.length;
  }
}

async function visualizeDijkstra(grid, startNode, endNode, getNeighbors, animateNode, animationDelay) {
  if (!startNode || !endNode || !grid) {
    throw new Error('Dijkstra: Missing required parameters');
  }
  
  const heap = new MinHeap();
  const maxNodes = grid.length * (grid[0] ? grid[0].length : 0);
  let nodesProcessed = 0;
  
  startNode.distance = 0;
  heap.insert(startNode);
  
  while (!heap.isEmpty()) {
    if (shouldStop) return;
    if (nodesProcessed > maxNodes) {
      console.warn('Dijkstra: Maximum iterations exceeded');
      break;
    }
    
    const current = heap.extractMin();
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
      
      const newDistance = current.distance + 1;
      if (newDistance < neighbor.distance) {
        neighbor.distance = newDistance;
        neighbor.previousNode = current;
        heap.insert(neighbor);
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
    console.warn('Dijkstra: Path reconstruction exceeded maximum length');
  }
  
  path.reverse();
  
  for (const step of path) {
    if (shouldStop) return;
    if (!step.isEnd) {
      await animateNode(step, 'path', animationDelay);
    }
  }
}
