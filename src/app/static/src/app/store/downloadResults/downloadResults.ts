import {RootState} from "../../root";
import {DownloadStatusResponse} from "../../generated";
import {Module} from "vuex";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {DownloadResultsDependency} from "../../types";

export interface DownloadResultsState {
    spectrum: DownloadResultsDependency
    coarseOutput: DownloadResultsDependency
    summary: DownloadResultsDependency
}

const mockInitialDownloadResults = {
    downloadId: "",
    downloading: false,
    statusPollId: -1,
    status: {} as DownloadStatusResponse,
    complete: false,
    error: null
}

export enum DOWNLOAD_TYPE {
    SPECTRUM = "Spectrum",
    COARSE = "CoarseOutput",
    SUMMARY = "Summary"
}

export const initialDownloadResultsState = (): DownloadResultsState => {
    return {
        spectrum: mockInitialDownloadResults,
        coarseOutput: mockInitialDownloadResults,
        summary: mockInitialDownloadResults
    }
}

export const downloadResults: Module<DownloadResultsState, RootState> = {
    namespaced: true,
    state: {...initialDownloadResultsState()},
    mutations,
    actions
}