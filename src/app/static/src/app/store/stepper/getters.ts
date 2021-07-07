import {RootState} from "../../root";
import {Getter, GetterTree} from "vuex";
import {StepDescription, StepperState} from "./stepper";

interface StepperGetters {
    ready: Getter<StepperState, RootState>,
    complete: Getter<StepperState, RootState>
    editsRequireConfirmation: Getter<StepperState, RootState>
}

export const getters: StepperGetters & GetterTree<StepperState, RootState> = {
    ready: (state: StepperState, getters: any, rootState: RootState) => {
        return !!rootState.adr.schemas &&
            rootState.baseline.ready &&
            rootState.surveyAndProgram.ready &&
            rootState.modelRun.ready &&
            rootState.modelCalibrate.ready
    },
    complete: (state: StepperState, getters: any, rootState: RootState, rootGetters: any) => {
        return {
            1: rootGetters['baseline/complete'] && rootGetters['metadata/complete'],
            2: rootGetters['surveyAndProgram/complete'],
            3: rootGetters['modelOptions/complete'],
            // 4: rootGetters['modelRun/complete'],
            4: rootState.modelRun.complete,
            5: rootState.modelCalibrate.complete,
            6: rootState.modelCalibrate.complete,
            7: false
        }
    },
    hasChanges: (state: StepperState, getters: any, rootState: RootState, rootGetters: any) => {
        return {
            1: null,
            2: false,
            3: rootGetters['modelOptions/hasChanges'],
            4: rootGetters['modelRun/complete'],
            5: false,
            6: false,
            7: false
        }
    },
    changesToRelevantSteps: (state: StepperState, getters: any) => {
        const {activeStep} = state;
        // If the active step is fit model, we want a previous successful model run to trigger the save version dialog
        if (activeStep === 4){
            return state.steps.filter((s: StepDescription) => s.number >= activeStep && getters.hasChanges[s.number]);
        // Otherwise, we only want changes to subsequent steps to trigger the save version dialog
        } else return state.steps.filter((s: StepDescription) => s.number > activeStep && getters.hasChanges[s.number]);
    },
    editsRequireConfirmation: (state: StepperState, getters: any) => {
        return getters.changesToRelevantSteps.length > 0;
    }
};
