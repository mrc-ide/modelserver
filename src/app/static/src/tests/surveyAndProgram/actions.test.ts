import {actions} from "../../app/store/surveyAndProgram/actions";
import {
    mockAncResponse,
    mockAxios,
    mockFailure,
    mockProgramResponse,
    mockSuccess,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../mocks";

import {DataType} from "../../app/store/filteredData/filteredData";

const FormData = require("form-data");

describe("Survey and programme actions", () => {

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    it("sets data after surveys file upload", async () => {

        mockAxios.onPost(`/disease/survey/`)
            .reply(200, mockSuccess({data: "SOME DATA"}));

        const commit = jest.fn();
        await actions.uploadSurvey({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "SurveyUpdated",
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "SurveyUpdated",
            payload: {data: "SOME DATA"}
        });

        //Should also have set selectedDataType
        expect(commit.mock.calls[2][0]).toStrictEqual("filteredData/SelectedDataTypeUpdated");
        expect(commit.mock.calls[2][1]).toStrictEqual({type: "SelectedDataTypeUpdated", payload: DataType.Survey});
    });

    it("sets error message after failed surveys upload", async () => {

        mockAxios.onPost(`/disease/survey/`)
            .reply(500, mockFailure("error message"));

        const commit = jest.fn();
        await actions.uploadSurvey({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "SurveyUpdated",
            payload: null
        });
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "SurveyError",
            payload: "error message"
        });

        //Should not have set selectedDataType
        expect(commit.mock.calls.length).toEqual(2);
    });

    it("sets data after programme file upload", async () => {

        mockAxios.onPost(`/disease/programme/`)
            .reply(200, mockSuccess("TEST"));

        const commit = jest.fn();
        await actions.uploadProgram({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ProgramUpdated",
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "ProgramUpdated",
            payload: "TEST"
        });

        //Should also have set selectedDataType
        expect(commit.mock.calls[2][0]).toStrictEqual("filteredData/SelectedDataTypeUpdated");
        expect(commit.mock.calls[2][1]).toStrictEqual({type: "SelectedDataTypeUpdated", payload: DataType.Program});
    });

    it("sets error message after failed programme upload", async () => {

        mockAxios.onPost(`/disease/programme/`)
            .reply(500, mockFailure("error message"));

        const commit = jest.fn();
        await actions.uploadProgram({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ProgramUpdated",
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "ProgramError",
            payload: "error message"
        });

        //Should not have set selectedDataType
        expect(commit.mock.calls.length).toEqual(2);
    });

    it("sets data after anc file upload", async () => {

        mockAxios.onPost(`/disease/anc/`)
            .reply(200, mockSuccess("TEST"));

        const commit = jest.fn();
        await actions.uploadANC({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ANCUpdated",
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "ANCUpdated",
            payload: "TEST"
        });

        //Should also have set selectedDataType
        expect(commit.mock.calls[2][0]).toStrictEqual("filteredData/SelectedDataTypeUpdated");
        expect(commit.mock.calls[2][1]).toStrictEqual({type: "SelectedDataTypeUpdated", payload: DataType.ANC});
    });

    it("sets error message after failed anc upload", async () => {

        mockAxios.onPost(`/disease/anc/`)
            .reply(500, mockFailure("error message"));

        const commit = jest.fn();
        await actions.uploadANC({commit} as any, new FormData());

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ANCUpdated",
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "ANCError",
            payload: "error message"
        });

        //Should not have set selectedDataType
        expect(commit.mock.calls.length).toEqual(2);
    });

    it("gets data, commits it and marks state ready", async () => {

        mockAxios.onGet(`/disease/survey/`)
            .reply(200, mockSuccess(mockSurveyResponse()));

        mockAxios.onGet(`/disease/programme/`)
            .reply(200, mockSuccess(mockProgramResponse()));

        mockAxios.onGet(`/disease/anc/`)
            .reply(200, mockSuccess(mockAncResponse()));

        const commit = jest.fn();
        await actions.getSurveyAndProgramData({commit} as any);

        const calls = commit.mock.calls.map((callArgs) => callArgs[0]["type"]);
        expect(calls).toContain("SurveyUpdated");
        expect(calls).toContain("ProgramUpdated");
        expect(calls).toContain("ANCUpdated");
        expect(calls).toContain("Ready");

    });

    it("fails silently and marks state ready if getting data fails", async () => {

        mockAxios.onGet(`/disease/survey/`)
            .reply(500);

        mockAxios.onGet(`/disease/anc/`)
            .reply(500);

        mockAxios.onGet(`/disease/programme/`)
            .reply(500);

        const commit = jest.fn();
        await actions.getSurveyAndProgramData({commit} as any);

        expect(commit).toBeCalledTimes(1);
        expect(commit.mock.calls[0][0]["type"]).toContain("Ready");
    });

    it("deletes survey and resets filtered data", async () => {
        mockAxios.onDelete("/disease/survey/hash/")
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        const state = mockSurveyAndProgramState({
            survey: mockSurveyResponse({hash: "hash"})
        });
        await actions.deleteSurvey({commit, state} as any);
        expect(commit).toBeCalledTimes(2);
        expect(commit.mock.calls[0][0]["type"]).toBe("SurveyUpdated");
        expect(commit.mock.calls[1][0]["type"]).toBe("filteredData/Reset");
    });

    it("deletes program and resets filtered data", async () => {
        mockAxios.onDelete("/disease/programme/hash/")
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        const state = mockSurveyAndProgramState({
            program: mockProgramResponse({hash: "hash"})
        });
        await actions.deleteProgram({commit, state} as any);
        expect(commit).toBeCalledTimes(2);
        expect(commit.mock.calls[0][0]["type"]).toBe("ProgramUpdated");
        expect(commit.mock.calls[1][0]["type"]).toBe("filteredData/Reset");
    });

    it("deletes ANC and resets filtered data", async () => {
        mockAxios.onDelete("/disease/anc/hash/")
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        const state = mockSurveyAndProgramState({
            anc: mockAncResponse({hash: "hash"})
        });
        await actions.deleteANC({commit, state} as any);
        expect(commit).toBeCalledTimes(2);
        expect(commit.mock.calls[0][0]["type"]).toBe("ANCUpdated");
        expect(commit.mock.calls[1][0]["type"]).toBe("filteredData/Reset");
    });

    it("deletes all", async () => {
        mockAxios.onDelete("/disease/anc/hash/")
            .reply(200, mockSuccess(true));

        mockAxios.onDelete("/disease/survey/hash/")
            .reply(200, mockSuccess(true));

        mockAxios.onDelete("/disease/programme/hash/")
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        const state = mockSurveyAndProgramState({
            anc: mockAncResponse({hash: "hash"}),
            survey: mockSurveyResponse({hash: "hash"}),
            program: mockProgramResponse({hash: "hash"})
        });
        await actions.deleteAll({commit, state} as any);
        expect(commit).toBeCalledTimes(6);
        expect(commit.mock.calls.map(c => c[0]["type"])).toEqual([
            "SurveyUpdated",
            "filteredData/Reset",
            "ProgramUpdated",
            "filteredData/Reset",
            "ANCUpdated",
            "filteredData/Reset"]);
    });

});