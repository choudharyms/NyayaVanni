import { describe, it, expect } from 'vitest';
import { calculateLayout } from './graphLayout';

describe('calculateLayout', () => {
  it('correctly assigns columns horizontally based on node type depth', () => {
    const nodes = [
      { id: 'clause1', label: 'Clause 1', type: 'clauses' },
      { id: 'obligation1', label: 'Obligation 1', type: 'obligations' },
      { id: 'date1', label: 'Date 1', type: 'dates' },
      { id: 'party1', label: 'Party 1', type: 'parties' }
    ];
    const edges = [];

    const positions = calculateLayout(nodes, edges, { colWidth: 350, rowHeight: 120 });

    // Column 0 (clauses) -> x = 0
    expect(positions['clause1'].x).toBe(0);

    // Column 1 (obligations) -> x = 350
    expect(positions['obligation1'].x).toBe(350);

    // Column 2 (leaves like dates, parties) -> x = 700
    expect(positions['date1'].x).toBe(700);
    expect(positions['party1'].x).toBe(700);
  });

  it('applies vertical centering math correctly', () => {
    const nodes = [
      { id: 'clause1', type: 'clauses' },
      { id: 'obligation1', type: 'obligations' },
      { id: 'date1', type: 'dates' },
      { id: 'party1', type: 'parties' }
    ];
    const edges = [];

    // maxNodes is 2 (column 2 has 2 nodes: date1 and party1).
    // rowHeight = 100. maxHeight = 2 * 100 = 200.
    // Column 0 totalHeight = 100 -> startY = (200 - 100) / 2 = 50. y(clause1) = 50.
    // Column 1 totalHeight = 100 -> startY = (200 - 100) / 2 = 50. y(obligation1) = 50.
    // Column 2 totalHeight = 200 -> startY = (200 - 200) / 2 = 0. y(date1) = 0, y(party1) = 100.
    const positions = calculateLayout(nodes, edges, { rowHeight: 100 });

    expect(positions['clause1'].y).toBe(50);
    expect(positions['obligation1'].y).toBe(50);
    expect(positions['date1'].y).toBe(0);
    expect(positions['party1'].y).toBe(100);
  });

  it('handles empty or disconnected/missing node list safely', () => {
    const positions = calculateLayout([], []);
    expect(positions).toEqual({});
  });
});
