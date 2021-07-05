/**
  * This file was automatically generated.
  * DO NOT MODIFY IT BY HAND.
  * Instead, modify the hintr JSON schema files
  * and run ./generate-types.sh to regenerate this file.
*/
export interface AdrMetadataResponse {
  type: "spectrum" | "coarse_output" | "summary";
  description: string | null;
}
export interface AncDataRow {
  area_id: string;
  age_group: string;
  year: number;
  anc_clients: number;
  anc_hiv_status?: number;
  anc_known_pos: number;
  anc_already_art: number;
  anc_tested: number;
  anc_tested_pos: number;
  anc_prevalence: number;
  anc_art_coverage: number;
  [k: string]: any;
}
export interface AncFilters {
  year: {
    label: string;
    id: string;
  }[];
  indicators: {
    label: string;
    id: string;
  }[];
}
export type AncResponseData = {
  area_id: string;
  age_group: string;
  year: number;
  anc_clients: number;
  anc_hiv_status?: number;
  anc_known_pos: number;
  anc_already_art: number;
  anc_tested: number;
  anc_tested_pos: number;
  anc_prevalence: number;
  anc_art_coverage: number;
  [k: string]: any;
}[];
export interface BarchartDefaults {
  indicator_id: string;
  x_axis_id: string;
  disaggregate_by_id: string;
  selected_filter_options: {
    [k: string]: any;
  };
}
export interface BarchartIndicator {
  indicator: string;
  value_column: string;
  indicator_column: string;
  indicator_value: string;
  indicator_sort_order?: number;
  name: string;
  error_low_column: string;
  error_high_column: string;
  scale: number;
  accuracy: number | null;
  format: string;
}
export interface BarchartMetadata {
  indicators: {
    indicator: string;
    value_column: string;
    indicator_column: string;
    indicator_value: string;
    indicator_sort_order?: number;
    name: string;
    error_low_column: string;
    error_high_column: string;
    scale: number;
    accuracy: number | null;
    format: string;
  }[];
  filters: {
    id: string;
    column_id: string;
    label: string;
    options: {
      label: string;
      id: string;
    }[];
    use_shape_regions?: boolean | null;
  }[];
  defaults?: {
    indicator_id: string;
    x_axis_id: string;
    disaggregate_by_id: string;
    selected_filter_options: {
      [k: string]: any;
    };
  };
}
export type CalibratePlotData = {
  data_type: "spectrum" | "calibrated" | "unadjusted";
  spectrum_region_code: string;
  spectrum_region_name: string;
  sex: string;
  age_group: string;
  calendar_quarter: string;
  indicator: string;
  mean: number | null;
  lower: number | null;
  upper: number | null;
  [k: string]: any;
}[];
export interface CalibratePlotResponse {
  data: {
    data_type: "spectrum" | "calibrated" | "unadjusted";
    spectrum_region_code: string;
    spectrum_region_name: string;
    sex: string;
    age_group: string;
    calendar_quarter: string;
    indicator: string;
    mean: number | null;
    lower: number | null;
    upper: number | null;
    [k: string]: any;
  }[];
  plottingMetadata: {
    barchart: {
      indicators: {
        indicator: string;
        value_column: string;
        indicator_column: string;
        indicator_value: string;
        indicator_sort_order?: number;
        name: string;
        error_low_column: string;
        error_high_column: string;
        scale: number;
        accuracy: number | null;
        format: string;
      }[];
      filters: {
        id: string;
        column_id: string;
        label: string;
        options: {
          label: string;
          id: string;
        }[];
        use_shape_regions?: boolean | null;
      }[];
      defaults?: {
        indicator_id: string;
        x_axis_id: string;
        disaggregate_by_id: string;
        selected_filter_options: {
          [k: string]: any;
        };
      };
    };
  };
}
export interface CalibratePlotRow {
  data_type: "spectrum" | "calibrated" | "unadjusted";
  spectrum_region_code: string;
  spectrum_region_name: string;
  sex: string;
  age_group: string;
  calendar_quarter: string;
  indicator: string;
  mean: number | null;
  lower: number | null;
  upper: number | null;
  [k: string]: any;
}
export interface CalibrateResultResponse {
  data: {
    area_id: string;
    sex: string;
    age_group: string;
    calendar_quarter: string;
    indicator: string;
    mode: number | null;
    mean: number | null;
    lower: number | null;
    upper: number | null;
    [k: string]: any;
  }[];
  plottingMetadata: {
    barchart: {
      indicators: {
        indicator: string;
        value_column: string;
        indicator_column: string;
        indicator_value: string;
        indicator_sort_order?: number;
        name: string;
        error_low_column: string;
        error_high_column: string;
        scale: number;
        accuracy: number | null;
        format: string;
      }[];
      filters: {
        id: string;
        column_id: string;
        label: string;
        options: {
          label: string;
          id: string;
        }[];
        use_shape_regions?: boolean | null;
      }[];
      defaults?: {
        indicator_id: string;
        x_axis_id: string;
        disaggregate_by_id: string;
        selected_filter_options: {
          [k: string]: any;
        };
      };
    };
    choropleth: {
      indicators: {
        indicator: string;
        value_column: string;
        error_low_column?: string;
        error_high_column?: string;
        indicator_column?: string;
        indicator_value?: string;
        indicator_sort_order?: number;
        name: string;
        min: number;
        max: number;
        colour: string;
        invert_scale: boolean;
        scale: number;
        accuracy: number | null;
        format: string;
      }[];
      filters: {
        id: string;
        column_id: string;
        label: string;
        options: {
          label: string;
          id: string;
        }[];
        use_shape_regions?: boolean | null;
      }[];
    };
  };
  [k: string]: any;
}
export interface CalibrateStatusResponse {
  id: string;
  done: boolean | null;
  status: string;
  success: boolean | null;
  queue: number;
  progress: (
    | {
        started: boolean;
        complete: boolean;
        value?: number;
        name: string;
        helpText?: string;
      }
    | string)[];
}
export interface CalibrateSubmitRequest {
  options: {
    [k: string]: any;
  };
  version: {
    hintr: string;
    naomi: string;
    rrq: string;
    [k: string]: any;
  };
}
export interface CalibrateSubmitResponse {
  id: string;
}
export interface ChoroplethIndicatorMetadata {
  indicator: string;
  value_column: string;
  error_low_column?: string;
  error_high_column?: string;
  indicator_column?: string;
  indicator_value?: string;
  indicator_sort_order?: number;
  name: string;
  min: number;
  max: number;
  colour: string;
  invert_scale: boolean;
  scale: number;
  accuracy: number | null;
  format: string;
}
export interface ChoroplethMetadata {
  indicators: {
    indicator: string;
    value_column: string;
    error_low_column?: string;
    error_high_column?: string;
    indicator_column?: string;
    indicator_value?: string;
    indicator_sort_order?: number;
    name: string;
    min: number;
    max: number;
    colour: string;
    invert_scale: boolean;
    scale: number;
    accuracy: number | null;
    format: string;
  }[];
  filters: {
    id: string;
    column_id: string;
    label: string;
    options: {
      label: string;
      id: string;
    }[];
    use_shape_regions?: boolean | null;
  }[];
}
export interface DownloadStatusResponse {
  id: string;
  done: boolean | null;
  status: string;
  success: boolean | null;
  queue: number;
  progress: (
    | {
        started: boolean;
        complete: boolean;
        value?: number;
        name: string;
        helpText?: string;
      }
    | string)[];
}
export interface DownloadSubmitResponse {
  id: string;
}
export interface Error {
  error: string;
  detail: string | null;
  key?: string;
  trace?: string[];
  [k: string]: any;
}
export type ErrorCode = string;
export type FileName = string;
export type FilePath = string | null;
export interface Filter {
  id: string;
  column_id: string;
  label: string;
  options: {
    label: string;
    id: string;
  }[];
  use_shape_regions?: boolean | null;
}
export interface FilterOption {
  label: string;
  id: string;
}
export interface HintrVersionResponse {
  [k: string]: string;
}
export interface HintrWorkerStatus {
  [k: string]: "BUSY" | "IDLE" | "PAUSED" | "EXITED" | "LOST";
}
export type InputType = "pjnz" | "shape" | "population" | "survey" | "programme" | "anc";
export interface LevelLabels {
  id: number;
  area_level_label: string;
  display: boolean;
}
export interface ModelCalibrateRequest {
  options: {
    [k: string]: any;
  };
  version: {
    hintr: string;
    naomi: string;
    rrq: string;
    [k: string]: any;
  };
}
export type ModelCancelResponse = null;
export interface ModelOptionsValidate {
  valid: true;
}
export interface ModelOptionsValidateRequest {
  data: {
    pjnz: {
      path: string | null;
      hash: string;
      filename: string;
      fromADR: boolean;
    };
    shape: {
      path: string | null;
      hash: string;
      filename: string;
      fromADR: boolean;
    };
    population: {
      path: string | null;
      hash: string;
      filename: string;
      fromADR: boolean;
    };
    survey: {
      path: string | null;
      hash: string;
      filename: string;
      fromADR: boolean;
    };
    programme?: {
      path: string | null;
      hash: string;
      filename: string;
      fromADR: boolean;
    };
    anc?: {
      path: string | null;
      hash: string;
      filename: string;
      fromADR: boolean;
    };
  };
  options: {
    [k: string]: any;
  };
}
export type ModelResultData = {
  area_id: string;
  sex: string;
  age_group: string;
  calendar_quarter: string;
  indicator: string;
  mode: number | null;
  mean: number | null;
  lower: number | null;
  upper: number | null;
  [k: string]: any;
}[];
export interface ModelResultResponse {
  id: string;
  complete: true;
  [k: string]: any;
}
export interface ModelResultRow {
  area_id: string;
  sex: string;
  age_group: string;
  calendar_quarter: string;
  indicator: string;
  mode: number | null;
  mean: number | null;
  lower: number | null;
  upper: number | null;
  [k: string]: any;
}
export interface ModelRunOptions {
  controlSections: ControlSection[];
}
export interface ControlSection {
  label: string;
  description?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  controlGroups: ControlGroup[];
}
export interface ControlGroup {
  label?: string;
  controls: (SelectControl | NumberControl)[];
}
export interface SelectControl {
  name: string;
  label?: string;
  type: "select" | "multiselect";
  required: boolean;
  value?: string;
  helpText?: string;
  options?: {
    id: string;
    label: string;
    children?: {
      [k: string]: any;
    }[];
  }[];
}
export interface NumberControl {
  name: string;
  label?: string;
  type: "number";
  required: boolean;
  value?: number;
  helpText?: string;
  min?: number;
  max?: number;
}
export interface ModelRunOptionsRequest {
  shape: {
    path: string | null;
    hash: string;
    filename: string;
    fromADR: boolean;
  };
  survey: {
    path: string | null;
    hash: string;
    filename: string;
    fromADR: boolean;
  };
  programme?: {
    path: string | null;
    hash: string;
    filename: string;
    fromADR: boolean;
  };
  anc?: {
    path: string | null;
    hash: string;
    filename: string;
    fromADR: boolean;
  };
}
export interface ModelStatusResponse {
  id: string;
  done: boolean | null;
  status: string;
  success: boolean | null;
  queue: number;
  progress: {
    started: boolean;
    complete: boolean;
    value?: number;
    name: string;
    helpText?: string;
  }[];
}
export interface ModelSubmitData {
  pjnz: {
    path: string | null;
    hash: string;
    filename: string;
    fromADR: boolean;
  };
  shape: {
    path: string | null;
    hash: string;
    filename: string;
    fromADR: boolean;
  };
  population: {
    path: string | null;
    hash: string;
    filename: string;
    fromADR: boolean;
  };
  survey: {
    path: string | null;
    hash: string;
    filename: string;
    fromADR: boolean;
  };
  programme?: {
    path: string | null;
    hash: string;
    filename: string;
    fromADR: boolean;
  };
  anc?: {
    path: string | null;
    hash: string;
    filename: string;
    fromADR: boolean;
  };
}
export interface ModelSubmitRequest {
  data: {
    pjnz: {
      path: string | null;
      hash: string;
      filename: string;
      fromADR: boolean;
    };
    shape: {
      path: string | null;
      hash: string;
      filename: string;
      fromADR: boolean;
    };
    population: {
      path: string | null;
      hash: string;
      filename: string;
      fromADR: boolean;
    };
    survey: {
      path: string | null;
      hash: string;
      filename: string;
      fromADR: boolean;
    };
    programme?: {
      path: string | null;
      hash: string;
      filename: string;
      fromADR: boolean;
    };
    anc?: {
      path: string | null;
      hash: string;
      filename: string;
      fromADR: boolean;
    };
  };
  options: {
    [k: string]: any;
  };
  version: {
    hintr: string;
    naomi: string;
    rrq: string;
    [k: string]: any;
  };
}
export interface ModelSubmitResponse {
  id: string;
}
export interface NestedFilterOption {
  label: string;
  id: string;
  children?: {
    [k: string]: any;
  }[];
}
export interface PjnzResponseData {
  country: string;
  iso3: string;
}
export type ChoroplethMetadata = {
  indicator: string;
  value_column: string;
  error_low_column?: string;
  error_high_column?: string;
  indicator_column?: string;
  indicator_value?: string;
  indicator_sort_order?: number;
  name: string;
  min: number;
  max: number;
  colour: string;
  invert_scale: boolean;
  scale: number;
  accuracy: number | null;
  format: string;
}[];

