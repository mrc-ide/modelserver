import {MutationTree} from "vuex";
import {DownloadResultsState, DOWNLOAD_TYPE} from "./downloadResults";
import {PayloadWithType, PoolingStarted} from "../../types";
import {DownloadStatusResponse, DownloadSubmitResponse, Error} from "../../generated";

export enum DownloadResultsMutation {
    SummaryDownloadStarted = "SummaryDownloadStarted",
    SpectrumDownloadStarted = "SpectrumDownloadStarted",
    CoarseOutputDownloadStarted = "CoarseOutputDownloadStarted",
    PollingStatusStarted = "PollingStatusStarted",
    SummaryDownloadStatusUpdated = "SummaryDownloadStatusUpdated",
    SpectrumDownloadStatusUpdated = "SpectrumDownloadStatusUpdated",
    CoarseOutputDownloadStatusUpdated = "CoarseOutputDownloadStatusUpdated",
    SummaryError = "SummaryError",
    SpectrumError = "SpectrumError",
    CoarseOutputError = "CoarseOutputError",
    CoarseOutputDownloadComplete = "CoarseOutputDownloadComplete",
    SummaryDownloadComplete = "SummaryDownloadComplete",
    SpectrumDownloadComplete = "SpectrumDownloadComplete"
}

export const mutations: MutationTree<DownloadResultsState> = {
    [DownloadResultsMutation.SummaryDownloadStarted](state: DownloadResultsState, action: PayloadWithType<DownloadSubmitResponse>) {
        const downloadId = action.payload.id
        state.summary = {...state.summary, downloadId, downloading: true, complete: false, error: null}
    },

    [DownloadResultsMutation.SpectrumDownloadStarted](state: DownloadResultsState, action: PayloadWithType<DownloadSubmitResponse>) {
        const downloadId = action.payload.id
        state.spectrum = {...state.spectrum, downloadId, downloading: true, complete: false, error: null}
    },

    [DownloadResultsMutation.CoarseOutputDownloadStarted](state: DownloadResultsState, action: PayloadWithType<DownloadSubmitResponse>) {
        const downloadId = action.payload.id
        state.coarseOutput = {...state.coarseOutput, downloadId, downloading: true, complete: false, error: null}
    },

    [DownloadResultsMutation.CoarseOutputError](state: DownloadResultsState, action: PayloadWithType<Error>) {
        state.coarseOutput.error = action.payload
        state.coarseOutput.downloading = false

        if (state.coarseOutput.statusPollId > -1) {
            stopPollingCoarse(state);
        }
    },

    [DownloadResultsMutation.SpectrumError](state: DownloadResultsState, action: PayloadWithType<Error>) {
        state.spectrum.error = action.payload
        state.spectrum.downloading = false

        if (state.spectrum.statusPollId > -1) {
            stopPollingSpectrum(state);
        }
    },

    [DownloadResultsMutation.SummaryError](state: DownloadResultsState, action: PayloadWithType<Error>) {
        state.summary.error = action.payload
        state.summary.downloading = false

        if (state.summary.statusPollId > -1) {
            stopPollingSummary(state);
        }
    },

    [DownloadResultsMutation.CoarseOutputDownloadStatusUpdated](state: DownloadResultsState, action: PayloadWithType<DownloadStatusResponse>) {
        if (action.payload.done) {
            stopPollingCoarse(state)
        }
        state.coarseOutput.status = action.payload;
        state.coarseOutput.error = null;
    },

    [DownloadResultsMutation.SummaryDownloadStatusUpdated](state: DownloadResultsState, action: PayloadWithType<DownloadStatusResponse>) {
        if (action.payload.done) {
            stopPollingSummary(state)
        }
        state.summary.status = action.payload;
        state.summary.error = null;
    },

    [DownloadResultsMutation.SpectrumDownloadStatusUpdated](state: DownloadResultsState, action: PayloadWithType<DownloadStatusResponse>) {
        if (action.payload.done) {
            stopPollingSpectrum(state)
        }
        state.spectrum.status = action.payload;
        state.spectrum.error = null;
    },

    [DownloadResultsMutation.CoarseOutputDownloadComplete](state: DownloadResultsState, action: PayloadWithType<boolean>) {
        state.coarseOutput.complete = action.payload;
        state.coarseOutput.downloading = false;
    },

    [DownloadResultsMutation.SummaryDownloadComplete](state: DownloadResultsState, action: PayloadWithType<boolean>) {
        state.summary.complete = action.payload;
        state.summary.downloading = false;
    },

    [DownloadResultsMutation.SpectrumDownloadComplete](state: DownloadResultsState, action: PayloadWithType<boolean>) {
        state.spectrum.complete = action.payload;
        state.spectrum.downloading = false;
    },
    [DownloadResultsMutation.PollingStatusStarted](state: DownloadResultsState, action: PayloadWithType<PoolingStarted>) {
        switch (action.payload.downloadType) {
            case DOWNLOAD_TYPE.SPECTRUM: {
                state.spectrum.statusPollId = action.payload.pollId
                break;
            }
            case DOWNLOAD_TYPE.COARSE: {
                state.coarseOutput.statusPollId = action.payload.pollId
                break;
            }
            case DOWNLOAD_TYPE.SUMMARY: {
                state.summary.statusPollId = action.payload.pollId
                break
            }
        }
    },
};

const stopPollingSpectrum = (state: DownloadResultsState) => {
    clearInterval(state.spectrum.statusPollId);
    state.spectrum.statusPollId = -1;
};

const stopPollingCoarse = (state: DownloadResultsState) => {
    clearInterval(state.coarseOutput.statusPollId);
    state.coarseOutput.statusPollId = -1;
};

const stopPollingSummary = (state: DownloadResultsState) => {
    clearInterval(state.summary.statusPollId);
    state.summary.statusPollId = -1;
};