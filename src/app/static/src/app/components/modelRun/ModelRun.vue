<template>
    <div>
        <button class="btn btn-red btn-lg"
                v-on:click="handleRun"
                :disabled="running"
                v-translate="'fitModel'">
        </button>
        <h4 v-if="complete" class="mt-3" id="model-run-complete" v-translate="'fittingComplete'">
            <tick color="#e31837" width="20px"></tick>
        </h4>
        <modal :open="running">
            <progress-bar v-for="phase in phases"
                          :key="phase.name"
                          :phase="phase"></progress-bar>
            <div class="text-center" v-if="phases.length == 0">
                <h4 v-translate="'initialisingFit'"></h4>
                <loading-spinner size="sm"></loading-spinner>
            </div>
            <div>
                <button class="btn btn-red float-right" id="cancel-model-run"
                        v-on:click="cancelRun" v-translate="'cancelFitting'">
                </button>
            </div>
        </modal>
        <div class="mt-3">
            <error-alert v-for="(error, index) in errors" :key="index" :error="error"></error-alert>
        </div>
        <reset-confirmation :continue-editing="confirmReRun"
                            :cancel-editing="cancelReRun"
                            :open="showReRunConfirmation"></reset-confirmation>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {ModelRunState} from "../../store/modelRun/modelRun";
    import Modal from "../Modal.vue";
    import Tick from "../Tick.vue";
    import {
        mapActionsByNames,
        mapGettersByNames,
        mapStateProps,
        mapGetterByName,
        mapMutationByName
    } from "../../utils";
    import ErrorAlert from "../ErrorAlert.vue";
    import {ProgressPhase} from "../../generated";
    import ProgressBar from "../progress/ProgressBar.vue";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import ResetConfirmation from "../ResetConfirmation.vue";
    import {ModelRunMutation} from "../../store/modelRun/mutations";

    interface ComputedState {
        complete: boolean
        runId: string
        pollId: number
        phases: ProgressPhase[]
    }

    interface ComputedGetters {
        running: boolean
        // complete: boolean
    }

     interface Data {
        showReRunConfirmation: boolean
    }

    interface Computed extends ComputedGetters, ComputedState {
        editsRequireConfirmation: boolean
    }

    interface Methods {
        handleRun: () => void;
        confirmReRun: () => void;
        cancelReRun: () => void;
        run: () => void;
        poll: (runId: string) => void;
        cancelRun: () => void;
        runModelWithParams: () => void;
        clearResult: () => void;
    }

    const namespace = 'modelRun';

    export default Vue.extend<Data, Methods, Computed, unknown>({
        name: "ModelRun",
        data(): Data {
            return {
                showReRunConfirmation: false
            }
        },
        computed: {
            editsRequireConfirmation: mapGetterByName("stepper", "editsRequireConfirmation"),
            ...mapStateProps<ModelRunState, keyof ComputedState>(namespace, {
                complete: state => state.complete,
                runId: state => state.modelRunId,
                pollId: state => state.statusPollId,
                errors: state => state.errors,
                phases: state => {
                    const progress = state.status.progress || [];
                    return progress.map((item, index) => ({...item, name: `${index + 1}. ${item.name}`}))
                }
            }),
            // ...mapGettersByNames<keyof ComputedGetters>(namespace, ["running", "complete"])
            ...mapGettersByNames<keyof ComputedGetters>(namespace, ["running"])
        },
        methods: {
            ...mapActionsByNames<keyof Methods>(namespace, ["run", "poll", "cancelRun"]),
            clearResult: mapMutationByName(namespace, ModelRunMutation.ClearResult),
            handleRun(){
                if (this.editsRequireConfirmation){
                    this.showReRunConfirmation = true
                } else this.run()
            },
            confirmReRun() {
                this.clearResult();
                this.run();
                this.showReRunConfirmation = false;
            },
            cancelReRun() {
                this.showReRunConfirmation = false
            }
        },
        watch: {
            runId: function (newVal) {
                if (newVal) {
                    this.poll(newVal)
                }
            }
        },
        created() {
            if (this.runId && this.pollId == -1 && !this.complete) {
                this.poll(this.runId);
            }
        },
        components: {
            ResetConfirmation,
            Modal,
            Tick,
            ErrorAlert,
            ProgressBar,
            LoadingSpinner
        }
    });
</script>