export interface PlottingMetadataResponse {
  survey: Metadata;
  anc: Metadata;
  programme: Metadata;
  output: Metadata;
}
export interface Metadata {
  choropleth?: {
    indicators?: ChoroplethMetadata;
    [k: string]: any;
  };
  [k: string]: any;
}
export type PopulationResponseData = null;
export interface ProgrammeDataRow {
  area_id: string;
  calendar_quarter: string;
  sex: string;
  age_group: string;
  art_current: number;
  [k: string]: any;
}
export interface ProgrammeFilters {
  age: {
    label: string;
    id: string;
  }[];
  calendar_quarter: {
    label: string;
    id: string;
  }[];
  indicators: {
    label: string;
    id: string;
  }[];
}
export type ProgrammeResponseData = {
  area_id: string;
  calendar_quarter: string;
  sex: string;
  age_group: string;
  art_current: number;
  [k: string]: any;
}[];
export interface ProgressPhase {
  started: boolean;
  complete: boolean;
  value?: number;
  name: string;
  helpText?: string;
}
export interface Response {
  status: "success" | "failure";
  data: {
    [k: string]: any;
  } | null;
  errors: {
    error: string;
    detail: string | null;
    key?: string;
    trace?: string[];
    [k: string]: any;
  }[];
  version?: {
    hintr: string;
    naomi: string;
    rrq: string;
    [k: string]: any;
  };
}
export interface SessionFile {
  path: string | null;
  hash: string;
  filename: string;
  fromADR: boolean;
}
/**
 * TODO: Validate against a URL e.g. https://geojson.org/schema/FeatureCollection.json
 */
