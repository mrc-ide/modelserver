import {Mutation, MutationTree} from 'vuex';
import {ModelOptionsState} from "./modelOptions";
import {DynamicFormData, DynamicFormMeta} from "../../components/forms/types";
import {PayloadWithType} from "../../types";
import {updateForm} from "./utils";

type ModelOptionsMutation = Mutation<ModelOptionsState>

export interface ModelOptionsMutations {
    validate: ModelOptionsMutation,
    update: ModelOptionsMutation
    ModelOptionsFetched: ModelOptionsMutation
    FetchingModelOptions: ModelOptionsMutation
}

export const mutations: MutationTree<ModelOptionsState> & ModelOptionsMutations = {
    validate(state: ModelOptionsState, payload: DynamicFormData) {
        state.options = payload;
        // TODO validate from server
        state.valid = true;
    },

    update(state: ModelOptionsState, payload: DynamicFormMeta) {
        state.optionsFormMeta = payload;
    },

    FetchingModelOptions(state: ModelOptionsState) {
        state.fetching = true;
    },

    ModelOptionsFetched(state: ModelOptionsState, action: PayloadWithType<DynamicFormMeta>) {
        state.optionsFormMeta = {...updateForm(state.optionsFormMeta, action.payload)};
        state.fetching = false;
    }
};
