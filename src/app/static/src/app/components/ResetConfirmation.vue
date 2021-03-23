<template>
    <div>
        <modal :open="open">
            <h4 v-if="isGuest" v-translate="'haveYouSaved'"></h4>
            <h4 v-if="!isGuest" v-translate="'saveVersion'"></h4>

            <p v-translate="'discardWarning'"></p>
            <ul>
            <li v-for="step in changesToRelevantSteps" :key="step.number">
                    <span v-translate="'step'"></span> {{ step.number }}: <span v-translate="step.textKey"></span>
                </li>
            </ul>

            <p v-if="isGuest" v-translate="'savePrompt'"></p>
            <p v-if="!isGuest" v-translate="'savePromptLoggedIn'"></p>

            <template v-if="!waitingForVersion" v-slot:footer>
                <button type="button"
                        class="btn btn-red"
                        ref="confirmBtn"
                        @click="handleConfirm"
                        v-translate="isGuest? 'discardSteps' : 'saveVersionConfirm'">
                </button>
                <button type="button"
                        class="btn btn-white"
                        @click="cancelEditing"
                        v-translate="isGuest? 'cancelEdit': 'cancelEditLoggedIn'">
                </button>
            </template>

            <div v-if="waitingForVersion" class="text-center">
                <loading-spinner size="sm"></loading-spinner>
                <h4 id="spinner-text">Saving version</h4>
            </div>
        </modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapGetters} from 'vuex';
    import Modal from "./Modal.vue";
    import {mapActionByName, mapGetterByName, mapStateProp} from "../utils";
    import {StepDescription} from "../store/stepper/stepper";
    import LoadingSpinner from "./LoadingSpinner.vue";
    import {ProjectsState} from "../store/projects/projects";
    import {ErrorsState} from "../store/errors/errors";

    interface Computed {
        changesToRelevantSteps: StepDescription[],
        currentVersionId: string | null,
        errorsCount: number
    }

    interface Props {
        open: boolean
        continueEditing: boolean
        cancelEditing: boolean
    }

    interface Data {
        waitingForVersion: boolean
    }

    export default Vue.extend<Data, unknown, Computed, any>({
        props: ["open", "continueEditing", "cancelEditing"],
        data: function () {
            return {
                waitingForVersion: false
            }
        },
        computed: {
            changesToRelevantSteps: mapGetterByName("stepper", "changesToRelevantSteps"),
            currentVersionId: mapStateProp<ProjectsState, string | null>("projects", state => {
                return state.currentVersion && state.currentVersion.id;
            }),
            ...mapGetters(["isGuest"]),
            errorsCount: mapStateProp<ErrorsState, number>("errors", state => {
                return state.errors ? state.errors.length : 0;
            })
        },
        methods: {
            handleConfirm: function () {
                if (this.isGuest) {
                    this.continueEditing();
                } else {
                    this.waitingForVersion = true;
                    this.newVersion();
                }
            },
            newVersion: mapActionByName("projects", "newVersion")
        },
        watch: {
            currentVersionId: function () {
                if (this.waitingForVersion) {
                    this.waitingForVersion = false;
                    this.continueEditing();
                }
            },
            errorsCount: function (newVal, oldVal) {
                if (this.waitingForVersion && (newVal > oldVal)) {
                    this.waitingForVersion = false;
                    this.cancelEditing();
                }
            },
            open: function(){
                const confirmBtn = this.$refs.confirmBtn as HTMLElement
                const self = this
                if (confirmBtn){
                    this.$nextTick(() => {
                        if (self.open){
                            confirmBtn.focus();
                        } else confirmBtn.blur();
                    })
                }
            }
        },
        components: {
            Modal,
            LoadingSpinner
        }
    });

</script>
