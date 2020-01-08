import {mutations} from "../../app/store/plottingSelections/mutations";
import {mockPlottingSelections} from "../mocks";

describe("Plotting selections mutations", () => {

    it("updates barchart selections", () => {
        const testState = mockPlottingSelections();
        const newBarchartSelections = {
            indicatorId: "test-indicator",
            disaggregateById: "test-disagg",
            selectedFilterOptions: {
                testFilter: []
            }
        };
        mutations.updateBarchartSelections(testState, {payload: newBarchartSelections});

        expect(testState.barchart).toStrictEqual({
            indicatorId: "test-indicator",
            disaggregateById: "test-disagg",
            xAxisId: "",
            selectedFilterOptions: {
                testFilter: []
            }
        });
    });

    it("updates bubble plot selections", () => {
        const testState = mockPlottingSelections();
        const newBubbleSelections = {
            selectedFilterOptions: { testFilter: [{id: "1", label: "one"}]}
        };
        mutations.updateBubblePlotSelections(testState, {payload: newBubbleSelections});
        expect(testState.bubble).toStrictEqual({
            detail: -1,
            selectedFilterOptions: { testFilter: [{id: "1", label: "one"}]}
        });
    });
});
