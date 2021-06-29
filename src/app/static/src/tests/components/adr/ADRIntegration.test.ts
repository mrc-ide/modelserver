import {Error} from "../../../app/generated";
import Vuex, {ActionTree} from "vuex";
import {
    mockADRState,
    mockBaselineState,
    mockDatasetResource,
    mockRootState
} from "../../mocks";
import {ADRActions} from "../../../app/store/adr/actions";
import {RootState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {shallowMount} from "@vue/test-utils";
import ADRKey from "../../../app/components/adr/ADRKey.vue";
import ADRIntegration from "../../../app/components/adr/ADRIntegration.vue";
import SelectDataset from "../../../app/components/adr/SelectDataset.vue";
import {ADRMutation, mutations} from "../../../app/store/adr/mutations";
import {getters} from "../../../app/store/root/getters";
import {ADRState} from "../../../app/store/adr/adr";
import {prefixNamespace} from "../../../app/utils";
import {Language} from "../../../app/store/translations/locales";
import {expectTranslated} from "../../testHelpers";
import {BaselineState} from "../../../app/store/baseline/baseline";

describe("adr integration", () => {

    const fetchKeyStub = jest.fn();
    const getDataStub = jest.fn();
    const getUserCanUploadStub = jest.fn()

    const fakeDataset = {
        id: "id1",
        title: "Some data",
        url: "www.adr.com/naomi-data/some-data",
        organization: {id: "org-id"},
        resources: {
            pjnz: null,
            program: null,
            pop: null,
            survey: null,
            shape: mockDatasetResource({
                url: "shape.geojson",
                lastModified: "2020-11-03",
                metadataModified: "2020-11-04"
            }),
            anc: null
        }
    }

    const createStore = (key: string = "", error: Error | null = null,
                         partialRootState: Partial<RootState> = {},
                         canUpload = false,
                         baselineState?: Partial<BaselineState>) => {
        const store = new Vuex.Store({
            state: mockRootState({...partialRootState}),
            modules: {
                adr: {
                    namespaced: true,
                    state: mockADRState({key, keyError: error, userCanUpload: canUpload}),
                    actions: {
                        getDatasets: getDataStub,
                        fetchKey: fetchKeyStub,
                        getUserCanUpload: getUserCanUploadStub,
                    } as Partial<ADRActions> & ActionTree<ADRState, RootState>,
                    mutations
                },
                baseline: {
                    namespaced: true,
                    state: mockBaselineState(baselineState),
                }
            },
            getters: getters
        });
        registerTranslations(store);
        return store;
    }

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("does not render if not logged in", () => {
        const store = createStore('', null, {currentUser: 'guest'});
        const rendered = shallowMount(ADRIntegration, {store});
        expect(rendered.findAll("div").length).toBe(0);
    });

    it("fetches ADR key if logged in", () => {
        shallowMount(ADRIntegration, {store: createStore()});
        expect(fetchKeyStub.mock.calls.length).toBe(1);
    });

    it("does not fetch ADR key if not logged in", () => {
        const store = createStore('', null, {currentUser: 'guest'})
        shallowMount(ADRIntegration, {store});
        expect(fetchKeyStub.mock.calls.length).toBe(0);
    });

    it("renders adr-key widget", () => {
        const rendered = shallowMount(ADRIntegration, {store: createStore()});
        expect(rendered.findAll(ADRKey).length).toBe(1);
    });

    it("does not render select dataset widget if key is not present", () => {
        const rendered = shallowMount(ADRIntegration, {store: createStore()});
        expect(rendered.findAll(SelectDataset).length).toBe(0);
    });

    it("renders select dataset widget if key is present", () => {
        const rendered = shallowMount(ADRIntegration, {store: createStore("123")});
        expect(rendered.findAll(SelectDataset).length).toBe(1);
    });

    it("fetches datasets when key changes", () => {
        const store = createStore();
        shallowMount(ADRIntegration, {store});
        store.commit(prefixNamespace("adr", ADRMutation.UpdateKey),"123");
        expect(getDataStub.mock.calls.length).toBe(1);
    });

    it("renders adr-access text for writers as expected", () => {
        const mockTooltip = jest.fn()
        const renders = shallowMount(ADRIntegration,
            {
                store: createStore("123",
                    null, {}, true, {selectedDataset: fakeDataset}),
                directives: {"tooltip": mockTooltip}
            });
        const store = renders.vm.$store
        expect(renders.findAll(ADRKey).length).toBe(1);
        const spans = (renders.find("#adr-capacity").findAll("span"))

        expectTranslated(spans.at(0), "ADR access level:", "Niveau d'accès ADR:", store)
        expectTranslated(spans.at(1), "Read & Write", "Lecture et écriture", store)
        expect(mockTooltip.mock.calls[0][1].value).toBe("You have read and write permissions for this dataset and may push output files to ADR");
    });

    it("renders adr-access text for readers as expected", () => {
        const mockTooltip = jest.fn()
        const renders = shallowMount(ADRIntegration,
            {
                store: createStore("123",
                    null, {}, false, {selectedDataset: fakeDataset}),
                directives: {"tooltip": mockTooltip}
            });
        const store = renders.vm.$store
        expect(renders.findAll(ADRKey).length).toBe(1);
        const spans = (renders.find("#adr-capacity").findAll("span"))

        expectTranslated(spans.at(0), "ADR access level:", "Niveau d'accès ADR:", store)
        expectTranslated(spans.at(1), "Read only", "Lecture seule", store)
        expect(mockTooltip.mock.calls[0][1].value).toBe("You do not currently have write permissions for this dataset and will be unable to upload files to ADR");
    });

    it("renders Tooltip text for writers as expected in French", () => {
        const store = createStore("123", null, {}, true, {selectedDataset: fakeDataset})
        store.state.language = Language.fr
        const mockTooltip = jest.fn()
        shallowMount(ADRIntegration,
            {
                store,
                directives: {"tooltip": mockTooltip}
            })
        expect(mockTooltip.mock.calls[0][1].value).toBe("Vous bénéficiez des droits de lecture et d’écriture pour cet ensemble de données et vous pouvez envoyer les fichiers de sortie vers le ADR");
    });

    it("renders Tooltip text for readers as expected in French", () => {
        const store = createStore("123", null, {}, false, {selectedDataset: fakeDataset})
        store.state.language = Language.fr
        const mockTooltip = jest.fn()
        shallowMount(ADRIntegration,
            {
                store,
                directives: {"tooltip": mockTooltip}
            })
        expect(mockTooltip.mock.calls[0][1].value).toBe("Vous ne disposez actuellement d’aucun droit d’écriture pour cet ensemble de données et vous ne pourrez pas télécharger de fichiers vers le ADR");
    });

    it("call getUserCanUpload action if key is provided", async() => {
        const store = createStore("123", null, {})
        shallowMount(ADRIntegration, {store});
        store.state.baseline.selectedDataset = fakeDataset
        expect(getUserCanUploadStub.mock.calls.length).toBe(1);
    });

    it("does not render permission displayText if dataset is not selected", async() => {
        const store = createStore("123", null, {})
        const renders = shallowMount(ADRIntegration, {store});
        expect(renders.find("#adr-capacity").exists()).toBeFalsy()
    });
});
