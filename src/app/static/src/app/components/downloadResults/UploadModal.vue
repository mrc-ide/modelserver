<template>
    <div id="dialog">
        <modal :open="open">
            <h4 v-translate="'uploadFileToAdr'"></h4>
            <div class="container">
                <div id="dataset-id" class="mt-4">
                    <span v-translate="'uploadFileDataset'"></span>
                    <span>{{ dataset }}</span></div>
                <div id="instructions" class="mt-3" v-translate="'uploadFileInstruction'"></div>
                <div v-for="(uploadFileSection, sectionIndex) in uploadFileSections" :key="sectionIndex">
                    <h5 v-if="Object.keys(uploadFileSections[1]).length > 0"
                        v-translate="sectionIndex === 0 ? 'outputFiles' : 'inputFiles'"
                        class="mt-3"></h5>
                    <div id="output-file-id" class="mt-3" v-for="(uploadFile, key, index) in uploadFileSection" :key="uploadFile.index">
                        <div class="mt-3 form-check">
                            <input class="form-check-input"
                                   type="checkbox"
                                   :value="key"
                                   v-model="uploadFilesToAdr"
                                   :id="`id-${sectionIndex}-${index}`">

                            <label class="form-check-label"
                                   :for="`id-${sectionIndex}-${index}`"
                                   v-translate="uploadFile.displayName"></label>
                            <small v-if="uploadFile.resourceId" class="text-danger row">
                            <span class="col-auto">
                            <span v-translate="'uploadFileOverwrite'"></span>{{ lastModified(uploadFile.lastModified) }}
                            </span>
                            </small>
                        </div>
                    </div>
                </div>
            </div>
            <template v-slot:footer>
                <button
                    type="button"
                    class="btn btn-red"
                    :disabled="uploadFilesToAdr.length < 1"
                    @click.prevent="confirmUpload"
                    v-translate="'ok'"></button>
                <button
                    type="button"
                    class="btn btn-white"
                    @click.prevent="handleCancel"
                    v-translate="'cancel'"></button>
            </template>
        </modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Modal from "../Modal.vue";
    import {
        Dict,
        DownloadResultsDependency,
        SelectedADRUploadFiles,
        UploadFile
    } from "../../types";
    import {BaselineState} from "../../store/baseline/baseline";
    import {formatDateTime, mapActionByName, mapStateProp, mapStateProps} from "../../utils";
    import {ADRUploadState} from "../../store/adrUpload/adrUpload";
    import {DownloadResultsState} from "../../store/downloadResults/downloadResults";
    import {adr, ADRState} from "../../store/adr/adr";
    import DownloadProgress from "./DownloadProgress.vue";

    interface Methods {
        uploadFilesToADRAction: (uploadFilesPayload: UploadFile[]) => void;
        confirmUpload: () => void;
        handleCancel: () => void
        lastModified: (date: string) => string | null
        setDefaultCheckedItems: () => void
        downloadSpectrum: (isAdrUpload: boolean) => void
        downloadSummary: (isAdrUpload: boolean) => void
        prepareFilesForUpload: (uploadFilesPayload: UploadFile[]) => boolean
        findSelectedUploadFiles: (uploadFilesPayload: UploadFile[]) => SelectedADRUploadFiles
        downloadIsReady: () => boolean
        getSummaryDownload: () => void
        getSpectrumDownload: () => void
        sendUploadFilesToADR: () => void
    }

    interface Computed {
        dataset: string
        uploadFiles: Dict<UploadFile>,
        uploadFileSections: Array<Dict<UploadFile>>,
        spectrum: Partial<DownloadResultsDependency>,
        summary: Partial<DownloadResultsDependency>,
        outputSummary: string,
        outputSpectrum: string
    }

    interface Data {
        uploadFilesToAdr: string[]
        uploadDescToAdr: string
        uploadFilesPayload: UploadFile[]
    }

    interface Props {
        open: boolean
    }

    const outputFileTypes = ["outputZip", "outputSummary"];

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "UploadModal",
        props: {
            open: {
                type: Boolean
            }
        },
        data(): Data {
            return {
                uploadFilesToAdr: [],
                uploadDescToAdr: "",
                uploadFilesPayload: []
            }
        },
        methods: {
            uploadFilesToADRAction: mapActionByName<UploadFile[]>(
                "adrUpload",
                "uploadFilesToADR"
            ),
            confirmUpload() {
                this.uploadFilesToAdr.forEach(value => this.uploadFilesPayload.push(this.uploadFiles[value]))
                const readyForUpload = this.prepareFilesForUpload(this.uploadFilesPayload)
                if (readyForUpload) {
                    this.sendUploadFilesToADR()
                }
            },
            sendUploadFilesToADR() {
                this.uploadFilesToADRAction(this.uploadFilesPayload);
                this.$emit("close")
            },
            prepareFilesForUpload() {
                const {summary, spectrum} = this.findSelectedUploadFiles(this.uploadFilesPayload)
                if (summary) {
                    this.getSummaryDownload()
                }
                if (spectrum) {
                    this.getSpectrumDownload()
                }

                return this.downloadIsReady()
            },
            findSelectedUploadFiles() {
                const summary = this.uploadFilesPayload.find(upload => upload.resourceType === this.outputSummary)
                const spectrum = this.uploadFilesPayload.find(upload => upload.resourceType === this.outputSpectrum)

                return {summary, spectrum}
            },
            downloadIsReady() {
                const {summary, spectrum} = this.findSelectedUploadFiles(this.uploadFilesPayload)
                if (summary && spectrum) {
                    return !!this.summary.complete && !!this.spectrum.complete
                } else {
                    if (summary && !spectrum) {
                        return !!this.summary.complete
                    } else {
                        return !!this.spectrum.complete
                    }
                }
            },
            getSummaryDownload() {
                if (!this.summary.downloading && !this.summary.complete) {
                    this.downloadSummary(true)
                }
            },
            getSpectrumDownload() {
                if (!this.spectrum.downloading && !this.spectrum.complete) {
                    this.downloadSpectrum(true)
                }
            },
            handleCancel() {
                this.$emit("close")
            },
            lastModified: function (date: string) {
                return formatDateTime(date)
            },
            setDefaultCheckedItems: function () {
                this.uploadFilesToAdr = outputFileTypes
                    .filter(key => this.uploadFiles.hasOwnProperty(key))
            },
            downloadSpectrum: mapActionByName("downloadResults", "downloadSpectrum"),
            downloadSummary: mapActionByName("downloadResults", "downloadSummary")
        },
        computed: {
            ...mapStateProps<DownloadResultsState, keyof Computed>("downloadResults", {
                spectrum: state => ({
                    downloading: state.spectrum.downloading,
                    complete: state.spectrum.complete,
                }),
                summary: state => ({
                    downloading: state.summary.downloading,
                    complete: state.summary.complete,
                })
            }),
            ...mapStateProps<ADRState, keyof Computed>("adr", {
                outputSpectrum: state => state.schemas?.outputZip,
                outputSummary: state => state.schemas?.outputSummary
            }),
            ...mapStateProps<BaselineState, keyof Computed>("baseline", {
                dataset: state => state.selectedDataset?.title
            }),
            uploadFiles: mapStateProp<ADRUploadState, Dict<UploadFile>>("adrUpload",
                (state) => state.uploadFiles!
            ),
            uploadFileSections() {
                if (this.uploadFiles) {
                    return Object.keys(this.uploadFiles).reduce((sections, key) => {
                        if (outputFileTypes.includes(key)) {
                            sections[0][key] = this.uploadFiles[key];
                        } else {
                            sections[1][key] = this.uploadFiles[key];
                        }
                        return sections;
                    }, [{} as any, {} as any]);
                } else {
                    return [];
                }
            }
        },
        components: {
            Modal,
            DownloadProgress
        },
        watch: {
            uploadFiles() {
                this.setDefaultCheckedItems()
            },
            summary() {
                if(this.downloadIsReady()) {
                    this.sendUploadFilesToADR()
                }
            },
            spectrum() {
                if(this.downloadIsReady()) {
                    this.sendUploadFilesToADR()
                }
            }
        }
    });
</script>

