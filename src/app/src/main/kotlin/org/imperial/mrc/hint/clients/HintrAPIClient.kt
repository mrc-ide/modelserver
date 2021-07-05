package org.imperial.mrc.hint.clients

import com.fasterxml.jackson.databind.ObjectMapper
import com.github.kittinunf.fuel.Fuel.head
import com.github.kittinunf.fuel.httpDownload
import com.github.kittinunf.fuel.httpPost
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.asResponseEntity
import org.imperial.mrc.hint.getStreamingResponseEntity
import org.imperial.mrc.hint.models.ModelOptions
import org.imperial.mrc.hint.models.VersionFileWithPath
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody

interface HintrAPIClient
{
    fun validateBaselineIndividual(file: VersionFileWithPath, type: FileType): ResponseEntity<String>
    fun validateBaselineCombined(files: Map<String, VersionFileWithPath?>): ResponseEntity<String>
    fun validateSurveyAndProgramme(file: VersionFileWithPath, shapePath: String, type: FileType)
            : ResponseEntity<String>

    fun submit(data: Map<String, VersionFileWithPath>, modelRunOptions: ModelOptions): ResponseEntity<String>
    fun getStatus(id: String): ResponseEntity<String>
    fun getResult(id: String): ResponseEntity<String>
    fun getPlottingMetadata(iso3: String): ResponseEntity<String>
    fun getModelRunOptions(files: Map<String, VersionFileWithPath>): ResponseEntity<String>
    fun getModelCalibrationOptions(): ResponseEntity<String>
    fun calibrateSubmit(runId: String, calibrationOptions: ModelOptions): ResponseEntity<String>
    fun getCalibrateStatus(id: String): ResponseEntity<String>
    fun getCalibrateResult(id: String): ResponseEntity<String>
    fun getCalibratePlot(id: String): ResponseEntity<String>
    fun cancelModelRun(id: String): ResponseEntity<String>
    fun getVersion(): ResponseEntity<String>
    fun validateModelOptions(data: Map<String, VersionFileWithPath>, modelRunOptions: ModelOptions):
            ResponseEntity<String>
    fun get(url: String): ResponseEntity<String>
    fun downloadOutput(type:String, id: String): ResponseEntity<String>
    fun downloadOutputStatus(id: String): ResponseEntity<String>
    fun downloadOutputResult(id: String): ResponseEntity<StreamingResponseBody>
    fun getUploadMetadata(id: String): ResponseEntity<String>
}

@Component
class HintrFuelAPIClient(
        appProperties: AppProperties,
        private val objectMapper: ObjectMapper) : HintrAPIClient, FuelClient(appProperties.apiUrl)
{

    private fun getAcceptLanguage(): String
    {
        val requestAttributes = RequestContextHolder.getRequestAttributes()
        if (requestAttributes is ServletRequestAttributes)
        {
            return requestAttributes.request.getHeader("Accept-Language") ?: "en"
        }
        return "en"
    }

    override fun standardHeaders(): Map<String, Any>
    {
        return mapOf("Accept-Language" to getAcceptLanguage())
    }

    override fun validateBaselineIndividual(file: VersionFileWithPath,
                                            type: FileType): ResponseEntity<String>
    {

        val json = objectMapper.writeValueAsString(
                mapOf("type" to type.toString().toLowerCase(),
                        "file" to file))

        return postJson("validate/baseline-individual", json)
    }

    override fun validateSurveyAndProgramme(file: VersionFileWithPath,
                                            shapePath: String,
                                            type: FileType): ResponseEntity<String>
    {

        val json = objectMapper.writeValueAsString(
                mapOf("type" to type.toString().toLowerCase(),
                        "file" to file,
                        "shape" to shapePath))

        return postJson("validate/survey-and-programme", json)
    }

    override fun submit(data: Map<String, VersionFileWithPath>, modelRunOptions: ModelOptions)
            : ResponseEntity<String>
    {

        val json = objectMapper.writeValueAsString(
                mapOf("options" to modelRunOptions.options,
                        "version" to modelRunOptions.version,
                        "data" to data))

        return postJson("model/submit", json)
    }

    override fun validateModelOptions(data: Map<String, VersionFileWithPath>, modelRunOptions: ModelOptions)
            : ResponseEntity<String>
    {

        val json = objectMapper.writeValueAsString(
                mapOf("options" to modelRunOptions.options,
                        "data" to data))

        return postJson("validate/options", json)
    }

    override fun getStatus(id: String): ResponseEntity<String>
    {
        return get("model/status/${id}")
    }

    override fun getResult(id: String): ResponseEntity<String>
    {
        return get("model/result/${id}")
    }

    override fun calibrateSubmit(runId: String, calibrationOptions: ModelOptions): ResponseEntity<String>
    {
        val json = objectMapper.writeValueAsString(calibrationOptions)
        return postJson("calibrate/submit/${runId}", json)
    }

    override fun getCalibrateStatus(id: String): ResponseEntity<String>
    {
        return get("calibrate/status/${id}")
    }

    override fun getCalibrateResult(id: String): ResponseEntity<String>
    {
        return get("calibrate/result/${id}")
    }

    override fun getCalibratePlot(id: String): ResponseEntity<String>
    {
        return get("calibrate/plot/${id}")
    }

    override fun getPlottingMetadata(iso3: String): ResponseEntity<String>
    {
        return get("meta/plotting/${iso3}")
    }

    override fun getModelRunOptions(files: Map<String, VersionFileWithPath>): ResponseEntity<String>
    {
        val json = objectMapper.writeValueAsString(files)
        return postJson("model/options", json)
    }

    override fun getModelCalibrationOptions(): ResponseEntity<String>
    {
        return postEmpty("calibrate/options")
    }

    override fun validateBaselineCombined(files: Map<String, VersionFileWithPath?>): ResponseEntity<String>
    {
        val json = objectMapper.writeValueAsString(
                files.mapValues { it.value?.path }
        )
        return postJson("validate/baseline-combined", json)
    }

    override fun cancelModelRun(id: String): ResponseEntity<String>
    {
        return "$baseUrl/model/cancel/${id}".httpPost()
                .addTimeouts()
                .response()
                .second
                .asResponseEntity()
    }

    override fun getVersion(): ResponseEntity<String>
    {
        return get("hintr/version")
    }

    override fun downloadOutput(type:String, id: String): ResponseEntity<String>
    {
        return get("download/submit/${type}/${id}")
    }

    override fun downloadOutputStatus(id: String): ResponseEntity<String>
    {
        return get("download/status/${id}")
    }

    override fun downloadOutputResult(id: String): ResponseEntity<StreamingResponseBody>
    {
        return "$baseUrl/download/result/${id}"
                .httpDownload()
                .getStreamingResponseEntity(::head)
    }

    override fun getUploadMetadata(id: String): ResponseEntity<String>
    {
        return get("meta/adr/${id}")
    }

}
