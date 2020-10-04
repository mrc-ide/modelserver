import {mockAxios, mockModelCalibrateState, mockModelRunState, mockRootState, mockSuccess} from "../mocks";
import {actions} from "../../app/store/modelCalibrate/actions";
import {ModelCalibrateMutation} from "../../app/store/modelCalibrate/mutations";
import {ModelRunMutation} from "../../app/store/modelRun/mutations";

const rootState = mockRootState();
describe("ModelCalibrate actions", () => {
    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    it("fetchModelCalibrateOptions fetches option and commits mutations", async () => {
        const commit = jest.fn();
        const state = mockModelCalibrateState();
        mockAxios.onGet("/model/calibration-options/").reply(200, mockSuccess("TEST", "v1"));

        await actions.fetchModelCalibrateOptions({commit, state, rootState} as any);

        expect(commit.mock.calls.length).toBe(3);
        expect(commit.mock.calls[0][0]).toBe(ModelCalibrateMutation.FetchingModelCalibrateOptions);
        expect(commit.mock.calls[1][0].type).toBe(ModelCalibrateMutation.ModelCalibrateOptionsFetched);
        expect(commit.mock.calls[1][0].payload).toBe("TEST");
        expect(commit.mock.calls[2][0].type).toBe(ModelCalibrateMutation.SetModelCalibrateOptionsVersion);
        expect(commit.mock.calls[2][0].payload).toBe("v1")
    });

    it("calibrate action calls calibrate endpoints and commits mutations", async () => {
        const commit = jest.fn();
        const mockVersion = {naomi: "1.0.0", hintr: "1.0.0", rrq: "1.0.0"};
        const state = mockModelCalibrateState({version: mockVersion});
        const root = mockRootState({
            modelRun: mockModelRunState({modelRunId: "123A"})
        });
        const mockOptions = {"param_1": "value 1"};
        const url = `/model/calibrate/123A`;
        mockAxios.onPost(url).reply(200, mockSuccess("TEST"));

        await actions.calibrate({commit, state, rootState: root} as any, mockOptions);

        expect(mockAxios.history.post.length).toBe(1);
        expect(mockAxios.history.post[0].url).toBe(url);
        expect(JSON.parse(mockAxios.history.post[0].data)).toStrictEqual({version: mockVersion, options: mockOptions});

        expect(commit.mock.calls.length).toBe(3);
        expect(commit.mock.calls[0][0]).toBe(ModelCalibrateMutation.SetOptionsData);
        expect(commit.mock.calls[0][1]).toBe(mockOptions);
        expect(commit.mock.calls[1][0].type).toBe(ModelRunMutation.RunResultFetched);
        expect(commit.mock.calls[1][0].payload).toBe("TEST");
        expect(commit.mock.calls[2][0]).toBe(ModelCalibrateMutation.Calibrated);
    });
});
