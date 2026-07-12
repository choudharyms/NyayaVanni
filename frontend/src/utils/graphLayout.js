/**
 * Calculates dynamic hierarchical positions for React Flow nodes to prevent overlap.
 * Column 0: clauses
 * Column 1: obligations
 * Column 2: leaves (parties, dates, terms, etc.)
 * 
 * Vertically centers each column cleanly.
 */
export function calculateLayout(nodes, edges, options = {}) {
  const colWidth = options.colWidth || options.xSpacing || 350;
  const rowHeight = options.rowHeight || options.ySpacing || 120;

  // Group nodes by column for dynamic centering layout
  const nodesByColumn = { 0: [], 1: [], 2: [] };
  nodes.forEach((node) => {
    let col = 2;
    if (node.type === 'clauses') col = 0;
    else if (node.type === 'obligations') col = 1;
    nodesByColumn[col].push(node);
  });

  const maxNodes = Math.max(
    nodesByColumn[0].length,
    nodesByColumn[1].length,
    nodesByColumn[2].length
  );
  const maxHeight = maxNodes * rowHeight;

  const positions = {};
  [0, 1, 2].forEach((col) => {
    const colNodes = nodesByColumn[col];
    const totalHeight = colNodes.length * rowHeight;
    const startY = (maxHeight - totalHeight) / 2;

    colNodes.forEach((node, idx) => {
      positions[node.id] = {
        x: col * colWidth,
        y: startY + idx * rowHeight,
      };
    });
  });

  return positions;
}
