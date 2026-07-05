import { describe, it, expect } from 'vitest';
import { calculateLayout } from './graphLayout';

describe('calculateLayout', () => {
  it('correctly assigns vertical levels based on node types', () => {
    const nodes = [
      { id: 'clause1', label: 'Clause 1', type: 'clauses' },
      { id: 'obligation1', label: 'Obligation 1', type: 'obligations' },
      { id: 'date1', label: 'Date 1', type: 'dates' },
      { id: 'party1', label: 'Party 1', type: 'parties' }
    ];
    const edges = [];

    const positions = calculateLayout(nodes, edges, { ySpacing: 160 });

    // Level 0 (clauses, parties) -> y = 0
    expect(positions['clause1'].y).toBe(0);
    expect(positions['party1'].y).toBe(0);

    // Level 1 (obligations) -> y = 160
    expect(positions['obligation1'].y).toBe(160);

    // Level 2 (dates) -> y = 320
    expect(positions['date1'].y).toBe(320);
  });

  it('centers Level 0 nodes horizontally', () => {
    const nodes = [
      { id: 'n1', label: 'C1', type: 'clauses' },
      { id: 'n2', label: 'C2', type: 'clauses' },
      { id: 'n3', label: 'C3', type: 'clauses' }
    ];
    const edges = [];

    const positions = calculateLayout(nodes, edges, { xSpacing: 200 });

    // x spacing centered around 0: (idx - (lvl0Count - 1) / 2) * xSpacing
    // For 3 nodes, idxs: 0, 1, 2. (lvl0Count-1)/2 = 1.
    // n1: (0 - 1) * 200 = -200
    // n2: (1 - 1) * 200 = 0
    // n3: (2 - 1) * 200 = 200
    expect(positions['n1'].x).toBe(-200);
    expect(positions['n2'].x).toBe(0);
    expect(positions['n3'].x).toBe(200);
  });

  it('aligns Level 1 nodes directly under Level 0 parents using barycenter', () => {
    const nodes = [
      { id: 'c1', label: 'Clause 1', type: 'clauses' }, // idx=0 -> x=-100
      { id: 'c2', label: 'Clause 2', type: 'clauses' }, // idx=1 -> x=100
      { id: 'o1', label: 'Obligation 1', type: 'obligations' },
      { id: 'o2', label: 'Obligation 2', type: 'obligations' }
    ];
    const edges = [
      { source: 'c1', target: 'o1' }, // parent is c1 (x=-100)
      { source: 'c2', target: 'o2' }  // parent is c2 (x=100)
    ];

    const positions = calculateLayout(nodes, edges, { xSpacing: 200, ySpacing: 150 });

    // Level 1 sorted and spaced out centered around 0
    // For 2 nodes: idxs: 0, 1. (lvl1Count-1)/2 = 0.5.
    // o1 (targetX=-100): (0 - 0.5) * 200 = -100
    // o2 (targetX=100): (1 - 0.5) * 200 = 100
    expect(positions['o1'].x).toBe(-100);
    expect(positions['o1'].y).toBe(150);
    expect(positions['o2'].x).toBe(100);
    expect(positions['o2'].y).toBe(150);
  });

  it('aligns Level 2 nodes directly under Level 1 parents using barycenter', () => {
    const nodes = [
      { id: 'c1', label: 'C1', type: 'clauses' }, // x=-100
      { id: 'c2', label: 'C2', type: 'clauses' }, // x=100
      { id: 'o1', label: 'O1', type: 'obligations' }, // targetX=-100 -> placed at x=-100
      { id: 'o2', label: 'O2', type: 'obligations' }, // targetX=100 -> placed at x=100
      { id: 'd1', label: 'D1', type: 'dates' },
      { id: 'd2', label: 'D2', type: 'dates' }
    ];
    const edges = [
      { source: 'c1', target: 'o1' },
      { source: 'c2', target: 'o2' },
      { source: 'o1', target: 'd1' }, // parent is o1 (x=-100)
      { source: 'o2', target: 'd2' }  // parent is o2 (x=100)
    ];

    const positions = calculateLayout(nodes, edges, { xSpacing: 200, ySpacing: 150 });

    // Level 2 sorted and spaced out
    // d1: (0 - 0.5) * 200 = -100
    // d2: (1 - 0.5) * 200 = 100
    expect(positions['d1'].x).toBe(-100);
    expect(positions['d1'].y).toBe(300);
    expect(positions['d2'].x).toBe(100);
    expect(positions['d2'].y).toBe(300);
  });

  it('handles disconnected nodes safely without crashing', () => {
    const nodes = [
      { id: 'c1', label: 'C1', type: 'clauses' },
      { id: 'o1', label: 'O1', type: 'obligations' },
      { id: 'd1', label: 'D1', type: 'dates' }
    ];
    const edges = []; // no edges

    const positions = calculateLayout(nodes, edges);

    expect(positions['c1']).toBeDefined();
    expect(positions['o1']).toBeDefined();
    expect(positions['d1']).toBeDefined();
  });
});
