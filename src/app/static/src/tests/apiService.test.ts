import {api} from "../app/apiService";
import {mockAxios, mockFailure, mockSuccess} from "./mocks";
import {freezer} from '../app/utils';

describe("ApiService", () => {

    beforeEach(() => {
        console.log = jest.fn();
        console.warn = jest.fn();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
        (console.warn as jest.Mock).mockClear();
    });

    it("console logs error", async () => {
        mockAxios.onGet(`/baseline/`)
            .reply(500, mockFailure("some error message"));

        try {
            await api(jest.fn())
                .get("/baseline/")
        } catch (e) {

        }
        expect((console.warn as jest.Mock).mock.calls[0][0])
            .toBe("No error handler registered for request /baseline/.");
        expect((console.log as jest.Mock).mock.calls[0][0].errors[0].detail)
            .toBe("some error message");
    });

    it("commits the the first error message to errors module by default", async () => {

        mockAxios.onGet(`/unusual/`)
            .reply(500, mockFailure("some error message"));

        const commit = jest.fn();

        await api(commit)
            .get("/unusual/");

        expect((console.warn as jest.Mock).mock.calls[0][0])
            .toBe("No error handler registered for request /unusual/.");

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]).toStrictEqual({type: `errors/ErrorAdded`, payload: "some error message"});
        expect(commit.mock.calls[0][1]).toStrictEqual({root: true});
    });

    it("if no first error message, commits a default error message to errors module by default", async () => {

        const failure = {
            data: {},
            status: "failure",
            errors: []
        };
        mockAxios.onGet(`/unusual/`)
            .reply(500, failure);

        const commit = jest.fn();

        await api(commit)
            .get("/unusual/");

        expect((console.warn as jest.Mock).mock.calls[0][0])
            .toBe("No error handler registered for request /unusual/.");

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: `errors/ErrorAdded`,
            payload: "API response failed but did not contain any error information. Please contact support."
        });
        expect(commit.mock.calls[0][1]).toStrictEqual({root: true});
    });

    it("commits the first error with the specified type if well formatted", async () => {

        mockAxios.onGet(`/baseline/`)
            .reply(500, mockFailure("some error message"));

        let committedType: any = false;
        let committedPayload: any = false;

        const commit = ({type, payload}: any) => {
            committedType = type;
            committedPayload = payload;
        };

        await api(commit as any)
            .withError("TEST_TYPE")
            .get("/baseline/");

        expect(committedType).toBe("TEST_TYPE");
        expect(committedPayload).toBe("some error message");
    });

    it("commits the error type if the error detail is missing", async () => {

        mockAxios.onGet(`/baseline/`)
            .reply(500, mockFailure(null as any));

        let committedType: any = false;
        let committedPayload: any = false;

        const commit = ({type, payload}: any) => {
            committedType = type;
            committedPayload = payload;
        };

        await api(commit as any)
            .withError("TEST_TYPE")
            .get("/baseline/");

        expect(committedType).toBe("TEST_TYPE");
        expect(committedPayload).toBe("OTHER_ERROR");
    });

    it("commits the success response with the specified type", async () => {

        mockAxios.onGet(`/baseline/`)
            .reply(200, mockSuccess(true));

        let committedType: any = false;
        let committedPayload: any = false;
        const commit = ({type, payload}: any) => {
            committedType = type;
            committedPayload = payload;
        };

        await api(commit as any)
            .withSuccess("TEST_TYPE")
            .get("/baseline/");

        expect(committedType).toBe("TEST_TYPE");
        expect(committedPayload).toBe(true);
    });

    it("returns the response object", async () => {

        mockAxios.onGet(`/baseline/`)
            .reply(200, mockSuccess("TEST"));

        const commit = jest.fn();
        const response = await api(commit as any)
            .withSuccess("TEST_TYPE")
            .get("/baseline/");

        expect(response).toStrictEqual({data: "TEST", errors: [], status: "success"});
    });

    it("deep freezes the response object if requested", async () => {

        const fakeData = {name: "d1"};
        mockAxios.onGet(`/baseline/`)
            .reply(200, mockSuccess(fakeData));

        const spy = jest.spyOn(freezer, "deepFreeze");

        let committedType: any = false;
        let committedPayload: any = false;
        const commit = ({type, payload}: any) => {
            committedType = type;
            committedPayload = payload;
        };

        await api(commit as any)
            .freezeResponse()
            .withSuccess("TEST_TYPE")
            .get("/baseline/");

        expect(committedType).toBe("TEST_TYPE");
        expect(Object.isFrozen(committedPayload)).toBe(true);
        expect(spy.mock.calls[0][0]).toStrictEqual(fakeData);
    });

    it("does not deep freeze the response object if not requested", async () => {

        const fakeData = {name: "d1"};
        mockAxios.onGet(`/baseline/`)
            .reply(200, mockSuccess(fakeData));

        const spy = jest.spyOn(freezer, "deepFreeze");

        let committedType: any = false;
        let committedPayload: any = false;
        const commit = ({type, payload}: any) => {
            committedType = type;
            committedPayload = payload;
        };

        await api(commit as any)
            .withSuccess("TEST_TYPE")
            .get("/baseline/");

        expect(committedType).toBe("TEST_TYPE");
        expect(Object.isFrozen(committedPayload)).toBe(false);
        expect(spy.mock.calls[0][0]).toStrictEqual(fakeData);
    });

    it("throws error if API response is null", async () => {

        mockAxios.onGet(`/baseline/`)
            .reply(500);

        await expectCouldNotParseAPIResponseError();
    });

    it("throws error if API response status is missing", async () => {

        mockAxios.onGet(`/baseline/`)
            .reply(500, {data: {}, errors: []});

        await expectCouldNotParseAPIResponseError();
    });

    it("throws error if API response errors are missing", async () => {

        mockAxios.onGet(`/baseline/`)
            .reply(500, {data: {}, status: "failure"});

        await expectCouldNotParseAPIResponseError();
    });

    it("does nothing on error if ignoreErrors is true", async () => {

        mockAxios.onGet(`/baseline/`)
            .reply(500, mockFailure("some error message"));

        await api(jest.fn())
            .withSuccess("whatever")
            .ignoreErrors()
            .get("/baseline/");

        expect((console.warn as jest.Mock).mock.calls.length).toBe(0);
    });

    it("warns if error and success handlers are not set", async () => {

        mockAxios.onGet(`/baseline/`)
            .reply(200, mockSuccess(true));

        await api(jest.fn())
            .get("/baseline/");

        const warnings = (console.warn as jest.Mock).mock.calls;

        expect(warnings[0][0]).toBe("No error handler registered for request /baseline/.");
        expect(warnings[1][0]).toBe("No success handler registered for request /baseline/.");
    });

    async function expectCouldNotParseAPIResponseError() {
        const commit = jest.fn();
        await api(commit)
            .get("/baseline/");

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: `errors/ErrorAdded`,
            payload: "Could not parse API response. Please contact support."
        });
        expect(commit.mock.calls[0][1]).toStrictEqual({root: true});
    }

});
