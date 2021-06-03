import {ProjectsState} from "../../../app/store/projects/projects";
import Vuex from "vuex";
import Vue from "vue";
import {mockProjectsState} from "../../mocks";
import {shallowMount} from "@vue/test-utils";
import Projects from "../../../app/components/projects/Projects.vue";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";
import {expectTranslated} from "../../testHelpers";

describe("Projects component", () => {

    const createSut = (state: Partial<ProjectsState> = {},
                       mockCreateProject = jest.fn(),
                       mockRouterPush = jest.fn(),
                       isGuest = false) => {

        const store = new Vuex.Store({
            state: emptyState(),
            getters: {
                isGuest: () => isGuest
            },
            modules: {
                projects: {
                    namespaced: true,
                    state: mockProjectsState(state),
                    actions: {
                        createProject: mockCreateProject,
                        getProjects: jest.fn()
                    }
                }
            },
        });
        registerTranslations(store);

        const mocks = {
            $router: {
                push: mockRouterPush
            }
        };

        return shallowMount(Projects, {store, mocks});
    };

    const currentProject = {name: "existingProject", id: 1, versions: []};
    const previousProjects = ["TEST PREVIOUS VERSION"] as any;

    it("renders as expected with no current project", () => {
        const wrapper = createSut({previousProjects});
        const store = wrapper.vm.$store;
        expect(wrapper.find(LoadingSpinner).exists()).toBe(false);
        expect(wrapper.find("#projects-content").exists()).toBe(true);

        expectTranslated(wrapper.find("#projects-header"), "Create a new project",
            "Créer un nouveau projet", store);
        expectTranslated(wrapper.find("p"), "Your work is organised into projects. Each project contains its own data and settings.",
            "Votre travail est organisé en projets. Chaque projet contient ses propres données et paramètres.", store);
        expectTranslated(wrapper.find("input"), "Project name",
            "Nom du projet", store, "placeholder");
        expectTranslated(wrapper.find("button"), "Create project",
            "Créer un projet", store);
        expect(wrapper.find("button").attributes("disabled")).toBe("disabled");
        expect(wrapper.find(ErrorAlert).exists()).toBe(false);
    });

    it("renders as expected with current project", () => {
        const wrapper = createSut({currentProject});
        const store = wrapper.vm.$store;

        expectTranslated(wrapper.find("p"), "Your work is organised into projects. Each project contains its own data and settings.",
            "Votre travail est organisé en projets. Chaque projet contient ses propres données et paramètres.", store);
        expectTranslated(wrapper.find("#projects-header"),
            "Create a new project or return to current project (existingProject)",
            "Créer un nouveau projet ou retour au projet actuel (existingProject)", store);
        expect(wrapper.find("#projects-header a").exists()).toBe(true);
    });

    it("enables create project button when project name is entered", () => {
        const wrapper = createSut();
        wrapper.find("input").setValue("newProject");
        expect(wrapper.find("button").attributes("disabled")).toBeUndefined();
        expect(wrapper.findAll(".invalid-feedback").length).toBe(0);
    });

    it("can create a new project when enter key is pressed", () => {
        const mockCreateProject = jest.fn();
        const wrapper = createSut({}, mockCreateProject);
        const input = wrapper.find("input")

        input.setValue("newProject with enter key");
        expect(wrapper.find("button").attributes("disabled")).toBeUndefined();
        input.trigger("keyup.enter")

        expect(mockCreateProject.mock.calls.length).toBe(1);
        expect(mockCreateProject.mock.calls[0][1]).toBe("newProject with enter key");
    });

    it("shows invalid feedback if name is non unique", () => {
        const wrapper = createSut({previousProjects: [{name: "p1", id: 123, versions: []}]});
        wrapper.find("input").setValue("p1");
        expect(wrapper.find("button").attributes("disabled")).toBe("disabled");
        expect(wrapper.findAll(".invalid-feedback").length).toBe(1);
    });

    it("displays error if any", () => {
        const error = {error: "error", detail: "detail"};
        const wrapper = createSut({error});
        expect(wrapper.find(ErrorAlert).props()["error"]).toBe(error);
    });

    it("clicking create project button invokes action", () => {
        const mockCreateProject = jest.fn();
        const wrapper = createSut({}, mockCreateProject);
        wrapper.find("input").setValue("newProject");
        wrapper.find("button").trigger("click");

        expect(mockCreateProject.mock.calls.length).toBe(1);
        expect(mockCreateProject.mock.calls[0][1]).toBe("newProject");
    });

    it("clicking back to current project link invokes router", () => {
        const mockRouterPush = jest.fn();
        const wrapper = createSut({currentProject}, jest.fn(), mockRouterPush);

        wrapper.find("#projects-header a").trigger("click");

        expect(mockRouterPush.mock.calls.length).toBe(1);
        expect(mockRouterPush.mock.calls[0][0]).toStrictEqual("/");
    });

    it("displays spinner if loading", () => {
        const wrapper = createSut({loading: true});
        expect(wrapper.find(LoadingSpinner).exists()).toBe(true);
        expect(wrapper.find("#projects-content").exists()).toBe(false);
    });

});
