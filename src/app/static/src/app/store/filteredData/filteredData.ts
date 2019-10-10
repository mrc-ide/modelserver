import {Module} from 'vuex';
import {actions} from './actions';
import {mutations} from './mutations';
import {getters} from './getters';
import {RootState} from "../../root";
import {FilterOption, NestedFilterOption} from "../../generated";
import {localStorageManager} from "../../localStorageManager";

export enum DataType { ANC = "anc", Program = "programme", Survey = "survey", Output = "output"}
export enum FilterType { Sex, Age, Region, Survey, Quarter }

export interface SelectedFilters {
    sex: FilterOption[],
    age: FilterOption[],
    region: FilterOption[],
    surveys: FilterOption[],
    quarter: FilterOption[]
}

export interface SelectedChoroplethFilters {
    sex: FilterOption | null,
    age: FilterOption | null,
    survey: FilterOption | null,
    quarter: FilterOption | null,
    regions: NestedFilterOption[] | null
}

export interface FilteredDataState {
    selectedDataType: DataType | null
    selectedFilters: SelectedFilters
    selectedChoroplethFilters: SelectedChoroplethFilters
    regionIndicators: { [k: string]: any };
}

export const initialSelectedFilters: SelectedFilters = {
    sex: [],
    age: [],
    region: [],
    surveys: [],
    quarter: []
};

export const initialSelectedChoroplethFilters: SelectedChoroplethFilters = {
    sex: null,
    age: null,
    survey: null,
    regions: null,
    quarter: null
};

export const initialFilteredDataState: FilteredDataState = {
    selectedDataType: null,
    selectedFilters: initialSelectedFilters,
    selectedChoroplethFilters: initialSelectedChoroplethFilters,
    regionIndicators: {}
};

const namespaced: boolean = true;
const existingState = localStorageManager.getState();

export const filteredData: Module<FilteredDataState, RootState> = {
    namespaced,
    state: {...initialFilteredDataState, ...existingState && existingState.filteredData},
    actions,
    mutations,
    getters
};
