import {RootState} from "../../root";
import {DataType, FilteredDataState} from "./filteredData";
import {FilterOption, SurveyDataRow} from "../../generated";
import {Dict, Filter, IndicatorValuesDict} from "../../types";
import {getColor, getUnfilteredData, sexFilterOptions} from "./utils";
import {flattenToIdSet} from "../../utils";

export const getters = {
    selectedDataFilterOptions: (state: FilteredDataState, getters: any, rootState: RootState): Dict<FilterOption[] | undefined> | null => {
        const sapState = rootState.surveyAndProgram;
        const modelRunState = rootState.modelRun;
        const regions = rootState.baseline.regionFilters;
        switch (state.selectedDataType) {
            case (DataType.ANC):
                return sapState.anc ?
                    {
                        ...sapState.anc.filters,
                        regions,
                        sex: undefined,
                        surveys: undefined,
                        quarter: undefined
                    } : null;
            case (DataType.Program):
                return sapState.program ?
                    {
                        ...sapState.program.filters,
                        regions,
                        sex: sexFilterOptions,
                        surveys: undefined,
                        quarter: undefined
                    } : null;
            case (DataType.Survey):
                return sapState.survey ?
                    {
                        ...sapState.survey.filters,
                        regions,
                        sex: sexFilterOptions,
                        quarter: undefined
                    } : null;
            case (DataType.Output):
                let quarter;
                let age;
                if (modelRunState.result){
                    const filters = modelRunState.result.plottingMetadata.choropleth.filters;
                    quarter = filters.find((f: Filter) => f.id == "quarter");
                    age = filters.find((f: Filter) => f.id == "age");
                }
                return {
                    regions,
                    sex: sexFilterOptions,
                    surveys: undefined,
                    quarter: quarter ? quarter.options : undefined,
                    age: age ? age.options : undefined
                };
            default:
                return null;
        }
    },
    regionIndicators: function (state: FilteredDataState, getters: any, rootState: RootState, rootGetters: any): Dict<IndicatorValuesDict> {

        const data = getUnfilteredData(state, rootState);
        if (!data || (state.selectedDataType == null)) {
            return {};
        }

        const result = {} as Dict<IndicatorValuesDict>;

        const indicatorsMeta = rootGetters['metadata/choroplethIndicatorsMetadata'];
        const selectedRegionFilters = flattenedSelectedRegionFilters(state, rootState);

        for (const row of data) {

            if (getters.excludeRow(row, selectedRegionFilters)) {
                continue;
            }

            const areaId: string = row.area_id;

            for (const metadata of indicatorsMeta) {

                const indicator = metadata.indicator;

                if (metadata.indicator_column && metadata.indicator_value != row[metadata.indicator_column]) {
                    //This data is in long format, and the indicator column's value does not match that for this indicator
                    continue;
                }

                if (!row[metadata.value_column]) {
                    //No value for this indicator in this row
                    continue;
                }

                const value = row[metadata.value_column];

                if (!result[areaId]) {
                    result[areaId] = {} as IndicatorValuesDict;
                }

                const regionValues = result[areaId];
                regionValues[indicator] = {
                    value: value,
                    color: getColor(value, metadata)
                }

            }
        }

        return result;
    },
    excludeRow: function (state: FilteredDataState):
        (row: any, selectedRegions: Set<string>) => boolean {
        const dataType = state.selectedDataType!!;
        const selectedFilters = state.selectedChoroplethFilters;

        return (row: any, selectedRegions: Set<string>) => {

            if (dataType != DataType.ANC && row.sex != selectedFilters.sex) {
                return true;
            }

            if (dataType != DataType.ANC && row.age_group != selectedFilters.age) {
                return true;
            }

            if (dataType == DataType.Survey && row.survey_id != selectedFilters.survey) {
                return true;
            }

            if (dataType in [DataType.Program, DataType.ANC] && row.year != selectedFilters.year) {
                return true;
            }

            if (dataType == DataType.Output && row.calendar_quarter != selectedFilters.quarter) {
                return true;
            }

            if (selectedRegions.size > 0 && !selectedRegions.has(row.area_id)) {
                return true
            }

            return false;
        }
    }
};

export const flattenedSelectedRegionFilters = (state: FilteredDataState, rootState: RootState): Set<string> => {
    const selectedRegions = state.selectedChoroplethFilters.regions ? state.selectedChoroplethFilters.regions : [];
    return flattenToIdSet(selectedRegions, rootState.baseline.flattenedRegionFilters);
};
