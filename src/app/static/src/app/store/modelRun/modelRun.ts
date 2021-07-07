import {Module} from "vuex";
import {ReadyState, RootState} from "../../root";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {localStorageManager} from "../../localStorageManager";
import {ModelResultResponse, ModelStatusResponse, Error, CalibrateResultResponse} from "../../generated";

export interface ModelRunState extends ReadyState {
    complete: boolean,
    modelRunId: string
    statusPollId: number,
    status: ModelStatusResponse
    errors: Error[],
    result: CalibrateResultResponse | ModelResultResponse | null
    pollingCounter: number
}

export const maxPollErrors = 150;

export const initialModelRunState = (): ModelRunState => {
    return {
        complete: false,
        modelRunId: "",
        errors: [],
        status: {} as ModelStatusResponse,
        statusPollId: -1,
        result: null,
        ready: false,
        pollingCounter : 0
    }
};

export const modelRunGetters = {
    // complete: (state: ModelRunState) => {
    //     return !!state.status.success && state.errors.length == 0 && !!state.result
    // },
    running: (state: ModelRunState) => {
        const started = !!state.status.id;
        const finished = state.status.done && (!state.status.success || !!state.result);
        return started && !finished
    }
};

const namespaced = true;
const existingState = localStorageManager.getState();

export const modelRun: Module<ModelRunState, RootState> = {
    namespaced,
    state: {...initialModelRunState(), ...existingState && existingState.modelRun, ready: false},
    actions,
    getters: modelRunGetters,
    mutations
};
