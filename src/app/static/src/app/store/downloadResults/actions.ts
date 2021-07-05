import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {DownloadResultsState, DOWNLOAD_TYPE} from "./downloadResults";
import {api} from "../../apiService";
import {DownloadResultsMutation} from "./mutations";
import {ModelStatusResponse} from "../../generated";

export interface DownloadResultsActions {
    downloadSummary: (store : ActionContext<DownloadResultsState, RootState>, isAdrUpload: boolean) => void
    downloadSpectrum: (store : ActionContext<DownloadResultsState, RootState>, isAdrUpload: boolean) => void
    downloadCoarseOutput: (store : ActionContext<DownloadResultsState, RootState>, isAdrUpload: boolean) => void
    poll: (store: ActionContext<DownloadResultsState, RootState>, downloadType: {type: string, adr: {upload: boolean}}) => void
}

export const actions: ActionTree<DownloadResultsState, RootState> & DownloadResultsActions = {

    async downloadCoarseOutput(context, isAdrUpload) {
        const {dispatch, rootState} = context
        const calibrateId = rootState.modelCalibrate.calibrateId

        const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
            .withSuccess(DownloadResultsMutation.CoarseOutputDownloadStarted)
            .withError(DownloadResultsMutation.CoarseOutputError)
            .get(`download/submit/coarse-output/${calibrateId}`)

        if (response) {
            await dispatch("poll", {type: DOWNLOAD_TYPE.COARSE, adr: {upload: isAdrUpload}})
        }
    },

    async downloadSummary(context, isAdrUpload) {
        const {dispatch, rootState} = context
        const calibrateId = rootState.modelCalibrate.calibrateId

        const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
            .withSuccess(DownloadResultsMutation.SummaryDownloadStarted)
            .withError(DownloadResultsMutation.SummaryError)
            .get(`download/submit/summary/${calibrateId}`)

        if (response) {
            await dispatch("poll", {type: DOWNLOAD_TYPE.SUMMARY, adr: {upload: isAdrUpload}})
        }
    },

    async downloadSpectrum(context, isAdrUpload) {
        const {dispatch, rootState} = context
        const calibrateId = rootState.modelCalibrate.calibrateId

        const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
            .withSuccess(DownloadResultsMutation.SpectrumDownloadStarted)
            .withError(DownloadResultsMutation.SpectrumError)
            .get(`download/submit/spectrum/${calibrateId}`)

        if (response) {
            await dispatch("poll", {type: DOWNLOAD_TYPE.SPECTRUM, adr: {upload: isAdrUpload}})
        }
    },

    async poll(context, download) {
        const {commit} = context;
        const id = setInterval(() => {
            download.type === DOWNLOAD_TYPE.SPECTRUM ? getSpectrumDownloadStatus(context, download.adr)
                : download.type === DOWNLOAD_TYPE.COARSE ? getCoarseOutputDownloadStatus(context, download.adr)
                : getSummaryDownloadStatus(context, download.adr)
        }, 2000);

        commit({type: "PollingStatusStarted", payload: {pollId: id, downloadType: download.type}});
    },
};

export const getSummaryDownloadStatus = async function (context: ActionContext<DownloadResultsState, RootState>, adr: {upload: boolean}) {
    const {commit, state, dispatch} = context;
    const downloadId = state.summary.downloadId;
    return api<DownloadResultsMutation, DownloadResultsMutation>(context)
        .withSuccess(DownloadResultsMutation.SummaryDownloadStatusUpdated)
        .withError(DownloadResultsMutation.SummaryError)
        .get<ModelStatusResponse>(`download/status/${downloadId}`)
        .then(() => {
            if (state.summary.status && state.summary.status.done) {
                if (adr.upload) {
                    dispatch("metadata/getAdrUploadMetadata", downloadId, {root: true})
                } else {
                    window.location.href = `/download/result/${downloadId}`
                    dispatch("metadata/getAdrUploadMetadata", downloadId, {root: true})
                }

                commit({type: DownloadResultsMutation.SummaryDownloadComplete, payload: true})
            }
        });
};

export const getSpectrumDownloadStatus = async function (context: ActionContext<DownloadResultsState, RootState>, adr: {upload: boolean}) {
    const {commit, state, dispatch} = context;
    const downloadId = state.spectrum.downloadId;
    return api<DownloadResultsMutation, DownloadResultsMutation>(context)
        .withSuccess(DownloadResultsMutation.SpectrumDownloadStatusUpdated)
        .withError(DownloadResultsMutation.SpectrumError)
        .get<ModelStatusResponse>(`download/status/${downloadId}`)
        .then(() => {
            if (state.spectrum.status && state.spectrum.status.done) {
                if (adr.upload) {
                    dispatch("metadata/getAdrUploadMetadata", downloadId, {root: true})
                } else {
                    window.location.href = `/download/result/${downloadId}`
                    dispatch("metadata/getAdrUploadMetadata", downloadId, {root: true})
                }

                commit({type: DownloadResultsMutation.SpectrumDownloadComplete, payload: true})
            }
        });
};

export const getCoarseOutputDownloadStatus = async function (context: ActionContext<DownloadResultsState, RootState>, adr: {upload: boolean}) {
    const {commit, state, dispatch} = context;
    const downloadId = state.coarseOutput.downloadId;
    return api<DownloadResultsMutation, DownloadResultsMutation>(context)
        .withSuccess(DownloadResultsMutation.CoarseOutputDownloadStatusUpdated)
        .withError(DownloadResultsMutation.CoarseOutputError)
        .get<ModelStatusResponse>(`download/status/${downloadId}`)
        .then(() => {
            if (state.coarseOutput.status && state.coarseOutput.status.done) {
                if (adr.upload) {
                    dispatch("metadata/getAdrUploadMetadata", downloadId, {root: true})
                } else {
                    window.location.href = `/download/result/${downloadId}`
                    dispatch("metadata/getAdrUploadMetadata", downloadId, {root: true})
                }

                commit({type: DownloadResultsMutation.CoarseOutputDownloadComplete, payload: true})
            }
        });
};