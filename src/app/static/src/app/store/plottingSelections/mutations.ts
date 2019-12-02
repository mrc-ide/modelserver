import {Mutation, MutationTree} from 'vuex';
import {PlottingSelectionsState, BarchartSelections} from "./plottingSelections";
import {PayloadWithType} from "../../types";

type PlottingSelectionsMutation = Mutation<PlottingSelectionsState>

export interface PlottingSelectionsMutations {
    updateBarchartSelections: PlottingSelectionsMutation
}

export const mutations: MutationTree<PlottingSelectionsState> & PlottingSelectionsMutations = {
    updateBarchartSelections(state: PlottingSelectionsState, action: PayloadWithType<Partial<BarchartSelections>>) {
        console.log("UPDATING BARCHART MUTATION: " + JSON.stringify(action));
        state.barchart = {...state.barchart, ...action.payload};
    }
};