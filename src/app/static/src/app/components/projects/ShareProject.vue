<template>
    <div>
        <button class="btn btn-sm btn-red-icons"
                v-tooltip="tooltipShare"
                @click="shareProject">
            <share-2-icon size="20"></share-2-icon>
        </button>
        <modal :open="open">
            <h4 v-translate="'shareProject'"></h4>
            <div v-if="!cloningProject">
                <div v-html="instructions" id="instructions"></div>
                <div class="row mb-2" v-for="(email, index) in emailsToShareWith" :key="index" id="shareInputs">
                    <div class="col">
                        <input autocomplete="no"
                               @keyup.enter="enterEmails(email, index)"
                               @keyup.delete="removeEmail(email, index)"
                               class="form-control"
                               :class="{'is-invalid': email.valid === false}"
                               @blur="() => addEmail(email, index)"
                               @mouseout="$event.target.blur()"
                               v-model="email.value"/>
                    </div>
                    <div class="col">
                        <div class="small text-danger"
                             v-if="email.valid === false"
                             v-translate="email.validationMessage">
                        </div>
                    </div>
                </div>
            </div>
            <div class="text-center" v-if="cloningProject">
                <loading-spinner size="sm"></loading-spinner>
            </div>
            <template v-slot:footer>
                <div class="text-muted help-text"
                     v-show="showValidationMessage"
                     v-translate="'emailMultiValidation'">
                </div>
                <error-alert v-if="cloneProjectError" :error="cloneProjectError"></error-alert>
                <button type="button"
                        class="btn btn-red"
                        ref="okBtn"
                        @click="confirmShareProject"
                        :disabled="invalidEmails || cloningProject"
                        v-translate="'ok'">
                </button>
                <button type="button"
                        class="btn btn-white"
                        @mousedown="cancelShareProject"
                        :disabled="cloningProject"
                        v-translate="'cancel'">
                </button>
            </template>
        </modal>
    </div>
</template>

