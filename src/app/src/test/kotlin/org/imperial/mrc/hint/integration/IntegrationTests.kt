package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.fasterxml.jackson.module.kotlin.treeToValue
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.helpers.AuthInterceptor
import org.imperial.mrc.hint.helpers.JSONValidator
import org.imperial.mrc.hint.helpers.getTestEntity
import org.imperial.mrc.hint.models.ModelOptions
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.TestInfo
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.*
import javax.annotation.PostConstruct

abstract class SecureIntegrationTests : CleanDatabaseTests()
{

    protected lateinit var testRestTemplate: TestRestTemplate

    @PostConstruct
    fun getTemplate()
    {
        val builder = restTemplateBuilder
                .rootUri("http://localhost:" + env.getProperty("local.server.port"))

        this.testRestTemplate = TestRestTemplate(builder)
    }

    @BeforeEach
    fun beforeEach(info: TestInfo)
    {
        userRepo.addUser("guest", "guest")
        val isAuthorized = info.displayName.contains("TRUE")
        if (isAuthorized)
        {
            authorize()
            testRestTemplate.getForEntity<String>("/")
        }
        else
        {
            clear()
        }
    }

    protected fun getModelRunEntity(): HttpEntity<String>
    {
        uploadMinimalFiles()
        val optionsResponseEntity = testRestTemplate.getForEntity<String>("/model/options/")
        val versionJson = parser.readTree(optionsResponseEntity.body!!)["version"]
        val version = parser.treeToValue<Map<String, String>>(versionJson)

        val modelRunOptions = ModelOptions(getMockModelOptions(), version)
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        val jsonString = ObjectMapper().writeValueAsString(modelRunOptions)
        return HttpEntity(jsonString, headers)
    }

    protected fun getValidationOptions(): HttpEntity<String>
    {
        uploadMinimalFiles()
        val modelRunOptions = ModelOptions(getMockModelOptions(), emptyMap())

        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        val jsonString = ObjectMapper().writeValueAsString(modelRunOptions)
        return HttpEntity(jsonString, headers)
    }


    protected val parser = ObjectMapper()

    protected fun uploadMinimalFiles()
    {
        testRestTemplate.postForEntity<String>("/baseline/shape/",
                getTestEntity("malawi.geojson"))

        testRestTemplate.postForEntity<String>("/baseline/pjnz/",
                getTestEntity("Malawi2019.PJNZ"))

        testRestTemplate.postForEntity<String>("/baseline/population/",
                getTestEntity("population.csv"))

        testRestTemplate.postForEntity<String>("/disease/survey/",
                getTestEntity("survey.csv"))
    }

    protected fun waitForModelRunResult(): String
    {
        val entity = getModelRunEntity()
        val runResult = testRestTemplate.postForEntity<String>("/model/run/", entity)
        val id = ObjectMapper().readValue<JsonNode>(runResult.body!!)["data"]["id"].textValue()

        do
        {
            Thread.sleep(500)
            val statusResponse = testRestTemplate.getForEntity<String>("/model/status/$id")
        } while (statusResponse.body != null && statusResponse.body!!.contains("\"status\":\"RUNNING\""))

        return id
    }

    protected fun waitForCalibrationResult(modelId: String): String {
        val entity = getModelRunEntity()
        val responseEntity = testRestTemplate.postForEntity<String>("/model/calibrate/submit/$modelId", entity)
        val id = ObjectMapper().readValue<JsonNode>(responseEntity.body!!)["data"]["id"].textValue()

        do
        {
            Thread.sleep(500)
            val statusResponse = testRestTemplate.getForEntity<String>("/model/calibrate/status/$id")
        } while (statusResponse.body != null && statusResponse.body!!.contains("\"status\":\"RUNNING\""))

        return id
    }

    protected fun waitForDownloadOutputResult(calibrateId: String, type: String): String
    {
        val response = testRestTemplate.getForEntity<String>("/download/submit/$type/$calibrateId")
        assertSuccess(response, "DownloadSubmitResponse")
        val bodyJSON = ObjectMapper().readTree(response.body)
        val responseId = bodyJSON["data"]["id"].asText()

        do
        {
            Thread.sleep(500)
            val statusResponse = testRestTemplate.getForEntity<String>("/download/status/$responseId")
        } while (statusResponse.body != null && statusResponse.body!!.contains("\"status\":\"RUNNING\""))

        return responseId
    }

    fun assertSecureWithHttpStatus(isAuthorized: IsAuthorized,
                                   responseEntity: ResponseEntity<String>,
                                   schemaName: String?, httpStatus: HttpStatus)
    {

        when (isAuthorized)
        {
            IsAuthorized.TRUE ->
            {
                Assertions.assertThat(responseEntity.headers.contentType!!.toString())
                        .contains("application/json")

                if (responseEntity.statusCode != httpStatus)
                {
                    Assertions.fail<String>("Expected $httpStatus but got error: ${responseEntity.body}")
                }
                if (schemaName != null)
                {
                    JSONValidator().validateSuccess(responseEntity.body!!, schemaName)
                }

            }
            IsAuthorized.FALSE ->
            {
                assertUnauthorized(responseEntity)
            }
        }
    }

