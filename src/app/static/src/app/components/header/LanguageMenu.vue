<template>
    <drop-down :text="currentLanguage" :right="true" style="flex: none">
        <a class="dropdown-item" href="#" v-on:mousedown="() => changeLanguage('en')">
            EN
        </a>
        <a class="dropdown-item" href="#" v-on:mousedown="() => changeLanguage('fr')">
            FR
        </a>
        <a class="dropdown-item" href="#" v-on:mousedown="() => changeLanguage('pt')">
            PT
        </a>
    </drop-down>
</template>
<script lang="ts">

    import Vue from "vue";
    import {mapActionByName, mapStateProp} from "../../utils";
    import {RootState} from "../../root";
    import DropDown from "./DropDown.vue";

    interface Methods {
        changeLanguage: (lang: string) => void
    }

    interface Computed {
        currentLanguage: string
    }

    export default Vue.extend<unknown, Methods, Computed, unknown>({
        computed: {
            currentLanguage: mapStateProp<RootState, string>(null,
                (state: RootState) => state.language.toUpperCase())
        },
        methods: {
            changeLanguage: mapActionByName<File>(null, "changeLanguage")
        },
        components: {
            DropDown
        }
    })
</script>