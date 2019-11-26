import {initialModelOutputState, modelOutputGetters} from "../../app/store/modelOutput/modelOutput";
import {
    mockBaselineState, mockModelOutputState,
    mockModelResultResponse,
    mockModelRunState,
    mockRootState,
    mockShapeResponse
} from "../mocks";


describe("modelOutput module", () => {

    const modelRunResponse = mockModelResultResponse({
        plottingMetadata: {
            barchart: {
                filters: [
                    {id: "age", column_id: "age_group_id", label: "Age", options: []},
                    {id: "quarter", column_id: "quarter_id", label: "Quarter", options: []}
                ],
                indicators: [
                    {
                        error_high_column: "upper",
                        error_low_column: "lower",
                        indicator: "prevalence",
                        indicator_column: "indicator_id",
                        indicator_value: "2",
                        name: "Prevalence",
                        value_column: "mean"
                    },
                    {
                        error_high_column: "upper",
                        error_low_column: "lower",
                        indicator: "art_coverage",
                        indicator_column: "indicator_id",
                        indicator_value: "4",
                        name: "ART coverage",
                        value_column: "mean"
                    }
                ]
            }
        }
    });

    const rootState = mockRootState({
        baseline: mockBaselineState({
            shape: mockShapeResponse({
                filters: {
                    regions: {
                        label: "label 1",
                        id: "id1",
                        children: []
                    }
                }
            })
        }),
        modelOutput: mockModelOutputState(),
        modelRun: mockModelRunState({
            result: modelRunResponse
        })
    });

    it("gets barchart indicators", async () => {
        const result = modelOutputGetters.barchartIndicators(mockModelOutputState(), null, rootState);
        expect(result.length).toEqual(2);
        expect(result).toBe(modelRunResponse.plottingMetadata.barchart.indicators);
    });

    it("gets barchart filters", async () => {

        const result = modelOutputGetters.barchartFilters(mockModelOutputState(), null, rootState);
        expect(result.length).toEqual(4); //NB temporarily 4 rather than 3 as including sex until it comes from api
        expect(result[0]).toStrictEqual(modelRunResponse.plottingMetadata.barchart.filters[0]);
        expect(result[1]).toStrictEqual(modelRunResponse.plottingMetadata.barchart.filters[1]);

        expect(result[3]).toStrictEqual({
            id: "region",
            column_id: "area_id",
            label: "Region",
            options: [
                {id: "id1", label: "label 1", children: []}
            ]
        });
    });
});