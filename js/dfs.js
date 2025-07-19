// js/dfs.js

async function visualizeDFS(grid, startNode, endNode, getNeighbors, animateNode, animationDelay) {
  if (!startNode || !endNode || !grid) {
    throw new Error('DFS: Missing required parameters');
  }
  
  const visited = new Set();
  const maxNodes = grid.length * (grid[0] ? grid[0].length : 0);
  let visitedCount = 0;
  
  async function dfs(node) {
    if (shouldStop) return false;
    if (!node || node.isWall || visited.has(node)) return false;
    if (visitedCount > maxNodes) {
      console.warn('DFS: Maximum iterations exceeded');
      return false;
    }
    
    visited.add(node);
    visitedCount++;
    
    if (!node.isStart && !node.isEnd) {
      await animateNode(node, 'visited', animationDelay);
      if (shouldStop) return false;
    }
    
    if (node === endNode) return true;
    
    // Shuffle neighbors for more interesting visualization
    const neighbors = getNeighbors(node);
    for (let i = neighbors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
    }
    
    for (const neighbor of neighbors) {
      if (shouldStop) return false;
      if (!visited.has(neighbor)) {
        neighbor.previousNode = node;
        const found = await dfs(neighbor);
        if (found) return true;
      }
    }
    
    return false;
  }
  
  await dfs(startNode);
  
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
    console.warn('DFS: Path reconstruction exceeded maximum length');
  }
  
  path.reverse();
  
  for (const step of path) {
    if (shouldStop) return;
    if (!step.isEnd) {
      await animateNode(step, 'path', animationDelay);
    }
  }
}
