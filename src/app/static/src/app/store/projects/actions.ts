import {RootMutation} from "../root/mutations";
import {ErrorsMutation} from "../errors/mutations";
import {ActionContext, ActionTree} from "vuex";
import {ProjectsState} from "./projects";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {ProjectsMutations} from "./mutations";
import {serialiseState} from "../../localStorageManager";
import qs from "qs";
import {CurrentProject, Project, VersionDetails, VersionIds} from "../../types";

export interface versionPayload {
    version: VersionIds,
    name?: string,
    note?: string
}

export interface projectPayload {
    projectId: number,
    name?: string,
    note?: string
}

export interface ProjectsActions {
    createProject: (store: ActionContext<ProjectsState, RootState>, name: string) => void,
    getProjects: (store: ActionContext<ProjectsState, RootState>) => void
    getCurrentProject: (store: ActionContext<ProjectsState, RootState>) => void
    uploadVersionState: (store: ActionContext<ProjectsState, RootState>) => void,
    newVersion: (store: ActionContext<ProjectsState, RootState>, note: string) => void,
    loadVersion: (store: ActionContext<ProjectsState, RootState>, version: VersionIds) => void
    deleteProject: (store: ActionContext<ProjectsState, RootState>, projectId: number) => void
    deleteVersion: (store: ActionContext<ProjectsState, RootState>, versionIds: VersionIds) => void
    promoteVersion: (store: ActionContext<ProjectsState, RootState>, versionPayload: versionPayload) => void,
    userExists: (store: ActionContext<ProjectsState, RootState>, email: string) => Promise<boolean>
    cloneProject: (store: ActionContext<ProjectsState, RootState>, payload: CloneProjectPayload) => void
    renameProject: (store: ActionContext<ProjectsState, RootState>, projectPayload: projectPayload) => void
    updateVersionNote: (store: ActionContext<ProjectsState, RootState>, versionPayload: versionPayload) => void
    updateProjectNote: (store: ActionContext<ProjectsState, RootState>, payload: projectPayload) => void
}

export interface CloneProjectPayload {
    projectId: number
    emails: string[]
}

