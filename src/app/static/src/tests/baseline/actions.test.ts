import {
    mockADRState,
    mockAxios,
    mockBaselineState,
    mockDataset,
    mockDatasetResource,
    mockError,
    mockFailure,
    mockPopulationResponse,
    mockRootState,
    mockShapeResponse,
    mockSuccess,
    mockValidateBaselineResponse
} from "../mocks";
import {actions} from "../../app/store/baseline/actions";
import {BaselineMutation} from "../../app/store/baseline/mutations";
import {expectEqualsFrozen, testUploadErrorCommitted} from "../testHelpers";
import {ADRSchemas} from "../../app/types";
import Mock = jest.Mock;

const FormData = require("form-data");
const adrSchemas: ADRSchemas = {
    baseUrl: "adr.com",
    pjnz: "pjnz",
    population: "pop",
    shape: "shape",
    survey: "survey",
    programme: "program",
    anc: "anc",
    outputZip: "zip",
    outputSummary: "summary"
};

const rootState = mockRootState({
    adr: mockADRState({schemas: adrSchemas})
});

const mockFormData = {
  get: (key: string) => { return key == "file" ? {name: "file.txt"} : null; }
};

describe("Baseline actions", () => {

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    it("sets country and iso3 after PJNZ file upload, and fetches plotting metadata, and validates", async () => {

        mockAxios.onPost(`/baseline/pjnz/`)
            .reply(200, mockSuccess({data: {country: "Malawi", iso3: "MWI"}}));

        const commit = jest.fn();
        const state = mockBaselineState({iso3: "MWI"});
        const dispatch = jest.fn();

        await actions.uploadPJNZ({commit, state, dispatch, rootState} as any, mockFormData as any);

        checkPJNZImportUpload(commit, dispatch)
    });

    it("sets country and iso3 after PJNZ import, and fetches plotting metadata, and validates", async () => {

        mockAxios.onPost(`/adr/pjnz/`)
            .reply(200, mockSuccess({data: {country: "Malawi", iso3: "MWI"}}));

        const commit = jest.fn();
        const state = mockBaselineState({iso3: "MWI"});
        const dispatch = jest.fn();

        await actions.importPJNZ({commit, state, dispatch, rootState} as any, "some-url");

        checkPJNZImportUpload(commit, dispatch)
    });

    const checkPJNZImportUpload = (commit: Mock, dispatch: Mock) => {
        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]).toStrictEqual({type: BaselineMutation.PJNZUpdated, payload: null});

        expectEqualsFrozen(commit.mock.calls[1][0], {
            type: BaselineMutation.PJNZUpdated,
            payload: {data: {country: "Malawi", iso3: "MWI"}}
        });

        expect(dispatch.mock.calls.length).toBe(3);

        expect(dispatch.mock.calls[0][0]).toBe("metadata/getPlottingMetadata");
        expect(dispatch.mock.calls[0][1]).toBe("MWI");
        expect(dispatch.mock.calls[0][2]).toStrictEqual({root: true});

        expect(dispatch.mock.calls[1].length).toBe(1);
        expect(dispatch.mock.calls[1][0]).toBe("validate");

        expect(dispatch.mock.calls[2][0]).toBe("surveyAndProgram/validateSurveyAndProgramData");
        expect(dispatch.mock.calls[2][2]).toStrictEqual({root: true});

    }

    it("upload PJNZ does not fetch plotting metadata or validate if error occurs", async () => {
        mockAxios.onPost(`/baseline/pjnz/`)
            .reply(400, mockFailure("test error"));

        const commit = jest.fn();
        const state = mockBaselineState();
        const dispatch = jest.fn();
        await actions.uploadPJNZ({commit, state, dispatch, rootState} as any, mockFormData as any);

        expect(dispatch.mock.calls.length).toBe(1);
        expect(dispatch.mock.calls[0][0]).toBe("surveyAndProgram/validateSurveyAndProgramData");
    });

    it("import PJNZ does not fetch plotting metadata or validate if error occurs", async () => {
        mockAxios.onPost(`/adr/pjnz/`)
            .reply(400, mockFailure("test error"));

        const commit = jest.fn();
        const state = mockBaselineState();
        const dispatch = jest.fn();
        await actions.importPJNZ({commit, state, dispatch, rootState} as any, "some-url/some-file.txt");

        expect(dispatch.mock.calls.length).toBe(1);
        expect(dispatch.mock.calls[0][0]).toBe("surveyAndProgram/validateSurveyAndProgramData");

        expect(commit.mock.calls.length).toBe(3);
        expect(commit.mock.calls[0][0]).toStrictEqual({type: "PJNZUpdated", payload: null});
        expect(commit.mock.calls[1][0]).toStrictEqual({type: "PJNZUploadError", payload: mockError("test error")});
        expect(commit.mock.calls[2][0]).toStrictEqual({type: "PJNZErroredFile", payload: "some-file.txt"});
    });

    testUploadErrorCommitted("/baseline/pjnz/",
        BaselineMutation.PJNZUploadError,
        BaselineMutation.PJNZUpdated,
        BaselineMutation.PJNZErroredFile,
        "file.txt",
        mockFormData,
        actions.uploadPJNZ);

    it("commits response and validates after shape file upload", async () => {

        const mockShape = mockShapeResponse();
        mockAxios.onPost(`/baseline/shape/`)
            .reply(200, mockSuccess(mockShape));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.uploadShape({commit, dispatch, rootState} as any, mockFormData as any);

        checkShapeImportUpload(commit, dispatch, mockShape);
    });

    it("import Shape commits error if error occurs", async () => {
        mockAxios.onPost(`/adr/shape/`)
            .reply(400, mockFailure("test error"));

        const commit = jest.fn();
        const state = mockBaselineState();
        const dispatch = jest.fn();
        await actions.importShape({commit, state, dispatch, rootState} as any, "some-url/some-file.txt");

        expect(dispatch.mock.calls.length).toBe(1);
        expect(dispatch.mock.calls[0][0]).toBe("surveyAndProgram/validateSurveyAndProgramData");

        expect(commit.mock.calls.length).toBe(3);
        expect(commit.mock.calls[0][0]).toStrictEqual({type: "ShapeUpdated", payload: null});
        expect(commit.mock.calls[1][0]).toStrictEqual({type: "ShapeUploadError", payload: mockError("test error")});
        expect(commit.mock.calls[2][0]).toStrictEqual({type: "ShapeErroredFile", payload: "some-file.txt"});
    });

    it("commits response and validates after shape file import", async () => {

        const mockShape = mockShapeResponse();
        mockAxios.onPost(`/adr/shape/`)
            .reply(200, mockSuccess(mockShape));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.importShape({commit, dispatch, rootState} as any, "some-url");

        checkShapeImportUpload(commit, dispatch, mockShape);
    });

    testUploadErrorCommitted(
        "/baseline/shape/",
        "ShapeUploadError",
        "ShapeUpdated",
        "ShapeErroredFile",
        "file.txt",
        mockFormData,
        actions.uploadShape);

    const checkShapeImportUpload = (commit: Mock, dispatch: Mock, mockShape: any) => {
        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: BaselineMutation.ShapeUpdated,
            payload: null
        });

        expectEqualsFrozen(commit.mock.calls[1][0], {
            type: BaselineMutation.ShapeUpdated,
            payload: mockShape
        });

        expect(dispatch.mock.calls.length).toBe(2);
        expect(dispatch.mock.calls[0][0]).toBe("validate");

        expect(dispatch.mock.calls[1][0]).toBe("surveyAndProgram/validateSurveyAndProgramData");
        expect(dispatch.mock.calls[1][2]).toStrictEqual({root: true});
    }


    it("commits response and validates after population file upload", async () => {

        const mockPop = mockPopulationResponse();
        mockAxios.onPost(`/baseline/population/`)
            .reply(200, mockSuccess(mockPop));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.uploadPopulation({commit, dispatch, rootState} as any, mockFormData as any);

        checkPopulationImportUpload(commit, dispatch, mockPop);
    });

    it("commits response and validates after population file import", async () => {

        const mockPop = mockPopulationResponse();
        mockAxios.onPost(`/adr/population/`)
            .reply(200, mockSuccess(mockPop));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.importPopulation({commit, dispatch, rootState} as any, "some-url");

        checkPopulationImportUpload(commit, dispatch, mockPop);
    });

    const checkPopulationImportUpload = (commit: Mock, dispatch: Mock, mockPop: any) => {
        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: BaselineMutation.PopulationUpdated,
            payload: null
        });

        expectEqualsFrozen(commit.mock.calls[1][0], {
            type: BaselineMutation.PopulationUpdated,
            payload: mockPop
        });

        expect(dispatch.mock.calls.length).toBe(2);
        expect(dispatch.mock.calls[0][0]).toBe("validate");

        expect(dispatch.mock.calls[1][0]).toBe("surveyAndProgram/validateSurveyAndProgramData");
        expect(dispatch.mock.calls[1][2]).toStrictEqual({root: true});
    };


    it("import Population commits error if error occurs", async () => {
        mockAxios.onPost(`/adr/population/`)
            .reply(400, mockFailure("test error"));

        const commit = jest.fn();
        const state = mockBaselineState();
        const dispatch = jest.fn();
        await actions.importPopulation({commit, state, dispatch, rootState} as any, "some-url/some-file.txt");

        expect(dispatch.mock.calls.length).toBe(1);
        expect(dispatch.mock.calls[0][0]).toBe("surveyAndProgram/validateSurveyAndProgramData");

        expect(commit.mock.calls.length).toBe(3);
        expect(commit.mock.calls[0][0]).toStrictEqual({type: "PopulationUpdated", payload: null});
        expect(commit.mock.calls[1][0]).toStrictEqual({type: "PopulationUploadError", payload: mockError("test error")});
        expect(commit.mock.calls[2][0]).toStrictEqual({type: "PopulationErroredFile", payload: "some-file.txt"});
    });


    testUploadErrorCommitted(
        "/baseline/population/",
        "PopulationUploadError",
        "PopulationUpdated",
        "PopulationErroredFile",
        "file.txt",
        mockFormData,
        actions.uploadPopulation);

    it("gets baseline data, commits it and marks state as ready", async () => {

        const mockShape = mockShapeResponse();
        const mockPopulation = mockPopulationResponse();
        mockAxios.onGet(`/baseline/pjnz/`)
            .reply(200, mockSuccess({data: {country: "Malawi"}, filename: "test.pjnz"}));

        mockAxios.onGet(`/baseline/shape/`)
            .reply(200, mockSuccess(mockShape));

        mockAxios.onGet(`/baseline/population/`)
            .reply(200, mockSuccess(mockPopulation));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.getBaselineData({commit, dispatch, rootState} as any);

        const calls = commit.mock.calls.map((callArgs) => callArgs[0]["type"]);
        expect(calls).toContain(BaselineMutation.PJNZUpdated);
        expect(calls).toContain(BaselineMutation.ShapeUpdated);
        expect(calls).toContain(BaselineMutation.PopulationUpdated);
        expect(calls).toContain(BaselineMutation.Ready);

        const payloads = commit.mock.calls.map((callArgs) => callArgs[0]["payload"]);
        expect(payloads.filter(p => Object.isFrozen(p)).length).toBe(4);
        //ready payload is true, which is frozen by definition
    });

    it("commits response on validate", async () => {
        const mockValidateResponse = mockValidateBaselineResponse();
        mockAxios.onGet(`/baseline/validate/`)
            .reply(200, mockSuccess(mockValidateResponse));

        const commit = jest.fn();
        await actions.validate({commit, rootState} as any);

        //commits to Validating first
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: BaselineMutation.Validating,
            payload: null
        });

        //then commits response from api
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: BaselineMutation.Validated,
            payload: mockValidateResponse
        });
    });

    it("commits response on validate error", async () => {
        mockAxios.onGet(`/baseline/validate/`)
            .reply(400, mockFailure("Baseline is inconsistent"));

        const commit = jest.fn();
        await actions.validate({commit, rootState} as any);

        //commits to Validating first
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: BaselineMutation.Validating,
            payload: null
        });

        //then commits response from api
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: BaselineMutation.BaselineError,
            payload: mockError("Baseline is inconsistent")
        });
    });

    it("fails silently and marks state ready if getting baseline data fails", async () => {

        mockAxios.onGet(`/baseline/pjnz/`)
            .reply(500);

        mockAxios.onGet(`/baseline/shape/`)
            .reply(500);

        mockAxios.onGet(`/baseline/population/`)
            .reply(500);

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.getBaselineData({commit, dispatch, rootState} as any);

        expect(commit).toBeCalledTimes(1);
        expect(commit.mock.calls[0][0]["type"]).toBe(BaselineMutation.Ready);
    });

    it("deletes pjnz and dispatches survey and program delete action", async () => {

        mockAxios.onDelete("/baseline/pjnz/")
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.deletePJNZ({commit, dispatch, rootState} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe(BaselineMutation.PJNZUpdated);
        expect(dispatch.mock.calls[0][0]).toBe("surveyAndProgram/deleteAll");
        expect(dispatch.mock.calls[0][2]).toStrictEqual({root: true});
    });

    it("deletes shape and dispatches survey and program delete action", async () => {

        mockAxios.onDelete("/baseline/shape/")
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.deleteShape({commit, dispatch, rootState} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe(BaselineMutation.ShapeUpdated);
        expect(dispatch.mock.calls[0][0]).toBe("surveyAndProgram/deleteAll");
        expect(dispatch.mock.calls[0][2]).toStrictEqual({root: true});
    });

    it("deletes population and dispatches survey and program delete action", async () => {

        mockAxios.onDelete("/baseline/population/")
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.deletePopulation({commit, dispatch, rootState} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe(BaselineMutation.PopulationUpdated);
        expect(dispatch.mock.calls[0][0]).toBe("surveyAndProgram/deleteAll");
        expect(dispatch.mock.calls[0][2]).toStrictEqual({root: true});
    });

    it("deletes all", async () => {
        mockAxios.onDelete("/baseline/pjnz/")
            .reply(200, mockSuccess(true));
        mockAxios.onDelete("/baseline/shape/")
            .reply(200, mockSuccess(true));
        mockAxios.onDelete("/baseline/population/")
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.deleteAll({commit, dispatch, rootState} as any);
        expect(mockAxios.history["delete"].length).toBe(3)
    });

    it("refreshes dataset metadata", async () => {

        mockAxios.onGet("/adr/datasets/1234")
            .reply(200, mockSuccess({
                resources: [
                    {id: "1", url: "something.com", last_modified: "2020-11-01", metadata_modified: "2020-11-02", resource_type: "pop", name: "Pop resource"},
                    {id: "2", url: "something.com", last_modified: "2020-11-03", metadata_modified: "2020-11-04", resource_type: "pjnz", name: "PJNZ resource"},
                    {id: "3", url: "something.com", last_modified: "2020-11-05", metadata_modified: "2020-11-06", resource_type: "shape", name: "Shape resource"},
                    {id: "4", url: "something.com", last_modified: "2020-11-07", metadata_modified: "2020-11-08", resource_type: "survey", name: "Survey resource"},
                    {id: "5", url: "something.com", last_modified: "2020-11-09", metadata_modified: "2020-11-10", resource_type: "program", name: "Program resource"},
                    {id: "6", url: "something.com", last_modified: "2020-11-11", metadata_modified: "2020-11-12", resource_type: "anc", name: "ANC resource"},
                    {id: "7", url: "something.com", last_modified: "2020-10-01", metadata_modified: "2020-10-02", resource_type: "random", name: "Random resource"},

                ]
            }))

        const commit = jest.fn();
        const state = mockBaselineState({
            selectedDataset: mockDataset({id: "1234"})
        });

        await actions.refreshDatasetMetadata({commit, rootState, state} as any);

        expect(commit.mock.calls[0][0]).toBe(BaselineMutation.UpdateDatasetResources);
        expect(commit.mock.calls[0][1]).toEqual({
            pjnz: mockDatasetResource({id: "2", url: "something.com", lastModified: "2020-11-03", metadataModified: "2020-11-04", name: "PJNZ resource"}),
            shape: mockDatasetResource({id: "3", url: "something.com", lastModified: "2020-11-05", metadataModified: "2020-11-06", name: "Shape resource"}),
            pop: mockDatasetResource({id: "1", url: "something.com", lastModified: "2020-11-01", metadataModified: "2020-11-02", name: "Pop resource"}),
            survey: mockDatasetResource({id: "4", url: "something.com", lastModified: "2020-11-07", metadataModified: "2020-11-08", name: "Survey resource"}),
            program: mockDatasetResource({id: "5", url: "something.com", lastModified: "2020-11-09", metadataModified: "2020-11-10", name: "Program resource"}),
            anc: mockDatasetResource({id: "6", url: "something.com", lastModified: "2020-11-11", metadataModified: "2020-11-12", name: "ANC resource"})
        });
    });

    it("refreshDatasetMetadata can handle missing resources", async () => {

        mockAxios.onGet("/adr/datasets/1234")
            .reply(200, mockSuccess({
                resources: [
                    {url: "something.com", last_modified: "2020-11-01", metadata_modified: "2020-11-02", resource_type: "random"},

                ]
            }))

        const commit = jest.fn();
        const state = mockBaselineState({
            selectedDataset: mockDataset({id: "1234"})
        });

        await actions.refreshDatasetMetadata({commit, rootState, state} as any);

        expect(commit.mock.calls[0][0]).toBe(BaselineMutation.UpdateDatasetResources);
        expect(commit.mock.calls[0][1]).toEqual({
            pjnz: null,
            shape: null,
            pop: null,
            survey: null,
            program: null,
            anc: null
        });
    });

    it("refreshDatasetMetadata does nothing if no dataset", async () => {
        const commit = jest.fn();
        const state = mockBaselineState();
        await actions.refreshDatasetMetadata({commit, rootState, state} as any);
        expect(commit.mock.calls.length).toBe(0);
    });

    it("refreshDatasetMetadata does nothing if api call fails", async () => {
        mockAxios.onGet("/adr/datasets/1234")
            .reply(500);

        const commit = jest.fn();
        const state = mockBaselineState({
            selectedDataset: mockDataset({id: "1234"})
        });
        await actions.refreshDatasetMetadata({commit, rootState, state} as any);
        expect(commit.mock.calls.length).toBe(0);
    });

});
