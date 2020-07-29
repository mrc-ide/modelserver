import {mockVersionsState} from "../mocks";
import {mutations, VersionsMutations} from "../../app/store/versions/mutations";

describe("Versions mutations", () => {
    it("sets manageVersions", () => {
        const state = mockVersionsState();

        mutations[VersionsMutations.SetManageVersions](state, {payload: true});
        expect(state.manageVersions).toBe(true);

        mutations[VersionsMutations.SetManageVersions](state, {payload: false});
        expect(state.manageVersions).toBe(false);
    });

    it("sets loading", () => {
        const state = mockVersionsState();

        mutations[VersionsMutations.SetLoading](state, {payload: true});
        expect(state.loading).toBe(true);

        mutations[VersionsMutations.SetLoading](state, {payload: false});
        expect(state.loading).toBe(false);
    });

    it ("sets error", () => {
        const state = mockVersionsState({loading: true});

        const error = {error: "error", detail: "detail"};
        mutations[VersionsMutations.VersionError](state, {payload: error});

        expect(state.error).toBe(error);
        expect(state.loading).toBe(false);
    });
});