<script lang="ts">
    import {Project} from "../../types";
    import Vue from "vue";
    import Modal from "../Modal.vue";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import {mapActionByName, mapStatePropByName} from "../../utils";
    import i18next from "i18next";
    import {Language} from "../../store/translations/locales";
    import ErrorAlert from "../ErrorAlert.vue";
    import {CloneProjectPayload} from "../../store/projects/actions";
    import {Share2Icon} from "vue-feather-icons";
    import {VTooltip} from 'v-tooltip';

    interface EmailToShareWith {
        value: string
        valid: boolean | null
        validationMessage: string
    }

    interface Data {
        emailsToShareWith: EmailToShareWith[]
        open: boolean
    }

    interface Props {
        project: Project
    }

    interface Computed {
        currentLanguage: Language,
        instructions: string
        invalidEmails: boolean
        cloneProjectError: Error | null
        cloningProject: boolean
        tooltipShare: string
        showValidationMessage: boolean
    }

    interface Methods {
        addEmail: (email: EmailToShareWith, index: number) => void
        enterEmails: (email: EmailToShareWith, index: number) => void
        cycleInputs: (email: EmailToShareWith, index: number) => void
        removeEmail: (email: EmailToShareWith, index: number) => void
        shareProject: (e: Event) => void
        confirmShareProject: () => void
        cancelShareProject: () => void
        userExists: (email: string) => Promise<boolean>
        cloneProject: (payload: CloneProjectPayload) => void
    }

    declare const currentUser: string; 

    export default Vue.extend<Data, Methods, Computed, Props>({
        props: {
            project: {
                type: Object
            }
        },
        data() {
            return {
                emailsToShareWith: [{value: "", valid: null, validationMessage: ""}],
                open: false
            }
        },
        methods: {
            cloneProject: mapActionByName("projects", "cloneProject"),
            userExists: mapActionByName("projects", "userExists"),
            enterEmails(email: EmailToShareWith, index: number){
                this.addEmail(email, index)
                this.$nextTick(() => {   
                    this.cycleInputs(email, index)               
                })
            },
            addEmail(e: EmailToShareWith, index: number) {
                if (e.value && index == this.emailsToShareWith.length - 1) {
                    this.emailsToShareWith.push({
                        value: "",
                        valid: null,
                        validationMessage: ""
                    });
                }
                this.emailsToShareWith.map(async (email: EmailToShareWith, index: number) => {
                    if (email.value) {
                        let invalidMsg = null;
                        const emailValue = email.value.toLowerCase()
                        if (emailValue == currentUser.toLowerCase()) {
                            invalidMsg = "projectsNoSelfShare";
                        } else if (this.emailsToShareWith.filter(val => val.value.toLowerCase() === emailValue).length > 1) {
                            invalidMsg = "duplicateEmails";
                        } else {
                            const result = await this.userExists(emailValue);
                            if (!result) {
                                invalidMsg = "emailNotRegistered"
                            }
                        }

                        this.emailsToShareWith[index].validationMessage = invalidMsg || "";
                        this.emailsToShareWith[index].valid = invalidMsg === null;

                    } else {
                        email.valid = null;
                    }
                });
            },
            cycleInputs(email, index){
                    const lastInputIndex = this.emailsToShareWith.length - 1
                    const lastInput = this.$el.querySelectorAll("#shareInputs > div > input")[lastInputIndex]! as HTMLElement
                    const currentInput = this.$el.querySelectorAll("#shareInputs > div > input")[index]! as HTMLElement
                    const okBtn = this.$refs.okBtn as HTMLElement

                if (index === lastInputIndex && !email.value){
                    currentInput.blur()
                    okBtn.focus()
                } else {
                    currentInput.blur()
                    lastInput.focus()
                }
            },
            removeEmail(email: EmailToShareWith, index: number) {
                // if email has been deleted and this is not the last input
                // remove from UI
                if (!email.value && index < this.emailsToShareWith.length - 1) {
                    this.emailsToShareWith.splice(index, 1);
                }
            },
            shareProject(e: Event) {
                e.preventDefault();
                this.open = true;
            },
            confirmShareProject() {
                const emails = this.emailsToShareWith
                    .filter(e => e.value)
                    .map(e => e.value);
                if (emails.length > 0) {
                    this.cloneProject({emails, projectId: this.project.id})
                }
            },
            cancelShareProject() {
                this.emailsToShareWith = [{value: "", valid: null, validationMessage: ""}];
                this.open = false;
            }
        },
        computed: {
            cloningProject: mapStatePropByName<boolean>("projects", "cloningProject"),
            cloneProjectError: mapStatePropByName<Error | null>("projects", "cloneProjectError"),
            currentLanguage: mapStatePropByName<Language>(null, "language"),
            instructions() {
                return i18next.t('shareProjectInstructions', {project: this.project.name, lng: this.currentLanguage});
            },
            invalidEmails() {
                //Invalid state until all emails evaluated as valid = true (may not have blurred yet)...
                return this.emailsToShareWith.filter(e => e.value && !e.valid).length > 0
            },
            showValidationMessage() {
                //...however only show error message if any confirmed to be valid = false
                return this.emailsToShareWith.filter(e => e.value && e.valid === false).length > 0
            },
            tooltipShare() {
                return i18next.t("share", {
                    lng: this.currentLanguage
                });
            }
        },
        components: {
            Modal,
            LoadingSpinner,
            ErrorAlert,
            Share2Icon
        },
        directives: {
            tooltip: VTooltip
        },
        watch: {
            open: function(){
                const firstInput = this.$el.querySelectorAll("#shareInputs > div > input")[0]! as HTMLElement
                const self = this
                if (firstInput){
                    this.$nextTick(() => {
                        if (self.open){
                            firstInput.focus();
                        }
                    })
                }
            },
            cloningProject(newVal: boolean) {
                if (!newVal && !this.cloneProjectError) {
                    this.emailsToShareWith = [{value: "", valid: null, validationMessage: ""}];
                    this.open = false;
                }
            }
        }
    });

</script>
