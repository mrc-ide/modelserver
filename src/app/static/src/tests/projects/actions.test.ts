import {mockAxios, mockFailure, mockRootState, mockSuccess, mockProjectsState, mockError} from "../mocks";
import {actions} from "../../app/store/projects/actions";
import {ProjectsMutations} from "../../app/store/projects/mutations";
import {RootMutation} from "../../app/store/root/mutations";
import {ErrorsMutation} from "../../app/store/errors/mutations";
import {Project} from "../../app/types";
import {serialiseState} from "../../app/localStorageManager";

describe("Projects actions", () => {
    beforeEach(() => {
        mockAxios.reset();
        // stop apiService logging to console
        console.log = jest.fn();
        console.info = jest.fn();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
        (console.info as jest.Mock).mockClear();
    });

    const rootState = mockRootState();

    const mockProject: Project = {
        id: 1,
        name: "testProject",
        versions: [{id: "version-id", created: "", updated: "", note: "version note", versionNumber: 1}]
    };

    it("updates CloningProject on successful clone", async () => {
        const commit = jest.fn();
        mockAxios.onPost(`/project/123/clone`)
            .reply(200, mockSuccess(null));

        await actions.cloneProject({rootState, commit} as any, {projectId: 123, emails: []});
        expect(commit.mock.calls[1][0]).toEqual({
            type: ProjectsMutations.CloningProject,
            payload: null
        });
    });

    it("sets CloneProjectError on failed clone", async () => {
        const commit = jest.fn();
        mockAxios.onPost(`/project/123/clone`)
            .reply(500, mockFailure("error"));

        await actions.cloneProject({rootState, commit} as any, {projectId: 123, emails: []});
        expect(commit.mock.calls[1][0]).toEqual({
            type: ProjectsMutations.CloneProjectError,
            payload: mockError("error")
        });
    });

    it("userExists returns true if user exists", async () => {
        mockAxios.onGet(`/user/test.user@example.com/exists`)
            .reply(200, mockSuccess(true));

        const result = await actions.userExists({rootState} as any, "test.user@example.com");
        expect(result).toBe(true);
    });

    it("userExists returns false if user does not exist", async () => {
        mockAxios.onGet(`/user/test.user@example.com/exists`)
            .reply(200, mockSuccess(false));

        const result = await actions.userExists({rootState} as any, "test.user@example.com");
        expect(result).toBe(false);
    });

    it("userExists returns false if call fails", async () => {
        mockAxios.onGet(`/user/test.user@example.com/exists`)
            .reply(400, mockError("whatever"));

        const result = await actions.userExists({rootState} as any, "test.user@example.com");
        expect(result).toBe(false);
    });

    it("createProject posts to new project endpoint and sets error on unsuccessful response", async (done) => {
        mockAxios.onPost(`/project/`)
            .reply(500, mockFailure("TestError"));

        const commit = jest.fn();
        const state = mockProjectsState({error: "TEST ERROR" as any});

        actions.createProject({commit, state, rootState} as any, "newProject");

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: ProjectsMutations.SetLoading, payload: true});

            const expectedError = {error: "OTHER_ERROR", detail: "TestError"};
            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: ProjectsMutations.ProjectError,
                payload: expectedError
            });
            done();
        });
    });

    it("createProject posts to new project endpoint and resets project with root on successful response", async (done) => {
        mockAxios.onPost(`/project/`)
            .reply(200, mockSuccess("TestProject"));

        const commit = jest.fn();
        const state = mockProjectsState();

        actions.createProject({commit, state, rootState} as any, "newProject");

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: ProjectsMutations.SetLoading, payload: true});

            const posted = mockAxios.history.post[0].data;
            expect(posted).toEqual("name=newProject");
            expect(commit.mock.calls[1][0]).toStrictEqual({type: RootMutation.SetProject, payload: "TestProject"});
            expect(commit.mock.calls[1][1]).toStrictEqual({root: true});
            done();
        });
    });

    it("gets projects and commits mutation on successful response", async (done) => {
        const testProjects = [{id: 1, name: "v1", versions: []}];
        mockAxios.onGet("/projects/")
            .reply(200, mockSuccess(testProjects));

        const commit = jest.fn();
        const state = mockProjectsState();

        actions.getProjects({commit, state, rootState} as any);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: ProjectsMutations.SetLoading, payload: true});
            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: ProjectsMutations.SetPreviousProjects,
                payload: testProjects
            });
            done();
        });
    });

    it("gets current project and commits mutation on successful response", async(done) => {
        const testProjects = [{id: 1, name: "v1", versions: []}];
        mockAxios.onGet("/project/current")
            .reply(200, mockSuccess(testProjects));

        const commit = jest.fn();
        const state = mockProjectsState();
        const rootGetters = {isGuest: false}

        actions.getCurrentProject({commit, state, rootState, rootGetters} as any);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: ProjectsMutations.SetLoading, payload: true});
            expect(commit.mock.calls[1][0]).toStrictEqual({type: ProjectsMutations.SetCurrentProject, payload: testProjects});
            expect(commit.mock.calls[2][0]).toStrictEqual({type: ProjectsMutations.SetLoading, payload: false});
            done();
        });
    });

    it("if current version, createProject uploads current version before post to new project endpoint", async (done) => {
        mockAxios.onPost(`/project/`)
            .reply(200, mockSuccess("TestProject"));
        mockAxios.onPost("/project/1/version/version-id/state/")
            .reply(200, mockSuccess("ok"));

        const commit = jest.fn();
        const state = mockProjectsState({
            currentProject: mockProject,
            currentVersion: mockProject.versions[0],
            versionUploadPending: true
        });

        actions.createProject({commit, state, rootState} as any, "newProject");

        setTimeout(() => {
            expect(mockAxios.history.post.length).toBe(2);
            expect(mockAxios.history.post[0].url).toBe("/project/1/version/version-id/state/");
            expect(mockAxios.history.post[1].url).toBe("/project/");
            done();
        });
    });

    it("gets projects and sets error on unsuccessful response", async (done) => {
        mockAxios.onGet("/projects/")
            .reply(500, mockFailure("TestError"));

        const commit = jest.fn();
        const state = mockProjectsState();

        actions.getProjects({commit, state, rootState} as any);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: ProjectsMutations.SetLoading, payload: true});
            const expectedError = {error: "OTHER_ERROR", detail: "TestError"};
            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: ProjectsMutations.ProjectError,
                payload: expectedError
            });
            done();
        });
    });

    it("gets current project and sets error on unsuccessful response", async(done) => {
        mockAxios.onGet("/project/current")
            .reply(500, mockFailure("TestError"));

        const commit = jest.fn();
        const state = mockProjectsState();
        const rootGetters = {isGuest: false}

        actions.getCurrentProject({commit, state, rootState, rootGetters} as any);

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: ProjectsMutations.SetLoading, payload: true});
            const expectedError = {error: "OTHER_ERROR", detail: "TestError"};
            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: ProjectsMutations.ProjectError,
                payload: expectedError
            });
            expect(commit.mock.calls[2][0]).toStrictEqual({type: ProjectsMutations.SetLoading, payload: false});
            done();
        });
    });

    it("uploadVersionState does nothing if no current version", async (done) => {
        const commit = jest.fn();
        const state = mockProjectsState();

        actions.uploadVersionState({commit, state, rootState} as any);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(0);
            expect(mockAxios.history.post.length).toBe(0);
            done();
        }, 2500);
    });

    it("uploadVersionState does nothing if no version upload is pending", async (done) => {
        const commit = jest.fn();
        const state = mockProjectsState({
            currentProject: mockProject,
            currentVersion: mockProject.versions[0],
            versionUploadPending: true
        });

        actions.uploadVersionState({commit, state, rootState} as any);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(0);
            expect(mockAxios.history.post.length).toBe(0);
            done();
        }, 2500);
    });

    it("uploadVersionState sets pending then unsets and uploads state, and commits VersionUploadSuccess", async (done) => {
        const commit = jest.fn();
        const state = mockProjectsState({
            currentProject: mockProject,
            currentVersion: mockProject.versions[0],
            versionUploadPending: false
        });

        const url = "/project/1/version/version-id/state/";
        mockAxios.onPost(url)
            .reply(200, mockSuccess("ok"));

        actions.uploadVersionState({commit, state, rootState} as any);
        expect(commit.mock.calls[0][0]).toStrictEqual(
            {type: ProjectsMutations.SetVersionUploadPending, payload: true});

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(3);
            expect(commit.mock.calls[1][0]).toStrictEqual(
                {type: ProjectsMutations.SetVersionUploadPending, payload: false});
            expect(commit.mock.calls[2][0].type).toStrictEqual(ProjectsMutations.VersionUploadSuccess);

            expect(mockAxios.history.post.length).toBe(1);
            expect(mockAxios.history.post[0].url).toBe(url);
            const posted = mockAxios.history.post[0].data;
            expect(JSON.parse(posted)).toStrictEqual(serialiseState(rootState));
            done();
        }, 2500);
    });

    it("uploadVersionState commits ErrorAdded on error response", async (done) => {
        const commit = jest.fn();
        const state = mockProjectsState({
            currentProject: mockProject,
            currentVersion: mockProject.versions[0],
            versionUploadPending: false
        });

        const url = "/project/1/version/version-id/state/";
        mockAxios.onPost(url)
            .reply(500, mockFailure("TEST ERROR"));

        actions.uploadVersionState({commit, state, rootState} as any);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(3);
            expect(commit.mock.calls[2][0].type).toStrictEqual(`errors/${ErrorsMutation.ErrorAdded}`);
            expect(commit.mock.calls[2][0].payload.detail).toStrictEqual("TEST ERROR");

            done();
        }, 2500);
    });

    it("newVersion uploads current version state then requests new version, commits VersionCreated", async (done) => {
        const commit = jest.fn();
        const state = mockProjectsState({
            currentProject: mockProject,
            currentVersion: mockProject.versions[0]
        });

        const stateUrl = "/project/1/version/version-id/state/";
        mockAxios.onPost(stateUrl)
            .reply(200, mockSuccess("OK"));

        const newVersion = {id: "new-version-id", note: "newVersionNote", created: "new time", updated: "new time"};
        const url = "project/1/version/?parent=version-id&note=newVersionNote";
        mockAxios.onPost(url)
            .reply(200, mockSuccess(newVersion));

        actions.newVersion({commit, state, rootState} as any, "newVersionNote");
        setTimeout(() => {
            expect(mockAxios.history.post.length).toBe(2);

            expect(mockAxios.history.post[0].url).toBe(stateUrl);
            const postedState = mockAxios.history.post[0].data;
            expect(JSON.parse(postedState)).toStrictEqual(serialiseState(rootState));

            expect(mockAxios.history.post[1].url).toBe(url);

            expect(commit.mock.calls.length).toBe(3);
            expect(commit.mock.calls[0][0].type).toBe(ProjectsMutations.SetVersionUploadPending);
            expect(commit.mock.calls[0][0].payload).toBe(false);
            expect(commit.mock.calls[1][0].type).toBe(ProjectsMutations.VersionUploadSuccess);
            expect(commit.mock.calls[2][0].type).toBe(ProjectsMutations.VersionCreated);
            expect(commit.mock.calls[2][0].payload).toStrictEqual(newVersion);

            done();
        });
    });

    it("newVersion adds error on error response", async (done) => {
        const commit = jest.fn();
        const state = mockProjectsState({
            currentProject: mockProject,
            currentVersion: mockProject.versions[0]
        });

        const stateUrl = "/project/1/version/version-id/state/";
        mockAxios.onPost(stateUrl)
            .reply(200, mockSuccess("OK"));

        const url = "project/1/version/?parent=version-id&note=versionNote";
        mockAxios.onPost(url)
            .reply(500, mockFailure("TEST ERROR"));

        actions.newVersion({commit, state, rootState} as any, "versionNote");
        setTimeout(() => {
            expect(mockAxios.history.post.length).toBe(2);

            expect(commit.mock.calls.length).toBe(3);
            expect(commit.mock.calls[2][0].type).toBe("errors/ErrorAdded");
            expect(commit.mock.calls[2][0].payload.detail).toStrictEqual("TEST ERROR");
            expect(commit.mock.calls[2][1]).toStrictEqual({root: true});

            done();
        });
    });

    it("loadVersion fetches version details and invokes load state action", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = {error: null};
        const mockVersionDetails = {state: "{}", files: "files"};
        mockAxios.onGet("project/1/version/testVersion")
            .reply(200, mockSuccess(mockVersionDetails));

        actions.loadVersion({commit, dispatch, state, rootState} as any, {projectId: 1, versionId: "testVersion"});
        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: ProjectsMutations.SetLoading, payload: true});
            expect(dispatch.mock.calls[0][0]).toBe("load/loadFromVersion");
            expect(dispatch.mock.calls[0][1]).toStrictEqual(mockVersionDetails);
            expect(dispatch.mock.calls[0][2]).toStrictEqual({root: true});
            done();
        });
    });

    it("loadVersion commits error if cannot fetch version details", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = {error: "test error"};
        mockAxios.onGet("project/1/version/testVersion")
            .reply(500, mockFailure("test error"));

        actions.loadVersion({commit, dispatch, state, rootState} as any, {projectId: 1, versionId: "testVersion"});
        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: ProjectsMutations.SetLoading, payload: true});
            const expectedError = {detail: "test error", error: "OTHER_ERROR"};
            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: ProjectsMutations.ProjectError,
                payload: expectedError
            });
            done();
        });
    });

    it("deleteProject dispatches getProjects action", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = {};
        mockAxios.onDelete("project/1")
            .reply(200, mockSuccess("OK"));

        actions.deleteProject({commit, dispatch, state, rootState} as any, 1);
        setTimeout(() => {
            expect(dispatch.mock.calls[0][0]).toBe("getProjects");
            expect(commit.mock.calls.length).toBe(0);
            done();
        });
    });

    it("deleteProject commits ProjectError on failure", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = {};
        mockAxios.onDelete("project/1")
            .reply(500, mockFailure("TEST ERROR"));
        actions.deleteProject({commit, dispatch, state, rootState} as any, 1);
        setTimeout(() => {
            const expectedError = {detail: "TEST ERROR", error: "OTHER_ERROR"};
            expect(commit.mock.calls[0][0]).toStrictEqual({
                type: ProjectsMutations.ProjectError,
                payload: expectedError
            });
            done();
        });
    });

    it("deleteProject clears current version if it is being deleted", () => {
        const commit = jest.fn();
        const state = {currentVersion: {id: "testVersion"}, currentProject: {id: 1}};
        const dispatch = jest.fn();

        mockAxios.onDelete("project/1")
            .reply(200, mockSuccess("OK"));
        actions.deleteProject({commit, dispatch, state, rootState} as any, 1);
        expect(commit.mock.calls[0][0]).toStrictEqual({type: ProjectsMutations.ClearCurrentVersion});
    });

    it("deleteVersion dispatches getProjects action", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = {};
        mockAxios.onDelete("project/1/version/testVersion")
            .reply(200, mockSuccess("OK"));

        actions.deleteVersion({commit, dispatch, state, rootState} as any, {projectId: 1, versionId: "testVersion"});
        setTimeout(() => {
            expect(dispatch.mock.calls[0][0]).toBe("getProjects");
            expect(commit.mock.calls.length).toBe(0);
            done();
        });
    });

    it("deleteVersion commits ProjectError on failure", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = {};
        mockAxios.onDelete("project/1/version/testVersion")
            .reply(500, mockFailure("TEST ERROR"));
        actions.deleteVersion({commit, dispatch, state, rootState} as any, {projectId: 1, versionId: "testVersion"});
        setTimeout(() => {
            const expectedError = {detail: "TEST ERROR", error: "OTHER_ERROR"};
            expect(commit.mock.calls[0][0]).toStrictEqual({
                type: ProjectsMutations.ProjectError,
                payload: expectedError
            });
            done();
        });
    });

    it("deleteVersion clears current version if it is being deleted", () => {
        const commit = jest.fn();
        const state = {currentVersion: {id: "testVersion"}, currentProject: {id: 1}};
        const dispatch = jest.fn();

        mockAxios.onDelete("project/1")
            .reply(200, mockSuccess("OK"));
        actions.deleteVersion({commit, dispatch, state, rootState} as any, {projectId: 1, versionId: "testVersion"});
        expect(commit.mock.calls[0][0]).toStrictEqual({type: ProjectsMutations.ClearCurrentVersion});
    });

    it("promoteVersion creates new project containing replicated version", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = mockProjectsState({
            currentProject: mockProject,
            currentVersion: mockProject.versions[0]
        });

        const stateUrl = "/project/1/version/testVersion/promote";
        mockAxios.onPost(stateUrl, "name=newProject")
            .reply(200, mockSuccess("OK"));

        const versionPayload = {
            version: {projectId: 1, versionId: "testVersion"},
            name: "newProject",
            note: "test"
        }
        actions.promoteVersion({commit, state, rootState, dispatch} as any, versionPayload);

        setTimeout(() => {
            const posted = mockAxios.history.post[0].data;
            expect(posted).toEqual("name=newProject&note=test");

            expect(commit.mock.calls.length).toBe(1);
            expect(dispatch.mock.calls[0][0]).toBe("getProjects");
            done();
        });
    });

    it("promoteVersion commits ErrorAdded on failure", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = {};
        mockAxios.onPost("project/1/version/testVersion/promote")
            .reply(500, mockFailure("TEST ERROR"));

        const versionPayload = {
            version: {projectId: 1, versionId: "testVersion"},
            name: "newProject",
            note: "new editable note"
        }
        actions.promoteVersion({commit, dispatch, state, rootState} as any, versionPayload);
        setTimeout(() => {
            const expectedError = {detail: "TEST ERROR", error: "OTHER_ERROR"};
            expect(commit.mock.calls[0][0]).toStrictEqual({
                type: `errors/${ErrorsMutation.ErrorAdded}`,
                payload: expectedError
            });
            done();
        });
    });

    it("updateVersionNote action adds/edits a project's note", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const testProjects = [{id: 1, name: "v1", versions: []}];
        const state = mockProjectsState()

        const stateUrl = "/project/1/version/version-id/note";
        mockAxios.onPost(stateUrl, "note=edit%20version%20note")
            .reply(200, mockSuccess(testProjects));

        const versionPayload = {
            version: {projectId: mockProject.id, versionId: mockProject.versions[0].id},
            note: 'edit version note'
        };

        actions.updateVersionNote({commit, dispatch, state, rootState} as any, versionPayload);

        setTimeout(() => {
            const posted = mockAxios.history.post[0].data;
            expect(posted).toEqual("note=edit%20version%20note");
            expect(dispatch.mock.calls[0][0]).toBe("getProjects");
            expect(dispatch.mock.calls.length).toBe(1);
            done();
        });
    });

    it("can update project notes", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const testProjects = [{id: 1, name: "v1", versions: []}];
        const state = mockProjectsState();

        const stateUrl = "project/1/note";
        mockAxios.onPost(stateUrl, "note=test%20project%20note")
            .reply(200, mockSuccess(testProjects));

        const projectPayload = {
            projectId: mockProject.id,
            note: "test project note"
        }
        actions.updateProjectNote({commit, dispatch, state, rootState} as any, projectPayload);
        setTimeout(() => {
            const posted = mockAxios.history.post[0].data;
            expect(posted).toEqual("note=test%20project%20note");
            expect(dispatch.mock.calls[0][0]).toBe("getProjects");
            expect(dispatch.mock.calls.length).toBe(1);
            done();
        });
    });

    it("update project notes commits Project Error on failure", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = mockProjectsState({error: "TEST ERROR" as any});

        const stateUrl = "project/1/note";
        mockAxios.onPost(stateUrl, "note=test%20project%20note")
            .reply(500, mockFailure("TestError"));

        const projectPayload = {
            projectId: 1,
            note: "test project note"
        }
        actions.updateProjectNote({commit, dispatch, state, rootState} as any, projectPayload);
        setTimeout(() => {
            const expectedError = {error: "OTHER_ERROR", detail: "TestError"};
            expect(commit.mock.calls[0][0]).toStrictEqual({
                type: `errors/${ErrorsMutation.ErrorAdded}`,
                payload: expectedError
            });
            done();
        });
    });

    it("update version notes commits Project Error on failure", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = mockProjectsState({error: "TEST ERROR" as any});

        const stateUrl = "/project/1/version/version-id/note";
        mockAxios.onPost(stateUrl, "note=test%20version%20note")
            .reply(500, mockFailure("TestError"));

        const versionPayload = {
            version: {projectId: mockProject.id, versionId: mockProject.versions[0].id},
            note: 'test version note'
        };

        actions.updateVersionNote({commit, dispatch, state, rootState} as any, versionPayload);

        setTimeout(() => {
            const expectedError = {error: "OTHER_ERROR", detail: "TestError"};
            expect(commit.mock.calls[0][0]).toStrictEqual({
                type: `errors/${ErrorsMutation.ErrorAdded}`,
                payload: expectedError
            });
            done();
        });
    });

    it("renameProject changes a project's name", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = mockProjectsState({
            currentProject: mockProject,
            currentVersion: mockProject.versions[0]
        });

        const stateUrl = "/project/1/rename";
        mockAxios.onPost(stateUrl)
            .reply(200, mockSuccess("OK"));

        const projectPayload = {
            projectId: 1,
            name: "renamedProject",
            note: "test notes"
        }
        await actions.renameProject({commit, state, rootState, dispatch} as any, projectPayload);

        const posted = mockAxios.history.post[0].data;
        expect(posted).toEqual("name=renamedProject&note=test%20notes");
        expect(commit.mock.calls.length).toBe(0);
        expect(dispatch.mock.calls[0][0]).toBe("getCurrentProject");
        expect(dispatch.mock.calls[1][0]).toBe("getProjects");
        expect(dispatch.mock.calls.length).toBe(2);
    });

    it("renameProject does not dispatch getCurrentProject if currentProject is not being renamed", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = mockProjectsState({
            currentProject: null,
            currentVersion: null
        });

        const stateUrl = "/project/1/rename";
        mockAxios.onPost(stateUrl, "name=renamedProject")
            .reply(200, mockSuccess("OK"));

        const projectPayload = {
            projectId: 1,
            name: "renamedProject"
        }
        actions.renameProject({commit, state, rootState, dispatch} as any, projectPayload);

        setTimeout(() => {
            const posted = mockAxios.history.post[0].data;
            expect(posted).toEqual("name=renamedProject");
            expect(dispatch.mock.calls[0][0]).toBe("getProjects");
            expect(dispatch.mock.calls.length).toBe(1);
            done();
        });
    });

    it("renameProject commits ErrorAdded on failure", async (done) => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = {};
        mockAxios.onPost("project/1/rename")
            .reply(500, mockFailure("TEST ERROR"));

        const projectPayload = {
            projectId: 1,
            name: "renamedProject"
        }
        actions.renameProject({commit, dispatch, state, rootState} as any, projectPayload);
        setTimeout(() => {
            const expectedError = {detail: "TEST ERROR", error: "OTHER_ERROR"};
            expect(commit.mock.calls[0][0]).toStrictEqual({
                type: `errors/${ErrorsMutation.ErrorAdded}`,
                payload: expectedError
            });
            done();
        });
    });

});
