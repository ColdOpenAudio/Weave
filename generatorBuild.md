## Plan: Implement Generator and Composition System

Develop the deterministic fabric pattern generator with corduroy realism, weave overlays, seam handling, and SVG composition outputs, ensuring each major component is built incrementally with testable functionality for seed-driven reproducibility and visual correctness. Structure for easy future edits: modular code, clear interfaces, comprehensive testing, and organized branching. Design for extensibility to add advanced randomization methods like wave function collapse.

### Steps
1. Implement core tile engine:  
   1.1 Define rib profile functions (shadow, mid, highlight) with configurable widths and colors.  
   1.2 Implement single-wale rib field generation using seed for positioning.  
   1.3 Add nap micro-streak layer with subtle variations and controlled density.  
   1.4 Implement drift bands for macro tonal variation across the tile.  
   1.5 Integrate all layers into a composite tile SVG; test element counts, color gradients, and seed reproducibility.

2. Implement weave overlay system:  
   2.1 Define event types (weft pops, stitch interrupts, basket patches) with SVG path templates.  
   2.2 Implement fray/notch details with min-feature size enforcement.  
   2.3 Create seed-driven event placement algorithm (e.g., pseudo-random distribution).  
   2.4 Overlay events on tile base; test event density, placement determinism, and constraint violations.

3. Implement seam logic:  
   3.1 Implement X wrap duplication for events crossing tile right edge.  
   3.2 Add optional Y wrap mode toggle (default off for hoodie panels).  
   3.3 Handle seam continuity for wrapped elements; test with edge tiles and wrap toggles.

4. Implement composition outputs:  
   4.1 Emit master tile SVG with all layers and overlays.  
   4.2 Generate 4-wide composite SVG by repeating master tile without new randomness.  
   4.3 Create flattened SVG variant by expanding patterns and removing `<pattern>` elements.  
   4.4 Test output SVG validity, file sizes, and visual consistency across compositions.

### Further Considerations
1. Ensure all generators use seed for reproducibility; implement unit tests for seed-based output matching; add integration tests for full pipeline; design seed handling to support advanced randomization.
2. Enforce min-feature constraints and max shapes per tile; add guards and error handling for invalid generations; make constraints configurable and extensible.
3. Design modular functions with clear interfaces for easy integration and future features; use TypeScript types for config and output; create abstraction layers for generation algorithms (e.g., interface for placement methods).
4. Validate visual outputs manually or with snapshot testing; prioritize hoodie-panel preset for initial testing; document tuning parameters and algorithm options.
5. For branching: Create feature branches per major component (e.g., feature/core-tile-engine); commit frequently with clear messages; use PRs for reviews and merges; plan for algorithm-specific branches (e.g., feature/wfc-integration).
6. Organize code in src/ with subdirs (e.g., src/generators/, src/composition/); update types in src/types/; ensure build and tests pass before merges; include src/algorithms/ for pluggable methods like wave function collapse.