export const actions: ActionTree<ProjectsState, RootState> & ProjectsActions = {

    // unlike most actions, rather than committing a mutation this returns a boolean
    // value which can be used directly by the caller
    async userExists(context, email) {
        const result = await api(context)
            .ignoreSuccess()
            .ignoreErrors()
            .get<boolean>(`/user/${email}/exists`);

        if (result) {
            return result.data
        } else {
            // an error occurred, probably because the email address wasn't in a valid format
            return false
        }
    },

    async cloneProject(context, payload) {
        const {commit} = context;
        commit({type: ProjectsMutations.CloningProject, payload: true});

        const emails = "emails=" + payload.emails.join(",");

        await api<ProjectsMutations, ProjectsMutations>(context)
            .withSuccess(ProjectsMutations.CloningProject)
            .withError(ProjectsMutations.CloneProjectError)
            .postAndReturn(`/project/${payload.projectId}/clone`, emails);
    },

    async createProject(context, name) {
        const {commit, state} = context;

        //Ensure we have saved the current version
        if (state.currentVersion) {
            immediateUploadVersionState(context);
        }

        commit({type: ProjectsMutations.SetLoading, payload: true});
        await api<RootMutation, ProjectsMutations>(context)
            .withSuccess(RootMutation.SetProject, true)
            .withError(ProjectsMutations.ProjectError)
            .postAndReturn<string>("/project/", qs.stringify({name}));
    },

    async getProjects(context, isLoading = true) {
        const {commit} = context;

        if (isLoading) {
            commit({type: ProjectsMutations.SetLoading, payload: true});
        }

        await api<ProjectsMutations, ProjectsMutations>(context)
            .withSuccess(ProjectsMutations.SetPreviousProjects)
            .withError(ProjectsMutations.ProjectError)
            .get<Project[]>("/projects/");
    },

    async getCurrentProject(context) {
        const {rootGetters, commit} = context;
        if (!rootGetters.isGuest) {
            commit({type: ProjectsMutations.SetLoading, payload: true});
            await api<ProjectsMutations, ProjectsMutations>(context)
                .withSuccess(ProjectsMutations.SetCurrentProject)
                .withError(ProjectsMutations.ProjectError)
                .get<CurrentProject>("/project/current");
            commit({type: ProjectsMutations.SetLoading, payload: false});
        }
    },

    async uploadVersionState(context) {
        const {state, commit} = context;
        if (state.currentVersion) {
            if (!state.versionUploadPending) {
                commit({type: ProjectsMutations.SetVersionUploadPending, payload: true});
                setTimeout(() => {
                    immediateUploadVersionState(context);
                }, 2000);
            }
        }
    },
    
    async updateVersionNote(context, versionPayload: versionPayload) {
        const {dispatch} = context
        const {projectId, versionId} = versionPayload.version
        const note = versionPayload.note

        await api<ProjectsMutations, ErrorsMutation>(context)
            .ignoreSuccess()
            .withError(`errors/${ErrorsMutation.ErrorAdded}` as ErrorsMutation, true)
            .postAndReturn(`/project/${projectId}/version/${versionId}/note`, qs.stringify({note}))
            .then(() => {
                dispatch("getProjects", false);
            });
    },

    async newVersion(context, note) {
        const {state} = context;
        await immediateUploadVersionState(context);

        const projectId = state.currentProject && state.currentProject.id;
        const versionId = state.currentVersion && state.currentVersion.id;
        api<ProjectsMutations, ErrorsMutation>(context)
            .withSuccess(ProjectsMutations.VersionCreated)
            .withError(`errors/${ErrorsMutation.ErrorAdded}` as ErrorsMutation, true)
            .postAndReturn(`project/${projectId}/version/?parent=${versionId}&note=${note}`)
    },

    async updateProjectNote(context, payload) {
        const {dispatch} = context
        const projectId = payload.projectId
        const note = payload.note
        await api<ProjectsMutations, ErrorsMutation>(context)
            .ignoreSuccess()
            .withError(`errors/${ErrorsMutation.ErrorAdded}` as ErrorsMutation, true)
            .postAndReturn(`project/${projectId}/note`, qs.stringify({note}))
            .then(() => {
                dispatch("getProjects", false);
            });
    },

    async loadVersion(context, version) {
        const {commit, dispatch, state} = context;
        commit({type: ProjectsMutations.SetLoading, payload: true});
        await api<ProjectsMutations, ProjectsMutations>(context)
            .ignoreSuccess()
            .withError(ProjectsMutations.ProjectError)
            .get<VersionDetails>(`project/${version.projectId}/version/${version.versionId}`)
            .then((response: any) => {
                if (state.error === null) {
                    dispatch("load/loadFromVersion", response.data, {root: true})
                }
            });
    },

    async deleteProject(context, projectId) {
        const {commit, dispatch, state} = context;

        if (state.currentProject && state.currentProject.id === projectId) {
            commit({type: ProjectsMutations.ClearCurrentVersion});
        }
        await api<ProjectsMutations, ProjectsMutations>(context)
            .ignoreSuccess()
            .withError(ProjectsMutations.ProjectError)
            .delete(`project/${projectId}`)
            .then(() => {
                dispatch("getProjects");
            });
    },

    async deleteVersion(context, versionIds) {
        const versionId = versionIds.versionId;
        const projectId = versionIds.projectId;
        const {commit, dispatch, state} = context;

        if (state.currentVersion && state.currentVersion.id === versionId) {
            commit({type: ProjectsMutations.ClearCurrentVersion});
        }
        await api<ProjectsMutations, ProjectsMutations>(context)
            .ignoreSuccess()
            .withError(ProjectsMutations.ProjectError)
            .delete(`project/${projectId}/version/${versionId}`)
            .then(() => {
                dispatch("getProjects");
            });
    },

    async promoteVersion(context, versionPayload: versionPayload) {
        const {state, dispatch} = context;
        const {projectId, versionId} = versionPayload.version
        const name = versionPayload.name
        const note = versionPayload.note

        await api<ProjectsMutations, ErrorsMutation>(context)
            .ignoreSuccess()
            .withError(`errors/${ErrorsMutation.ErrorAdded}` as ErrorsMutation, true)
            .postAndReturn(`/project/${projectId}/version/${versionId}/promote`, qs.stringify({name, note}))
            .then(() => {
                dispatch("getProjects");
            });
    },

    async renameProject(context, projectPayload: projectPayload) {
        const {state, dispatch} = context;
        const {projectId, name, note} = projectPayload

        await api<ProjectsMutations, ErrorsMutation>(context)
            .ignoreSuccess()
            .withError(`errors/${ErrorsMutation.ErrorAdded}` as ErrorsMutation, true)
            .postAndReturn(`/project/${projectId}/rename`, qs.stringify({name: name, note: note}))
            .then(() => {
                if (state.currentProject && state.currentProject.id === projectId) {
                    dispatch("getCurrentProject")
                }
                dispatch("getProjects");
            });
    }
};

async function immediateUploadVersionState(context: ActionContext<ProjectsState, RootState>) {
    const {state, commit, rootState} = context;
    commit({type: ProjectsMutations.SetVersionUploadPending, payload: false});
    const projectId = state.currentProject && state.currentProject.id;
    const versionId = state.currentVersion && state.currentVersion.id;
    if (projectId && versionId) {
        await api<ProjectsMutations, ErrorsMutation>(context)
            .withSuccess(ProjectsMutations.VersionUploadSuccess)
            .withError(`errors/${ErrorsMutation.ErrorAdded}` as ErrorsMutation, true)
            .postAndReturn(`/project/${projectId}/version/${versionId}/state/`, serialiseState(rootState));
    }
}
