// js/bfs.js

async function visualizeBFS(grid, startNode, endNode, getNeighbors, animateNode, animationDelay) {
  if (!startNode || !endNode || !grid) {
    throw new Error('BFS: Missing required parameters');
  }
  
  const queue = [];
  const visitedCount = { count: 0 };
  const maxNodes = grid.length * (grid[0] ? grid[0].length : 0);
  
  startNode.distance = 0;
  queue.push(startNode);
  
  while (queue.length > 0) {
    if (shouldStop) return;
    if (visitedCount.count > maxNodes) {
      console.warn('BFS: Maximum iterations exceeded');
      break;
    }
    
    const current = queue.shift();
    if (!current || current.isWall) continue;
    
    if (!current.isStart && !current.isEnd) {
      await animateNode(current, 'visited', animationDelay);
      if (shouldStop) return;
    }
    
    visitedCount.count++;
    
    if (current === endNode) break;
    
    for (const neighbor of getNeighbors(current)) {
      if (!neighbor.isVisited && !neighbor.isWall) {
        neighbor.isVisited = true;
        neighbor.distance = current.distance + 1;
        neighbor.previousNode = current;
        queue.push(neighbor);
      }
    }
  }
  
  // Reconstruct and animate path
  let node = endNode;
  const path = [];
  const maxPathLength = maxNodes; // Prevent infinite loops
  let pathLength = 0;
  
  while (node && node !== startNode && pathLength < maxPathLength) {
    path.push(node);
    node = node.previousNode;
    pathLength++;
  }
  
  if (pathLength >= maxPathLength) {
    console.warn('BFS: Path reconstruction exceeded maximum length');
  }
  
  path.reverse();
  
  for (const step of path) {
    if (shouldStop) return;
    if (!step.isEnd) {
      await animateNode(step, 'path', animationDelay);
    }
  }
}
