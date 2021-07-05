import {ActionContext, ActionTree} from 'vuex';
import {RootState} from "../../root";
import {api} from "../../apiService";
import {MetadataState} from "./metadata";
import {MetadataMutations} from "./mutations";

export interface MetadataActions {
    getPlottingMetadata: (store: ActionContext<MetadataState, RootState>, country: string) => void
    getAdrUploadMetadata: (store: ActionContext<MetadataState, RootState>, downloadId: string) => void
}

export const actions: ActionTree<MetadataState, RootState> & MetadataActions = {

    async getPlottingMetadata(context, iso3) {
        await api<MetadataMutations, MetadataMutations>(context)
            .withSuccess(MetadataMutations.PlottingMetadataFetched)
            .withError(MetadataMutations.PlottingMetadataError)
            .get(`/meta/plotting/${iso3}`);
    },

    async getAdrUploadMetadata(context, downloadId) {
        await api<MetadataMutations, MetadataMutations>(context)
            .withSuccess(MetadataMutations.AdrUploadMetadataFetched)
            .withError(MetadataMutations.AdrUploadMetadataError)
            .get(`/meta/adr/${downloadId}`)
    }
};
