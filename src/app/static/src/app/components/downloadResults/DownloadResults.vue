<template>
    <div class="container">
        <div class="row">
            <div class="col-sm">
                <div id="spectrum-download">
                <h4 v-translate="'exportOutputs'"></h4>
                <span class="btn btn-red btn-lg my-3"
                      @click="downloadSpectrum">
                    <span v-translate="'export'"></span>
                    <download-icon size="20" class="icon ml-2" style="margin-top: -4px;"></download-icon>
                </span>
                    <download-progress id="spectrum-progress"
                                       :complete="spectrum.complete"
                                       :downloading="spectrum.downloading">
                    </download-progress>
                    <error-alert id="spectrum-error" v-if="spectrum.error" :error="spectrum.error"></error-alert>
                </div>
                <div id="coarse-output-download">
                <h4 class="mt-4" v-translate="'downloadCoarseOutput'"></h4>
                <span class="btn btn-red btn-lg my-3" @click="downloadCoarseOutput">
                    <span v-translate="'download'"></span>
                    <download-icon size="20" class="icon ml-2" style="margin-top: -4px;"></download-icon>
                </span>
                    <download-progress id="coarse-output-progress"
                                       :complete="coarseOutput.complete"
                                       :downloading="coarseOutput.downloading">
                    </download-progress>
                    <error-alert id="coarse-output-error" v-if="coarseOutput.error" :error="coarseOutput.error"></error-alert>
                </div>
                <div id="summary-download">
                <h4 class="mt-4" v-translate="'downloadSummaryReport'"></h4>
                <span class="btn btn-red btn-lg my-3" @click="downloadSummary">
                    <span v-translate="'download'"></span>
                    <download-icon size="20" class="icon ml-2" style="margin-top: -4px;"></download-icon>
                </span>
                    <download-progress id="summary-progress"
                                       :complete="summary.complete"
                                       :downloading="summary.downloading">
                    </download-progress>
                    <error-alert id="summary-error" v-if="summary.error" :error="summary.error"></error-alert>
                </div>
            </div>
            <div id="upload" v-if="hasUploadPermission" class="col-sm">
                <h4 v-translate="'uploadFileToAdr'"></h4>
                <button @click.prevent="handleUploadModal" 
                        class="btn btn-lg my-3" 
                        :class="uploading ? 'btn-secondary' : 'btn-red'"
                        href="#" 
                        :disabled="uploading">
                    <span v-translate="'upload'"></span>
                    <upload-icon size="20" class="icon ml-2" style="margin-top: -4px;"></upload-icon>
                </button>
                <div id="uploading" v-if="uploading" class="d-flex align-items-end">
                    <loading-spinner size="xs"></loading-spinner>
                    <div class="d-flex align-items-center height-40 ml-2'">
                        <span>{{ uploadingStatus }}</span>
                    </div>
                </div>
                <div id="uploadComplete" v-if="uploadComplete" class="d-flex align-items-end">
                    <div class="d-flex align-items-center height-40 mr-1">
                        <span class="font-weight-bold" v-translate="'uploadComplete'"></span>
                    </div>
                    <div class="d-flex align-items-center height-40">
                        <tick color="#e31837" v-if="uploadComplete" width="20px"></tick>
                    </div>
                </div>
                <error-alert v-if="uploadError" :error="uploadError"></error-alert>
            </div>
        </div>
        <upload-modal id="upload-modal" :open="uploadModalOpen" @close="uploadModalOpen = false"></upload-modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActionByName, mapStateProp, mapStateProps} from "../../utils";
    import {DownloadIcon, UploadIcon} from "vue-feather-icons";
    import UploadModal from "./UploadModal.vue";
    import {ADRState} from "../../store/adr/adr";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import Tick from "../Tick.vue";
    import {Language} from "../../store/translations/locales";
    import {RootState} from "../../root";
    import ErrorAlert from "../ErrorAlert.vue";
    import i18next from "i18next";
    import {ADRUploadState} from "../../store/adrUpload/adrUpload";
    import {DownloadResultsState} from "../../store/downloadResults/downloadResults";
    import {DownloadResultsDependency} from "../../types";
    import DownloadProgress from "./DownloadProgress.vue";

    interface Computed {
        uploadingStatus: string,
        currentLanguage: Language,
        currentFileUploading: number | null,
        totalFilesUploading: number | null,
        uploading: boolean,
        uploadComplete: boolean,
        uploadError: null | UploadError,
        hasUploadPermission: boolean,
        downloadingSpectrum: boolean,
        spectrum: Partial<DownloadResultsDependency>,
        coarseOutput: Partial<DownloadResultsDependency>,
        summary: Partial<DownloadResultsDependency>
    }

    interface UploadError {
        detail: string,
        error: string
    }

    interface Methods {
        handleUploadModal: () => void
        getUserCanUpload: () => void
        getUploadFiles: () => void
        downloadCoarseOutput: () => void
        downloadSpectrum: () => void
        downloadSummary: () => void
        getSummaryDownload: () => void
        getSpectrumDownload: () => void
        getCoarseOutputDownload: () => void
    }

    interface Data {
        uploadModalOpen: boolean
    }

    export default Vue.extend<Data, Methods, Computed>({
        name: "downloadResults",
        data() {
            return {
                uploadModalOpen: false
            }
        },
        computed: {
            ...mapStateProps<DownloadResultsState, keyof Computed>("downloadResults", {
                spectrum: state => ({
                    downloading: state.spectrum.downloading,
                    complete: state.spectrum.complete,
                    error: state.spectrum.error
                }),
                summary: state => ({
                    downloading: state.summary.downloading,
                    complete: state.summary.complete,
                    error: state.summary.error
                }),
                coarseOutput: state => ({
                    downloading: state.coarseOutput.downloading,
                    complete: state.coarseOutput.complete,
                    error: state.coarseOutput.error
                })
            }),
            ...mapStateProps<ADRUploadState, keyof Computed>("adrUpload", {
                currentFileUploading: state => state.currentFileUploading,
                totalFilesUploading: state => state.totalFilesUploading,
                uploading: state => state.uploading,
                uploadComplete: state => state.uploadComplete,
                uploadError: state => state.uploadError
            }),
            hasUploadPermission: mapStateProp<ADRState, boolean>("adr",
                (state: ADRState) => state.userCanUpload
            ),
            uploadingStatus: function () {
                return i18next.t("uploadingStatus", {
                    fileNumber: this.currentFileUploading,
                    totalFiles: this.totalFilesUploading,
                    lng: this.currentLanguage,
                });
            },
            currentLanguage: mapStateProp<RootState, Language>(
                null,
                (state: RootState) => state.language
            )
        },
        methods: {
            handleUploadModal() {
                this.uploadModalOpen = true
            },
            downloadSpectrum() {
                if (!this.spectrum.downloading) {
                    this.getSpectrumDownload()
                }
            },
            downloadSummary() {
                if (!this.summary.downloading) {
                    this.getSummaryDownload()
                }
            },
            downloadCoarseOutput() {
                if (!this.coarseOutput.downloading) {
                    this.getCoarseOutputDownload()
                }
            },
            getUserCanUpload: mapActionByName("adr", "getUserCanUpload"),
            getUploadFiles: mapActionByName("adrUpload", "getUploadFiles"),
            getSpectrumDownload: mapActionByName("downloadResults", "downloadSpectrum"),
            getSummaryDownload: mapActionByName("downloadResults", "downloadSummary"),
            getCoarseOutputDownload: mapActionByName("downloadResults", "downloadCoarseOutput")
        },
        mounted() {
            this.getUserCanUpload();
            this.getUploadFiles()
        },
        components: {
            DownloadIcon,
            UploadIcon,
            LoadingSpinner,
            Tick,
            ErrorAlert,
            UploadModal,
            DownloadProgress
        }
    });
</script>
