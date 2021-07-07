import {MutationTree} from 'vuex';
import {ModelOptionsState} from "./modelOptions";
import {DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {PayloadWithType} from "../../types";
import {updateForm} from "../../utils";
import {VersionInfo, Error} from "../../generated";


export enum ModelOptionsMutation {
    UnValidate = "UnValidate",
    Validate = "Validate",
    Validating = "Validating",
    Validated = "Validated",
    Update = "Update",
    FetchingModelOptions = "FetchingModelOptions",
    ModelOptionsFetched = "ModelOptionsFetched",
    ModelOptionsError = "ModelOptionsError",
    SetModelOptionsVersion = "SetModelOptionsVersion",
    HasValidationError = "HasValidationError",
    LoadUpdatedOptions = "LoadUpdatedOptions"
}

export const ModelOptionsUpdates = [ModelOptionsMutation.Update, ModelOptionsMutation.UnValidate];

export const mutations: MutationTree<ModelOptionsState> = {
    [ModelOptionsMutation.UnValidate](state: ModelOptionsState) {
        state.valid = false;
    },

    [ModelOptionsMutation.Validate](state: ModelOptionsState) {
        state.valid = true;
    },

    [ModelOptionsMutation.Validating](state: ModelOptionsState) {
        state.validating = true;
    },

    [ModelOptionsMutation.Validated](state: ModelOptionsState) {
        state.validating = false;
    },

    [ModelOptionsMutation.LoadUpdatedOptions](state: ModelOptionsState, payload: DynamicFormData) {
        state.options = payload;
        state.validateError = null;
    },

    [ModelOptionsMutation.HasValidationError](state: ModelOptionsState, action: PayloadWithType<Error>) {
        state.validateError = action.payload;
    },

    [ModelOptionsMutation.Update](state: ModelOptionsState, payload: DynamicFormMeta) {
        state.valid = false;
        state.changes = true;
        state.optionsFormMeta = payload;
    },

    [ModelOptionsMutation.FetchingModelOptions](state: ModelOptionsState) {
        state.fetching = true;
    },

    [ModelOptionsMutation.ModelOptionsFetched](state: ModelOptionsState, action: PayloadWithType<DynamicFormMeta>) {
        console.log('old form pre?', state.optionsFormMeta.controlSections)
        console.log('new form pre?', action.payload.controlSections)
        const newForm = {...updateForm(state.optionsFormMeta, action.payload)};
        // const valid = state.valid && JSON.stringify(newForm) == JSON.stringify(state.optionsFormMeta);
        console.log('mathes?', state.valid, JSON.stringify(newForm) == JSON.stringify(state.optionsFormMeta.controlSections))

        console.log('new form?', JSON.stringify(newForm).replace(/,\"value\":null/g, "").length)
        console.log('old form?', JSON.stringify(state.optionsFormMeta).replace(/,\"value\":null/g, "").length)
        console.log('new form? Post', newForm)
        console.log('old form Post?', state.optionsFormMeta)
        // console.log('new form?', JSON.stringify(newForm.controlSections[0]).length)
        // console.log('old form?', JSON.stringify(state.optionsFormMeta.controlSections[0]).length)
        // console.log('new form?', JSON.stringify(newForm.controlSections[1]).length)
        // console.log('old form?', JSON.stringify(state.optionsFormMeta.controlSections[1]).length)
        console.log('new form?', JSON.stringify(newForm.controlSections[2]))
        console.log('old form?', JSON.stringify(state.optionsFormMeta.controlSections[2]))
        console.log('new form?', JSON.stringify(newForm.controlSections[2]).length)
        console.log('old form?', JSON.stringify(state.optionsFormMeta.controlSections[2]).length)
        // console.log('new form?', JSON.stringify(newForm.controlSections[3]).length)
        // console.log('old form?', JSON.stringify(state.optionsFormMeta.controlSections[3]).length)
        // console.log('new form?', JSON.stringify(newForm.controlSections[4]).length)
        // console.log('old form?', JSON.stringify(state.optionsFormMeta.controlSections[4]).length)
        // console.log('new form?', JSON.stringify(newForm.controlSections[5]).length)
        // console.log('old form?', JSON.stringify(state.optionsFormMeta.controlSections[5]).length)
        // console.log('new form? Post', JSON.stringify(newForm).slice(0,500))
        // console.log('old form Post?', JSON.stringify(state.optionsFormMeta).slice(0,500))
        // console.log('new form? Post', JSON.stringify(newForm).slice(JSON.stringify(newForm).length - 500))
        // console.log('old form Post?', JSON.stringify(state.optionsFormMeta).slice(JSON.stringify(state.optionsFormMeta).length - 500))
        state.valid = state.valid && JSON.stringify(newForm).replace(/,\"value\":null/g, "") == JSON.stringify(state.optionsFormMeta).replace(/,\"value\":null/g, "");
        // if (valid){
        //     state.optionsFormMeta = newForm;
        //     state.valid = true;
        // } else {
        //     state.optionsFormMeta = newForm;
        //     state.valid = false;
        // }
        state.optionsFormMeta = newForm;
        // state.valid = state.valid && JSON.stringify(newForm) == JSON.stringify(state.optionsFormMeta);
        // state.valid = valid
        state.fetching = false;
    },

    [ModelOptionsMutation.ModelOptionsError](state: ModelOptionsState, action: PayloadWithType<Error>) {
        state.optionsError = action.payload;
        state.fetching = false;
    },

    [ModelOptionsMutation.SetModelOptionsVersion](state: ModelOptionsState, action: PayloadWithType<VersionInfo>) {
        state.version = action.payload
    }
};
