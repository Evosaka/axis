"use client";

import { useEffect, useRef } from "react";
import { DOMAIN_COLORS, MAGNITUDE_SIZE } from "@/lib/config";
import type { EnrichedGraph, EnrichedNode } from "@/lib/schema";

function toElements(graph: EnrichedGraph) {
  const ids = new Set(graph.nodes.map((n) => n.id));

  const edges = graph.edges
    .filter((e) => ids.has(e.source) && ids.has(e.target))
    .map((e, i) => ({
      data: { id: `e${i}`, source: e.source, target: e.target, weight: e.weight, raw: e },
    }));

  // drop orphan nodes — nodes with no edges that aren't the root
  const connected = new Set<string>([graph.root_id]);
  edges.forEach((e) => { connected.add(e.data.source); connected.add(e.data.target); });

  const nodes = graph.nodes
    .filter((n) => connected.has(n.id))
    .map((n) => ({
      data: {
        id: n.id,
        label: n.label,
        color: DOMAIN_COLORS[n.domain] || "#8d99ae",
        size: MAGNITUDE_SIZE[n.magnitude] || 40,
        isRoot: n.id === graph.root_id ? 1 : 0,
        raw: n,
      },
    }));

  return [...nodes, ...edges];
}

const STYLE: any = [
  {
    selector: "node",
    style: {
      "background-color": "data(color)",
      width: "data(size)",
      height: "data(size)",
      label: "data(label)",
      color: "#ede9e3",
      "font-size": 10,
      "font-family": "JetBrains Mono, monospace",
      "text-wrap": "wrap",
      "text-max-width": 100,
      "text-valign": "bottom",
      "text-margin-y": 7,
      "border-width": 2,
      "border-color": "#1e1e1e",
      "text-outline-width": 2,
      "text-outline-color": "#080808",
      "border-style": "solid",
    },
  },
  {
    selector: "node[isRoot = 1]",
    style: {
      "border-width": 3,
      "border-color": "#cc1111",
      "font-size": 12,
      "font-weight": "bold",
    },
  },
  {
    selector: "edge",
    style: {
      width: "mapData(weight, 0, 1, 1, 5)",
      "line-color": "#2a2a2a",
      "target-arrow-color": "#3a3a3a",
      "target-arrow-shape": "triangle",
      "curve-style": "bezier",
      opacity: 0.8,
    },
  },
  { selector: "node:selected", style: { "border-color": "#cc1111", "border-width": 4 } },
  { selector: ".faded", style: { opacity: 0.12 } },
  {
    selector: ".highlight",
    style: { opacity: 1, "line-color": "#cc1111", "target-arrow-color": "#cc1111" },
  },
];

export default function CausalGraph({
  graph,
  onSelect,
}: {
  graph: EnrichedGraph;
  onSelect: (node: EnrichedNode | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cy: any;
    let destroyed = false;

    (async () => {
      const cytoscape = (await import("cytoscape")).default;
      const dagre = (await import("cytoscape-dagre")).default;
      cytoscape.use(dagre);
      if (destroyed || !containerRef.current) return;

      cy = cytoscape({
        container: containerRef.current,
        elements: toElements(graph),
        style: STYLE,
        layout: {
          name: "dagre",
          rankDir: "TB",
          rankSep: 90,
          nodeSep: 60,
          edgeSep: 10,
          padding: 40,
          animate: true,
          animationDuration: 400,
          nodeDimensionsIncludeLabels: true,
          stop() {
            cy.fit(cy.elements(), 40);
            cy.zoom(cy.zoom() * 1.5);
            cy.center();
          },
        } as any,
        wheelSensitivity: 0.2,
      });

      cy.on("tap", "node", (evt: any) => {
        const node = evt.target;
        cy.elements().addClass("faded").removeClass("highlight");
        node.closedNeighborhood().removeClass("faded");
        node.outgoers("edge").addClass("highlight").removeClass("faded");
        node.incomers("edge").addClass("highlight").removeClass("faded");
        onSelect(node.data("raw"));
      });

      cy.on("tap", (evt: any) => {
        if (evt.target === cy) {
          cy.elements().removeClass("faded").removeClass("highlight");
          onSelect(null);
        }
      });
    })();

    return () => {
      destroyed = true;
      if (cy) cy.destroy();
    };
  }, [graph, onSelect]);

  return <div ref={containerRef} className="graph-canvas" />;
}