export interface GeoJSONObject {
  type: "FeatureCollection";
  crs?: {
    [k: string]: any;
  };
  name?: string;
  features: {
    [k: string]: any;
  }[];
  [k: string]: any;
}
export interface SurveyDataRow {
  indicator: string;
  survey_id: string;
  survey_year?: number;
  area_id: string;
  sex: string;
  age_group: string;
  n_clusters: number;
  n_observations: number;
  n_eff_kish?: number;
  estimate: number;
  std_error: number;
  ci_lower: number | null;
  ci_upper: number | null;
  [k: string]: any;
}
export interface SurveyFilters {
  age: {
    label: string;
    id: string;
  }[];
  surveys: {
    label: string;
    id: string;
  }[];
  indicators: {
    label: string;
    id: string;
  }[];
}
export type SurveyResponseData = {
  indicator: string;
  survey_id: string;
  survey_year?: number;
  area_id: string;
  sex: string;
  age_group: string;
  n_clusters: number;
  n_observations: number;
  n_eff_kish?: number;
  estimate: number;
  std_error: number;
  ci_lower: number | null;
  ci_upper: number | null;
  [k: string]: any;
}[];
export type URI = string;
export interface ValidateBaselineRequest {
  pjnz: string | null;
  shape: string | null;
  population: string | null;
}
export interface ValidateBaselineResponse {
  consistent: boolean;
}
export interface ValidateInputRequest {
  type: "pjnz" | "shape" | "population" | "survey" | "programme" | "anc";
  file: {
    path: string | null;
    hash: string;
    filename: string;
    fromADR: boolean;
  };
}
export type ValidateInputResponse =
  | PjnzResponse
  | ShapeResponse
  | PopulationResponse
  | ProgrammeResponse
  | AncResponse
  | SurveyResponse;

