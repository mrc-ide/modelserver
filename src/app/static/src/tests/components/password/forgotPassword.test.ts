import {createLocalVue, mount, shallowMount} from "@vue/test-utils";
import ForgotPassword from "../../../app/components/password/ForgotPassword.vue";
import {PasswordState} from "../../../app/store/password/password";
import {PasswordActions} from "../../../app/store/password/actions";
import Vuex, {Store} from "vuex";
import {mockError, mockPasswordState} from "../../mocks";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";
import {expectTranslatedText} from "../../testHelpers";
import init from "../../../app/store/translations/init";
import {Language} from "../../../app/store/translations/locales";

const localVue = createLocalVue();

describe("Forgot password component", () => {

    let actions: jest.Mocked<PasswordActions>;

    const createStore = (passwordState?: Partial<PasswordState>) => {
        actions = {
            requestResetLink: jest.fn(),
            resetPassword: jest.fn()
        };

        const store = new Vuex.Store({
            state: mockPasswordState(passwordState),
            actions: {...actions},
            mutations: {}
        });
        init(store);
        return store;
    };

    const createSut = (store: Store<PasswordState>) => {
        return shallowMount(ForgotPassword, {store, localVue});
    };

    it("renders form with no error", () => {
        const store = createStore({
            resetLinkRequested: false,
            requestResetLinkError: null
        });

        const wrapper = createSut(store);

        expectTranslatedText(wrapper.find("h3"), "Forgotten your password?");
        expect((wrapper.find("input[type='email']").element as HTMLInputElement).value).toEqual("");
        expectTranslatedText(wrapper.find("button"), "Request password reset email");
        expect(wrapper.findAll("error-alert-stub").length).toEqual(0);
        expect(wrapper.findAll(".alert-success").length).toEqual(0);
    });

    it("renders translated placeholder", () => {
        const store = createStore({
            resetLinkRequested: false,
            requestResetLinkError: null
        });

        const wrapper = mount(ForgotPassword, {store, localVue});
        expect((wrapper.find("input[type='email']").element as HTMLInputElement).placeholder).toEqual("Email address");
        store.state.language = Language.fr;
        expect((wrapper.find("input[type='email']").element as HTMLInputElement).placeholder).toEqual("Adresse e-mail");
    });

    it("renders form with error", () => {
        const error = mockError("test error");
        const store = createStore({
            resetLinkRequested: false,
            requestResetLinkError: error
        });

        const wrapper = createSut(store);

        expectTranslatedText(wrapper.find("h3"), "Forgotten your password?");
        expect((wrapper.find("input[type='email']").element as HTMLInputElement).value).toEqual("");
        expectTranslatedText(wrapper.find("button"), "Request password reset email");
        expect(wrapper.findAll("error-alert-stub").length).toEqual(1);
        expect(wrapper.find(ErrorAlert).props().error).toBe(error);
        expect(wrapper.findAll(".alert-success").length).toEqual(0);
    });

    it("renders form with request success message", () => {
        const store = createStore({
            resetLinkRequested: true,
            requestResetLinkError: null
        });

        const wrapper = createSut(store);

        expectTranslatedText(wrapper.find("h3"), "Forgotten your password?");
        expect((wrapper.find("input[type='email']").element as HTMLInputElement).value).toEqual("");
        expectTranslatedText(wrapper.find("button"), "Request password reset email");
        expect(wrapper.findAll("error-alert-stub").length).toEqual(0);
        expect(wrapper.findAll(".alert-success").length).toEqual(1);
        expectTranslatedText(wrapper.find(".alert-success"), "Thank you. If we have an account registered for this email address, you wil receive a password reset link.");
    });

    it("invokes requestResetLink action", (done) => {

        const store = createStore();
        const wrapper = createSut(store);

        wrapper.find("input[type='email']").setValue("test@email.com");
        wrapper.find("button[type='submit']").trigger("click");

        setTimeout(() => {
            expect(actions.requestResetLink.mock.calls.length).toEqual(1);
            expect(actions.requestResetLink.mock.calls[0][1]).toEqual("test@email.com");
            expect(wrapper.find("form").classes()).toContain("was-validated");
            done();
        });
    });

    it("does not requestLink action if input value is empty", (done) => {

        const store = createStore();
        const wrapper = createSut(store);

        wrapper.find("button[type='submit']").trigger("click");

        setTimeout(() => {
            expect(actions.requestResetLink.mock.calls.length).toEqual(0);
            expect(wrapper.find("form").classes()).toContain("was-validated");
            done();
        });

    });

    it("does not requestLink action if input value is not email address", (done) => {

        const store = createStore();
        const wrapper = createSut(store);

        wrapper.find("input[type='email']").setValue("test");
        wrapper.find("button[type='submit']").trigger("click");

        setTimeout(() => {
            expect(actions.requestResetLink.mock.calls.length).toEqual(0);
            expect(wrapper.find("form").classes()).toContain("was-validated");
            done();
        });

    });
});