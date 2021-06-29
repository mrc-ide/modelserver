import Vue from "vue";
import {mount, Wrapper} from "@vue/test-utils";
import ResetConfirmation from "../../app/components/ResetConfirmation.vue";
import LoadingSpinner from "../../app/components/LoadingSpinner.vue";
import Vuex from "vuex";
import registerTranslations from "../../app/store/translations/registerTranslations";
import {RootState} from "../../app/root";
import {mockErrorsState, mockProjectsState, mockRootState} from "../mocks";
import {mutations as versionsMutations} from "../../app/store/projects/mutations";
import {mutations as errorMutations} from "../../app/store/errors/mutations";
import {getters} from "../../app/store/root/getters";
import {expectTranslated} from "../testHelpers";

const createStore = (newVersion = jest.fn(), partialRootState: Partial<RootState> = {}, partialStepperGetters = {}) => {
    const store = new Vuex.Store({
        state: mockRootState(partialRootState),
        getters: getters,
        modules: {
            stepper: {
                namespaced: true,
                getters: {
                    changesToRelevantSteps: () => [{number: 2, textKey: "uploadSurvey"},
                        {number: 3, textKey: "modelOptions"},
                        {number: 4, textKey: "fitModel"}],
                    ...partialStepperGetters
                }
            },
            errors: {
                namespaced: true,
                state: mockErrorsState(),
                mutations: errorMutations
            },
            projects: {
                namespaced: true,
                state: mockProjectsState({currentProject: {id: 1, name: "v1", note: "test note", versions: []},
                    currentVersion: {id: "version1", created: "", note: "textarea value", updated: "", versionNumber: 1}}),
                actions: {
                    newVersion
                },
                mutations: versionsMutations
            }
        }
    });
    registerTranslations(store);
    return store;
};