export interface PjnzResponse {
  hash: string;
  filename: string;
  fromADR?: boolean;
  type: "pjnz";
  data: {
    country: string;
    iso3: string;
  };
  filters?: null;
}
export interface ShapeResponse {
  hash: string;
  filename: string;
  fromADR?: boolean;
  type: "shape";
  data: GeoJSONObject;
  filters: {
    level_labels?: {
      id: number;
      area_level_label: string;
      display: boolean;
    }[];
    regions?: {
      label: string;
      id: string;
      children?: {
        [k: string]: any;
      }[];
    };
    [k: string]: any;
  };
}
/**
 * TODO: Validate against a URL e.g. https://geojson.org/schema/FeatureCollection.json
 */
export interface GeoJSONObject {
  type: "FeatureCollection";
  crs?: {
    [k: string]: any;
  };
  name?: string;
  features: {
    [k: string]: any;
  }[];
  [k: string]: any;
}
export interface PopulationResponse {
  hash: string;
  filename: string;
  fromADR?: boolean;
  type: "population";
  data: null;
  filters?: null;
}
export interface ProgrammeResponse {
  hash: string;
  filename: string;
  fromADR?: boolean;
  type: "programme";
  data: {
    area_id: string;
    calendar_quarter: string;
    sex: string;
    age_group: string;
    art_current: number;
    [k: string]: any;
  }[];
  filters: {
    age: {
      label: string;
      id: string;
    }[];
    calendar_quarter: {
      label: string;
      id: string;
    }[];
    indicators: {
      label: string;
      id: string;
    }[];
  };
}
export interface AncResponse {
  hash: string;
  filename: string;
  fromADR?: boolean;
  type: "anc";
  data: {
    area_id: string;
    age_group: string;
    year: number;
    anc_clients: number;
    anc_hiv_status?: number;
    anc_known_pos: number;
    anc_already_art: number;
    anc_tested: number;
    anc_tested_pos: number;
    anc_prevalence: number;
    anc_art_coverage: number;
    [k: string]: any;
  }[];
  filters: {
    year: {
      label: string;
      id: string;
    }[];
    indicators: {
      label: string;
      id: string;
    }[];
  };
}
export interface SurveyResponse {
  hash: string;
  filename: string;
  fromADR?: boolean;
  type: "survey";
  data: {
    indicator: string;
    survey_id: string;
    survey_year?: number;
    area_id: string;
    sex: string;
    age_group: string;
    n_clusters: number;
    n_observations: number;
    n_eff_kish?: number;
    estimate: number;
    std_error: number;
    ci_lower: number | null;
    ci_upper: number | null;
    [k: string]: any;
  }[];
  filters: {
    age: {
      label: string;
      id: string;
    }[];
    surveys: {
      label: string;
      id: string;
    }[];
    indicators: {
      label: string;
      id: string;
    }[];
  };
}
export interface ValidateSurveyAndProgrammeRequest {
  type: "pjnz" | "shape" | "population" | "survey" | "programme" | "anc";
  file: {
    path: string | null;
    hash: string;
    filename: string;
    fromADR: boolean;
  };
  shape: string | null;
}
export interface VersionInfo {
  hintr: string;
  naomi: string;
  rrq: string;
  [k: string]: any;
}
