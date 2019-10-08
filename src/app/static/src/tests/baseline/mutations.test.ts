import {mutations} from "../../app/store/baseline/mutations";
import {mockModelRunState, mockPJNZResponse, mockPopulationResponse, mockRootState, mockShapeResponse} from "../mocks";
import {baselineGetters, BaselineState, initialBaselineState} from "../../app/store/baseline/baseline";
import {initialSurveyAndProgramDataState} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {Module} from "vuex";
import {RootState} from "../../app/root";
import {initialFilteredDataState} from "../../app/store/filteredData/filteredData";

describe("Baseline mutations", () => {

    it("sets country, filename and error on PJNZUpdated", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZUpdated(testState, {
            payload: mockPJNZResponse({data: {country: "Malawi"}, filename: "file.pjnz"})
        });
        expect(testState.country).toBe("Malawi");
        expect(testState.pjnzFilename).toBe("file.pjnz");
        expect(testState.pjnzError).toBe("");
    });

    it("state becomes complete once all files are Updated", () => {
        const testStore: Module<BaselineState, RootState> = {
            state: {...initialBaselineState},
            getters: baselineGetters
        };
        const testState = testStore.state as BaselineState;
        const testRootState = mockRootState({baseline: testState});
        const complete = testStore.getters!!.complete;

        mutations.PJNZUpdated(testState, {
            payload:
                mockPJNZResponse({data: {country: "Malawi"}}), type: "PJNZUpdated"
        });

        expect(complete(testState, null, testRootState, null)).toBe(false);

        mutations.ShapeUpdated(testState, {
            payload:
                mockShapeResponse(), type: "ShapeUpdated"
        });

        expect(complete(testState, null, testRootState, null)).toBe(false);

        mutations.PopulationUpdated(testState, {
            payload:
                mockPopulationResponse(), type: "PopulationUpdated"
        });

        expect(complete(testState, null, testRootState, null)).toBe(true);

    });

    it("sets error on PJNZUploadError", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZUploadError(testState, {payload: "Some error"});
        expect(testState.pjnzError).toBe("Some error");
    });

    it("sets country and filename and clears error if present on PJNZUpdated", () => {

        const testState = {...initialBaselineState, pjnzError : "test"};
        mutations.PJNZUpdated(testState, {
            payload: mockPJNZResponse({filename: "file.pjnz", data: {country: "Malawi"}})
        });
        expect(testState.pjnzFilename).toBe("file.pjnz");
        expect(testState.country).toBe("Malawi");
        expect(testState.pjnzError).toBe("");
    });

    it("clears country and filename on PJNZUpdated if no data present", () => {

        const testState = {...initialBaselineState, pjnzError: "", country: "test", pjnzFilename: "test"};
        mutations.PJNZUpdated(testState, {payload: null});
        expect(testState.pjnzFilename).toBe("");
        expect(testState.country).toBe("");
        expect(testState.pjnzError).toBe("");
    });

    it("sets shape and clears error on ShapeUpdated", () => {

        const mockShape = mockShapeResponse();
        const testState = {...initialBaselineState, shapeError: ""};
        mutations.ShapeUpdated(testState, {
            payload: mockShape
        });
        expect(testState.shape).toBe(mockShape);
        expect(testState.shapeError).toBe("");
    });

    it("sets error on ShapeUploadError", () => {

        const testState = {...initialBaselineState};
        mutations.ShapeUploadError(testState, {payload: "Some error"});
        expect(testState.shapeError).toBe("Some error");
    });

    it("sets response and clears error on PopulationUpdated", () => {

        const mockPop = mockPopulationResponse();
        const testState = {...initialBaselineState, populationError: "test"};
        mutations.PopulationUpdated(testState, {
            payload: mockPop
        });
        expect(testState.population).toBe(mockPop);
        expect(testState.populationError).toBe("");
    });

    it("sets error on PopulationUploadError", () => {

        const testState = {...initialBaselineState};
        mutations.PopulationUploadError(testState, {payload: "Some error"});
        expect(testState.populationError).toBe("Some error");
    });

    it("sets ready state", () => {
        const testState = {...initialBaselineState};
        mutations.Ready(testState);
        expect(testState.ready).toBe(true);
    })

});