describe("Reset confirmation modal", () => {

    it("renders as expected for guest user", () => {
        const store = createStore(jest.fn(), {currentUser: 'guest'});
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: jest.fn(),
                cancelEditing: jest.fn()
            },
            store
        });

        expectTranslated(rendered.find("h4"), "Have you saved your work?",
            "Avez-vous sauvegardé votre travail ?", store);
        expectTranslated(rendered.findAll("p").at(0),
            "Changing this will result in the following steps being discarded:",
            "Si vous modifiez ce paramètre, les étapes suivantes seront abandonnées :", store);
        expectTranslated(rendered.findAll("p").at(1),
            "You may want to save your work before continuing.",
            "Vous devriez peut-être sauvegarder votre travail avant de poursuivre.", store);

        expectRenderedSteps(rendered);

        const buttons = rendered.findAll("button");
        expectTranslated(buttons.at(0), "Discard these steps and keep editing",
            "Ignorer ces étapes et poursuivre la modification", store);
        expectTranslated(buttons.at(1), "Cancel editing so I can save my work",
            "Annuler l'édition pour que je puisse sauvegarder mon travail", store);

        expect(rendered.find(LoadingSpinner).exists()).toBe(false);
    });

    it("renders as expected for logged in user", () => {
        const store = createStore();
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: jest.fn(),
                cancelEditing: jest.fn()
            },
            store
        });

        expectTranslated(rendered.find("h4"), "Save version?",
            "Sauvegarder la version?", store);
        expectTranslated(rendered.findAll("p").at(0),
            "Changing this will result in the following steps being discarded:",
            "Si vous modifiez ce paramètre, les étapes suivantes seront abandonnées :", store);
        expectTranslated(rendered.findAll("p").at(1),
            "These steps will automatically be saved in a version. You will be able to reload this version from the Projects page.",
            "Ces étapes seront automatiquement sauvegardées dans une version. Vous pourrez recharger cette version depuis la page Projets.",
            store);

        expectRenderedSteps(rendered);

        const buttons = rendered.findAll("button");
        expectTranslated(buttons.at(0), "Save version and keep editing",
            "Sauvegarder la version et continuer à modifier", store);
        expectTranslated(buttons.at(1), "Cancel editing", "Annuler l'édition", store);

        expect(rendered.find(LoadingSpinner).exists()).toBe(false);
    });

    it("renders as expected for someone rerunning the model", () => {
        const stepperGetter = {
            changesToRelevantSteps: () => [
                {number: 4, textKey: "fitModel"}]}
        const store = createStore(jest.fn(), {}, stepperGetter);
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: jest.fn(),
                cancelEditing: jest.fn()
            },
            store
        });

        expectRenderedModelRunSteps(rendered);
    });

    it("cancel edit button invokes cancelEditing", () => {
        const mockCancelEdit = jest.fn();
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: jest.fn(),
                cancelEditing: mockCancelEdit
            },
            store: createStore()
        });

        rendered.findAll("button").at(1).trigger("click");
        expect(mockCancelEdit.mock.calls.length).toBe(1);
    });

    it("continue button invokes continueEditing for guest user", () => {
        const mockContinueEdit = jest.fn();
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: mockContinueEdit,
                cancelEditing: jest.fn()
            },
            store: createStore(jest.fn(), {currentUser: 'guest'})
        });

        rendered.findAll("button").at(0).trigger("click");
        expect(mockContinueEdit.mock.calls.length).toBe(1);
    });

    it("can render translated version note label", () => {

        const mockContinueEdit = jest.fn();
        const mockNewVersion = jest.fn();
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: mockContinueEdit,
                cancelEditing: jest.fn()
            },
            store: createStore(mockNewVersion, {currentUser: 'test.user@example.com'})
        });

        const store = rendered.vm.$store
        const noteLabel = rendered.find("#noteHeader label")
        expectTranslated(noteLabel, "Notes: (your reason for saving as a new version)",
            "Notes : (votre motif pour sauvegarder en tant que nouvelle version)", store)
    });

    it("can set and get note value", async () => {

        const mockContinueEdit = jest.fn();
        const mockNewVersion = jest.fn();
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: mockContinueEdit,
                cancelEditing: jest.fn()
            },
            store: createStore(mockNewVersion, {currentUser: 'test.user@example.com'})
        });

        await rendered.setProps({open: true});
        const textarea = rendered.find("#resetVersionNoteControl").element as HTMLTextAreaElement;
        expect(textarea.value).toBe("textarea value");
    });

    it("can set note value and invokes newVersion action for logged in user", async () => {
        const mockContinueEdit = jest.fn();
        const mockNewVersion = jest.fn();
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: mockContinueEdit,
                cancelEditing: jest.fn()
            },
            store: createStore(mockNewVersion, {currentUser: 'test.user@example.com'})
        });

        rendered.find("#resetVersionNoteControl").setValue("new Value")
        rendered.findAll("button").at(0).trigger("click");

        expect(mockContinueEdit.mock.calls.length).toBe(0);
        expect((rendered.vm as any).waitingForVersion).toBe(true);
        expect(mockNewVersion.mock.calls.length).toBe(1);
        expect(mockNewVersion.mock.calls[0][1]).toBe("new%20Value");
    });

    it("continue button sets waitingForVersion to true and invokes newVersion action for logged in user", () => {

        const mockContinueEdit = jest.fn();
        const mockNewVersion = jest.fn();
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: mockContinueEdit,
                cancelEditing: jest.fn()
            },
            store: createStore(mockNewVersion, {currentUser: 'test.user@example.com'})
        });

        expect((rendered.vm as any).waitingForVersion).toBe(false);

        rendered.findAll("button").at(0).trigger("click");

        expect(mockContinueEdit.mock.calls.length).toBe(0);
        expect((rendered.vm as any).waitingForVersion).toBe(true);
        expect(mockNewVersion.mock.calls.length).toBe(1);
    });

    it("when currentVersion changes, sets waitingForVersion to false and invokes continue editing, if waitingForVersion is true", async () => {
        const mockContinueEditing = jest.fn();
        const rendered = mount(ResetConfirmation, {
            data() {
                return {
                    waitingForVersion: true
                };
            },
            propsData: {
                continueEditing: mockContinueEditing,
                cancelEditing: jest.fn()
            },
            store: createStore()
        });

        rendered.vm.$store.commit("projects/VersionCreated", {id: "newVersionId"});
        await Vue.nextTick();

        expect((rendered.vm as any).waitingForVersion).toBe(false);
        expect(mockContinueEditing.mock.calls.length).toBe(1);
    });

    it("when error added, sets waitingForVersion to false and invokes cancel editing, if waitingForVersion is true", async () => {
        const mockCancelEditing = jest.fn();
        const rendered = mount(ResetConfirmation, {
            data() {
                return {
                    waitingForVersion: true
                };
            },
            propsData: {
                continueEditing: jest.fn(),
                cancelEditing: mockCancelEditing
            },
            store: createStore()
        });

        rendered.vm.$store.commit("errors/ErrorAdded", "TEST ERROR");
        await Vue.nextTick();

        expect((rendered.vm as any).waitingForVersion).toBe(false);
        expect(mockCancelEditing.mock.calls.length).toBe(1);
    });

    it("when currentVersion changes, does nothing if waitingForVersion is false", async () => {
        const mockContinueEditing = jest.fn();
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: mockContinueEditing,
                cancelEditing: jest.fn()
            },
            store: createStore()
        });

        rendered.vm.$store.commit("projects/VersionCreated", {id: "newVersionId"});
        await Vue.nextTick();

        expect((rendered.vm as any).waitingForVersion).toBe(false);
        expect(mockContinueEditing.mock.calls.length).toBe(0);
    });

    it("when errorAdded, does nothing if waitingForVersion is false", async () => {
        const mockCancelEditing = jest.fn();
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: jest.fn(),
                cancelEditing: mockCancelEditing
            },
            store: createStore()
        });

        rendered.vm.$store.commit("errors/ErrorAdded", "TEST ERROR");
        await Vue.nextTick();

        expect((rendered.vm as any).waitingForVersion).toBe(false);
        expect(mockCancelEditing.mock.calls.length).toBe(0);
    });

    it("renders spinner in place of buttons when waiting for version", () => {
        const rendered = mount(ResetConfirmation, {
            data() {
                return {
                    waitingForVersion: true
                };
            },
            propsData: {
                continueEditing: jest.fn(),
                cancelEditing: jest.fn()
            },
            store: createStore()
        });

        expect(rendered.find("button").exists()).toBe(false);
        expect(rendered.find(LoadingSpinner).props("size")).toBe("sm");
        expect(rendered.find("#spinner-text").text()).toBe("Saving version");
    });

    const expectRenderedSteps = (rendered: Wrapper<any>) => {
        const store = rendered.vm.$store;
        const steps = rendered.findAll("li");
        expect(steps.length).toBe(3);
        expectTranslated(steps.at(0), "Step 2: Upload survey and programme data",
            "Étape 2: Télécharger les données d'enquête et de programme", store);
        expectTranslated(steps.at(1), "Step 3: Model options",
            "Étape 3: Options des modèles", store);
        expectTranslated(steps.at(2), "Step 4: Fit model",
            "Étape 4: Ajuster le modèle", store);
    };

    const expectRenderedModelRunSteps = (rendered: Wrapper<any>) => {
        const store = rendered.vm.$store;
        const steps = rendered.findAll("li");
        expect(steps.length).toBe(1);
        expectTranslated(steps.at(0), "Step 4: Fit model",
            "Étape 4: Ajuster le modèle", store);
    };

});
