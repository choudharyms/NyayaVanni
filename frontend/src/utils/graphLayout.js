/**
 * Calculates dynamic hierarchical positions for React Flow nodes to prevent overlap.
 * Level 0: clauses, parties, legal_terms, etc.
 * Level 1: obligations, financial_terms
 * Level 2: dates
 * 
 * Orders nodes horizontally using a barycenter heuristic to align children under their parents.
 */
export function calculateLayout(nodes, edges, options = {}) {
  const ySpacing = options.ySpacing || 160;
  const xSpacing = options.xSpacing || 220;

  // 1. Assign level based on node type
  const nodeLevels = {};
  nodes.forEach(node => {
    if (node.type === 'obligations' || node.type === 'financial_terms') {
      nodeLevels[node.id] = 1;
    } else if (node.type === 'dates') {
      nodeLevels[node.id] = 2;
    } else {
      nodeLevels[node.id] = 0;
    }
  });

  // Group nodes by level
  const levels = { 0: [], 1: [], 2: [] };
  nodes.forEach(node => {
    const lvl = nodeLevels[node.id];
    levels[lvl].push(node);
  });

  const positions = {};

  // 2. Position Level 0 nodes (centered horizontally)
  const lvl0Count = levels[0].length;
  levels[0].forEach((node, idx) => {
    const x = (idx - (lvl0Count - 1) / 2) * xSpacing;
    positions[node.id] = { x, y: 0 };
  });

  // Helper to find parents of a node at a specific level
  const getParents = (nodeId, parentLevel) => {
    const parents = [];
    edges.forEach(edge => {
      if (edge.target === nodeId) {
        if (nodeLevels[edge.source] === parentLevel) {
          parents.push(edge.source);
        }
      }
    });
    return parents;
  };

  // 3. Position Level 1 nodes using barycenter
  const lvl1Nodes = levels[1].map(node => {
    const parents = getParents(node.id, 0);
    let targetX = 0;
    if (parents.length > 0) {
      const sumX = parents.reduce((sum, pId) => sum + (positions[pId]?.x || 0), 0);
      targetX = sumX / parents.length;
    }
    return { node, targetX };
  });

  // Sort by targetX and space out
  lvl1Nodes.sort((a, b) => a.targetX - b.targetX);
  const lvl1Count = lvl1Nodes.length;
  lvl1Nodes.forEach((item, idx) => {
    const x = (idx - (lvl1Count - 1) / 2) * xSpacing;
    positions[item.node.id] = { x, y: ySpacing };
  });

  // 4. Position Level 2 nodes using barycenter
  const lvl2Nodes = levels[2].map(node => {
    const parents = getParents(node.id, 1);
    let targetX = 0;
    if (parents.length > 0) {
      const sumX = parents.reduce((sum, pId) => sum + (positions[pId]?.x || 0), 0);
      targetX = sumX / parents.length;
    }
    return { node, targetX };
  });

  // Sort by targetX and space out
  lvl2Nodes.sort((a, b) => a.targetX - b.targetX);
  const lvl2Count = lvl2Nodes.length;
  lvl2Nodes.forEach((item, idx) => {
    const x = (idx - (lvl2Count - 1) / 2) * xSpacing;
    positions[item.node.id] = { x, y: ySpacing * 2 };
  });

  return positions;
}
