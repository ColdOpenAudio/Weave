export interface Naming {
  project_name: string;
  version: string;
  colorway?: string;
  pattern: string;
  index_pad?: number;
}

export interface Tile {
  tile_width?: number;
  tile_height?: number;
  repeat_x: 4;
  repeat_y?: number;
}

export interface GeneratorStub {
  type: string;
  enabled?: boolean;
}

export interface Generators {
  corduroy: GeneratorStub;
  weave: GeneratorStub;
  palette: GeneratorStub;
}

export interface Exports {
  preset: string;
  formats?: string[];
  include_metadata?: boolean;
  toggles?: { include_svg?: boolean; include_png?: boolean };
}

export interface Packaging {
  mode: string;
  bundle_name?: string;
}

export interface Constraints {
  min_feature_mm?: number;
  max_shapes_per_tile?: number;
}

export interface BaseConfig {
  spec_version: string;
  naming: Naming;
  tile: Tile;
  generators: Generators;
  exports: Exports;
  packaging: Packaging;
  constraints?: Constraints;
}

export default BaseConfig;