    fun assertSecureWithSuccess(isAuthorized: IsAuthorized,
                                responseEntity: ResponseEntity<String>,
                                schemaName: String?)
    {

        when (isAuthorized)
        {
            IsAuthorized.TRUE ->
            {
                Assertions.assertThat(responseEntity.headers.contentType!!.toString())
                        .contains("application/json")

                if (responseEntity.statusCode != HttpStatus.OK)
                {
                    Assertions.fail<String>("Expected OK response but got error: ${responseEntity.body}")
                }
                if (schemaName != null)
                {
                    JSONValidator().validateSuccess(responseEntity.body!!, schemaName)
                }

            }
            IsAuthorized.FALSE ->
            {
                assertUnauthorized(responseEntity)
            }
        }
    }

    fun assertSecureWithSuccess(isAuthorized: IsAuthorized,
                                responseEntity: ResponseEntity<ByteArray>)
    {

        when (isAuthorized)
        {
            IsAuthorized.TRUE ->
            {
                assertSuccess(responseEntity)
            }
            IsAuthorized.FALSE ->
            {
                assertUnauthorized(responseEntity)
            }
        }
    }

    fun assertSuccess(responseEntity: ResponseEntity<String>,
                      schemaName: String?)
    {

        Assertions.assertThat(responseEntity.headers.contentType!!.toString())
                .isEqualTo("application/json")

        if (responseEntity.statusCode != HttpStatus.OK)
        {
            Assertions.fail<String>("Expected OK response but got error: ${responseEntity.body}")
        }
        if (schemaName != null)
        {
            JSONValidator().validateSuccess(responseEntity.body!!, schemaName)
        }
    }

    fun <T> assertUnauthorized(responseEntity: ResponseEntity<T>)
    {
        Assertions.assertThat(responseEntity.statusCode).isEqualTo(HttpStatus.UNAUTHORIZED)
    }

    fun <T> assertSuccess(responseEntity: ResponseEntity<T>)
    {
        Assertions.assertThat(responseEntity.statusCode).isEqualTo(HttpStatus.OK)
    }

    fun <T> assertLoginLocation(responseEntity: ResponseEntity<T>)
    {
        Assertions.assertThat(responseEntity.headers.location!!.toString()).isEqualTo("/login")
    }

    fun assertSecureWithError(isAuthorized: IsAuthorized,
                              responseEntity: ResponseEntity<String>,
                              httpStatus: HttpStatus,
                              errorCode: String,
                              errorDetail: String? = null,
                              errorTrace: String? = null)
    {

        when (isAuthorized)
        {
            IsAuthorized.TRUE ->
            {
                Assertions.assertThat(responseEntity.headers.contentType!!.toString()).isEqualTo("application/json")
                Assertions.assertThat(responseEntity.statusCode).isEqualTo(httpStatus)
                JSONValidator().validateError(responseEntity.body!!, errorCode, errorDetail, errorTrace)
            }
            IsAuthorized.FALSE ->
            {
                assertUnauthorized(responseEntity)
            }
        }
    }

    fun assertError(responseEntity: ResponseEntity<String>,
                    httpStatus: HttpStatus,
                    errorCode: String,
                    errorDetail: String? = null,
                    errorTrace: String? = null)
    {

        Assertions.assertThat(responseEntity.headers.contentType!!.toString()).isEqualTo("application/json")
        Assertions.assertThat(responseEntity.statusCode).isEqualTo(httpStatus)
        JSONValidator().validateError(responseEntity.body!!, errorCode, errorDetail, errorTrace)

    }

    enum class IsAuthorized
    {
        TRUE,
        FALSE
    }

    private fun clear()
    {
        testRestTemplate.restTemplate.interceptors.clear()
    }

    protected fun authorize()
    {
        testRestTemplate.restTemplate.interceptors.add(AuthInterceptor(testRestTemplate))
    }

    protected fun getResponseData(entity: ResponseEntity<String>): JsonNode
    {
        return ObjectMapper().readTree(entity.body)["data"]
    }

    fun getMockModelOptions(): Map<String, Any>
    {
        return mapOf(
                "spectrum_plhiv_calibration_level" to "national",
                "spectrum_plhiv_calibration_strat" to "sex_age_group",
                "spectrum_artnum_calibration_level" to "national",
                "spectrum_artnum_calibration_strat" to "sex_age_coarse",
                "spectrum_infections_calibration_level" to "national",
                "spectrum_infections_calibration_strat" to "sex_age_coarse",
                "spectrum_aware_calibration_level" to "national",
                "spectrum_aware_calibration_strat" to "sex_age_coarse",
                "calibrate_method" to "logistic")
    }
}
