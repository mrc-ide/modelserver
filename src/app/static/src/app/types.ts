import {Payload} from "vuex";
import {FilterOption, Error, DownloadStatusResponse, DownloadSubmitResponse} from "./generated";

export interface PayloadWithType<T> extends Payload {
    payload: T
}

export interface PartialFileUploadProps {
    valid: boolean,
    error: Error | null,
    existingFileName: string
}

export interface IndicatorValues {
    value: number,
    color: string,
    lower_value?: number
    upper_value?: number
}

export interface BubbleIndicatorValues extends IndicatorValues {
    radius: number;
    sizeValue: number;
    sizeLower?: number;
    sizeUpper?: number;
}

export interface LevelLabel {
    id: number;
    area_level_label: string;
    display: boolean;
}

export type Dict<V> = { [k: string]: V }

export type IndicatorValuesDict = Dict<IndicatorValues>;

export type BubbleIndicatorValuesDict = Dict<BubbleIndicatorValues>;

export interface LocalSessionFile {
    hash: string
    filename: string
}

export interface BarchartIndicator {
    indicator: string,
    value_column: string,
    indicator_column: string,
    indicator_value: string,
    name: string,
    error_low_column: string,
    error_high_column: string,
    format: string,
    scale: number,
    accuracy: number | null
}

export interface Filter {
    id: string,
    column_id: string,
    label: string,
    options: FilterOption[]
}

export interface DisplayFilter extends Filter {
    allowMultiple: boolean
}

export interface NumericRange {
    min: number,
    max: number
}

export interface Version {
    id: string,
    created: string,
    updated: string,
    versionNumber: number,
    note?: string
}

export interface Project {
    id: number,
    name: string,
    versions: Version[],
    sharedBy?: string,
    note?: string
}

export interface CurrentProject {
    project: Project | null,
    version: Version | null
}

export interface VersionDetails {
    files: any,
    state: string
}

export interface VersionIds {
    projectId: number,
    versionId: string
}

export interface DatasetResource {
    id: string,
    name: string,
    lastModified: string,
    metadataModified: string,
    url: string
    outOfDate: boolean
}

export interface DatasetResourceSet {
    pjnz: DatasetResource | null,
    pop: DatasetResource | null,
    program: DatasetResource | null,
    anc: DatasetResource | null,
    shape: DatasetResource | null,
    survey: DatasetResource | null
}

export interface Dataset {
    id: string
    title: string
    url: string,
    resources: DatasetResourceSet
    organization: Organization
}

export interface Organization {
    id: string
}

export interface ADRSchemas {
    baseUrl: string
    anc: string
    programme: string
    pjnz: string
    population: string
    shape: string
    survey: string
    outputZip: string
    outputSummary: string
}

export interface UploadFile {
    index: number,
    displayName: string,
    resourceType: string,
    resourceFilename: string,
    resourceName: string,
    resourceId: string | null,
    resourceUrl: string | null,
    lastModified: string | null
}

export interface DownloadResultsDependency {
    downloadId: string
    downloading: boolean
    statusPollId: number
    status: DownloadStatusResponse
    complete: boolean
    error: Error | null
}

export interface PoolingStarted {
    pollId: number,
    downloadType: string
}
export interface SelectedADRUploadFiles {
    summary: any,
    spectrum: any,
    coarseOutput?: any
}