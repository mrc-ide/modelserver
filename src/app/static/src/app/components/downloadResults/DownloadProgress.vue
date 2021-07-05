<template>
    <div>
    <span v-if="downloading"
          id="downloading" class="d-flex mt-2">
        <loading-spinner size="xs"></loading-spinner>
        <span v-translate="'downloading'"></span>
    </span>
        <span v-if="complete"
              id="download-complete-div" class="d-flex mt-2">
        <span class="d-inline"
              id="download-complete-text"
              v-translate="'downloadComplete'"></span>
        <tick color="#e31837" width="20px"></tick>
    </span>
    </div>
</template>

<script lang="ts">
    import Vue from "vue"
    import Tick from "../Tick.vue";
    import LoadingSpinner from "../LoadingSpinner.vue";

    interface Props {
        complete: boolean,
        downloading: boolean
    }

    export default Vue.extend<unknown, unknown, unknown, Props>({
        name: "DownloadProgress",
        components: {
            Tick,
            LoadingSpinner
        },
        props: {
            complete: {
                required: true,
                type: Boolean
            },
            downloading: {
                required: true,
                type: Boolean
            }
        }
    })
</script>