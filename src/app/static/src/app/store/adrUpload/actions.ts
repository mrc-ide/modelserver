import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {api} from "../../apiService";
import qs from "qs";
import {ADRUploadState} from "./adrUpload";
import {ADRUploadMutation} from "./mutations";
import {constructUploadFile, constructUploadFileWithResourceName} from "../../utils";
import {Dict, UploadFile} from "../../types";
import {ADRMutation} from "../adr/mutations";
import {switches} from "../../featureSwitches";
import {ValidateInputResponse} from "../../generated";

export interface ADRUploadActions {
    getUploadFiles: (store: ActionContext<ADRUploadState, RootState>) => void;
    uploadFilesToADR: (store: ActionContext<ADRUploadState, RootState>, uploadFilesPayload: UploadFile[]) => void;
}

export const actions: ActionTree<ADRUploadState, RootState> & ADRUploadActions = {
    async getUploadFiles(context) {
        const {rootState, commit} = context;
        const selectedDataset = rootState.baseline.selectedDataset;
        const project = rootState.projects.currentProject;

        if (selectedDataset && project) {
            commit({type: ADRUploadMutation.SetADRUploadError, payload: null});
            await api(context)
                .withError(ADRUploadMutation.SetADRUploadError)
                .ignoreSuccess()
                .get(`/adr/datasets/${selectedDataset.id}`)
                .then((response) => {
                    if (response) {
                        const metadata = response.data;
                        const schemas = rootState.adr.schemas!;

                        const uploadFiles: Dict<UploadFile> =  {
                            outputZip: constructUploadFileWithResourceName(
                                metadata,
                                0,
                                schemas.outputZip,
                                `${project.name}_naomi_outputs.zip`,
                                "uploadFileOutputZip",
                                `${project.name} Naomi Outputs`),
                            outputSummary: constructUploadFileWithResourceName(
                                metadata,
                                1,
                                schemas.outputSummary,
                                `${project.name}_naomi_summary.html`,
                                "uploadFileOutputSummary",
                                `${project.name} Naomi Summary`)
                        };

                        if (switches.adrPushInputs) {
                            const addLocalInputFileToUploads = (
                                key: string,
                                schema: string,
                                response: ValidateInputResponse,
                                displayName: string) => {
                                if (!response.fromADR) {
                                    const uploadFile = constructUploadFile(
                                        metadata,
                                        Object.keys(uploadFiles).length,
                                        schema,
                                        response.filename,
                                        displayName
                                    );
                                    if (uploadFile) {
                                        uploadFiles[key] = uploadFile;
                                    }
                                }
                            };

                            const baseline = rootState.baseline;
                            addLocalInputFileToUploads("pjnz", schemas.pjnz, baseline.pjnz!, "PJNZ");
                            addLocalInputFileToUploads("shape", schemas.shape, baseline.shape!, "shape");
                            addLocalInputFileToUploads("population",  schemas.population, baseline.population!, "population");

                            const sap = rootState.surveyAndProgram;
                            addLocalInputFileToUploads("survey", schemas.survey, sap.survey!, "survey");
                            addLocalInputFileToUploads("programme", schemas.programme, sap.program!, "ART");
                            addLocalInputFileToUploads("anc", schemas.anc, sap.anc!, "ANC");
                        }

                        commit({type: ADRUploadMutation.SetUploadFiles, payload: uploadFiles});
                    }
                });
        }
    },

    async uploadFilesToADR(context, uploadFilesPayload) {
        const {rootState, commit, dispatch} = context;
        const selectedDatasetId = rootState.baseline.selectedDataset!.id;
        const modelCalibrateId = rootState.modelCalibrate.calibrateId;
        const uploadMetadata = rootState.metadata.adrUploadMetadata

        commit({type: ADRUploadMutation.ADRUploadStarted, payload: uploadFilesPayload.length});

        for (let i = 0; i < uploadFilesPayload.length; i++) {
            commit({type: ADRUploadMutation.ADRUploadProgress, payload: i + 1});
            const { resourceType, resourceFilename, resourceName, resourceId } = uploadFilesPayload[i];

            const requestParams: Dict<string> = {resourceFileName: resourceFilename, resourceName};
            if (resourceId) {
                requestParams["resourceId"] = resourceId
            }
            if (resourceType === rootState.adr.schemas?.outputSummary && uploadMetadata?.type === "summary") {
                requestParams["description"] = uploadMetadata?.description
                    ? uploadMetadata.description
                    : "Naomi summary report uploaded from Naomi web app"
            }
            if (resourceType === rootState.adr.schemas?.outputZip && uploadMetadata?.type === "spectrum") {
                requestParams["description"] = uploadMetadata?.description
                    ? uploadMetadata.description
                    : "Naomi output uploaded from Naomi web app"
            }

            let apiRequest = api<ADRUploadMutation, ADRUploadMutation>(context)
                .withError(ADRUploadMutation.SetADRUploadError);
            if (i === uploadFilesPayload.length - 1) {
                apiRequest = apiRequest.withSuccess(ADRUploadMutation.ADRUploadCompleted);
            } else {
                apiRequest = apiRequest.ignoreSuccess();
            }
            const response = await apiRequest.postAndReturn(`/adr/datasets/${selectedDatasetId}/resource/${resourceType}/${modelCalibrateId}`,
                qs.stringify(requestParams))
            if (!response) {
                break
            }
        }
        await dispatch("adr/getAndSetDatasets", selectedDatasetId, {root: true});
        await dispatch("getUploadFiles");
    }
};
