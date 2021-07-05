import {MutationTree} from 'vuex';
import {MetadataState} from "./metadata";
import {PlottingMetadataResponse, Error, AdrMetadataResponse} from "../../generated";
import {PayloadWithType} from "../../types";

export enum MetadataMutations {
    PlottingMetadataFetched= "PlottingMetadataFetched",
    PlottingMetadataError = "PlottingMetadataError",
    AdrUploadMetadataFetched = "UploadMetadataFetched",
    AdrUploadMetadataError = "UploadMetadataError"
}

export const mutations: MutationTree<MetadataState> = {

    [MetadataMutations.PlottingMetadataError](state: MetadataState, action: PayloadWithType<Error>) {
        state.plottingMetadataError = action.payload;
    },

    [MetadataMutations.PlottingMetadataFetched](state: MetadataState, action: PayloadWithType<PlottingMetadataResponse>) {
        state.plottingMetadata = action.payload;
        state.plottingMetadataError = null;
    },

    [MetadataMutations.AdrUploadMetadataError](state: MetadataState, action: PayloadWithType<Error>) {
        state.adrUploadMetadataError = action.payload;
    },

    [MetadataMutations.AdrUploadMetadataFetched](state: MetadataState, action: PayloadWithType<AdrMetadataResponse>) {
        state.adrUploadMetadata = action.payload;
        state.adrUploadMetadataError = null;
    }
};
