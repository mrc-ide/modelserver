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

            <div id="noteHeader" class="form-group">
                <label for="resetVersionNoteControl"><span v-translate="'noteHeader'"></span></label>
                <textarea class="form-control" id="resetVersionNoteControl" v-model="versionNote" rows="3"></textarea>
            </div>

            <template v-if="!waitingForVersion" v-slot:footer>
                <button type="button"
                        class="btn btn-red"
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
    import Modal from "./Modal.vue";
    import {mapActionByName, mapGetterByName, mapStateProp} from "../utils";
    import {StepDescription} from "../store/stepper/stepper";
    import LoadingSpinner from "./LoadingSpinner.vue";
    import {ProjectsState} from "../store/projects/projects";
    import {ErrorsState} from "../store/errors/errors";

    interface Computed {
        changesToRelevantSteps: StepDescription[]
        currentVersionId: string | null
        errorsCount: number
        currentVersionNote: string
        isGuest: boolean
    }

    interface Props {
        open: boolean
        continueEditing: () => void
        cancelEditing: () => void
    }

    interface Data {
        waitingForVersion: boolean
        versionNote: string
    }

    interface Methods {
        handleConfirm: () => void
        newVersion: (note: string) => void
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        props: {
            open: Boolean,
            continueEditing: Function,
            cancelEditing: Function
        },
        data: function () {
            return {
                waitingForVersion: false,
                versionNote: ""
            }
        },
        computed: {
            changesToRelevantSteps: mapGetterByName("stepper", "changesToRelevantSteps"),
            currentVersionId: mapStateProp<ProjectsState, string | null>("projects", state => {
                return state.currentVersion && state.currentVersion.id;
            }),
            currentVersionNote: mapStateProp<ProjectsState, string>("projects", state => {
                return state.currentVersion?.note || "";
            }),
            isGuest: mapGetterByName(null, "isGuest"),
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
                    this.newVersion(encodeURIComponent(this.versionNote));
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
            open: function () {
                if (this.open) {
                    this.versionNote = this.currentVersionNote;
                }
            }
        },
        components: {
            Modal,
            LoadingSpinner
        }
    });

</script>
