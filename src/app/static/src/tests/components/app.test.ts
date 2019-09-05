import {createLocalVue, mount} from '@vue/test-utils';
import Vuex from 'vuex';
import {mockAxios, mockSuccess, mockSurveyAndProgramState} from "../mocks";
import {mockBaselineState} from "../mocks";
import {mutations} from "../../app/store/baseline/mutations";

const localVue = createLocalVue();
localVue.use(Vuex);

// mock requests made by the root vue instance before it is imported
mockAxios.onGet(`/baseline/`)
    .reply(200, mockSuccess({pjnz: null}));

import {app} from "../../app"
import {baselineGetters} from "../../app/store/baseline/baseline";
import {surveyAndProgramGetters} from "../../app/store/surveyAndProgram/surveyAndProgram";

describe("App", () => {

    const actions = {
        uploadPJNZ: jest.fn(),
        getBaselineData: jest.fn()
    };

    const store = new Vuex.Store({
        modules: {
            baseline: {
                namespaced: true,
                state: mockBaselineState(),
                actions: {...actions},
                mutations: {...mutations},
                getters: {...baselineGetters}
            },
            surveyAndProgram: {
                namespaced: true,
                state: mockSurveyAndProgramState(),
                getters: {...surveyAndProgramGetters}
            },
            selectedData: {
                namespaced: true,
                state: {state: null},
            }
        }
    });

    it("loads baseline data on mount", (done) => {

        let c = app.$options;
        mount({
            beforeMount: c.beforeMount,
            methods: c.methods,
            render: c.render
        }, {store});

        setTimeout(() => {
            expect(actions.getBaselineData).toHaveBeenCalled();
            done();
        });
    })
});