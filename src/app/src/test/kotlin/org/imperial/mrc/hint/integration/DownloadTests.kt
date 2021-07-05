package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.http.ResponseEntity

class DownloadTests : SecureIntegrationTests()
{

    @BeforeEach
    fun setup()
    {
        authorize()
        testRestTemplate.getForEntity<String>("/")
    }

    @Test
    fun `can download coarse output data`()
    {
        val id = waitForModelRunResult()
        val responseEntity = testRestTemplate.getForEntity<String>("/download/submit/coarse-output/$id")
        assertSuccess(responseEntity, "DownloadSubmitResponse")
    }

    @Test
    fun `can download coarse output result`()
    {
        val modelId = waitForModelRunResult()
        val calibrateId = waitForCalibrationResult(modelId)
        val responseId = waitForDownloadOutputResult(calibrateId, "coarse-output")
        val responseEntity = testRestTemplate.getForEntity<ByteArray>("/download/result/$responseId")
        assertSuccess(responseEntity)
        assertResponseHasExpectedDownloadHeaders(responseEntity)
    }

    @Test
    fun `can download summary data`()
    {
        val id = waitForModelRunResult()
        val responseEntity = testRestTemplate.getForEntity<String>("/download/submit/summary/$id")
        assertSuccess(responseEntity, "DownloadSubmitResponse")
    }

    @Test
    fun `can download summary output result`()
    {
        val modelId = waitForModelRunResult()
        val calibrateId = waitForCalibrationResult(modelId)
        val responseId = waitForDownloadOutputResult(calibrateId, "summary")
        val responseEntity = testRestTemplate.getForEntity<ByteArray>("/download/result/$responseId")
        assertSuccess(responseEntity)
        assertResponseHasExpectedDownloadHeaders(responseEntity)
    }

    @Test
    fun `can download spectrum data`()
    {
        val id = waitForModelRunResult()
        val responseEntity = testRestTemplate.getForEntity<String>("/download/submit/spectrum/$id")
        assertSuccess(responseEntity, "DownloadSubmitResponse")
    }

    @Test
    fun `can download spectrum output result`()
    {
        val modelId = waitForModelRunResult()
        val calibrateId = waitForCalibrationResult(modelId)
        val responseId = waitForDownloadOutputResult(calibrateId, "spectrum")
        val responseEntity = testRestTemplate.getForEntity<ByteArray>("/download/result/$responseId")
        assertSuccess(responseEntity)
        assertResponseHasExpectedDownloadHeaders(responseEntity)
    }

    @Test
    fun `can download output status`()
    {
        val responseId = downloadOutputResponseId()
        val responseEntity = testRestTemplate.getForEntity<String>("/download/status/$responseId")
        assertSuccess(responseEntity, "DownloadStatusResponse")
    }

    fun assertResponseHasExpectedDownloadHeaders(response: ResponseEntity<ByteArray>)
    {
        val headers = response.headers
        assertThat(headers["Content-Type"]?.first()).isEqualTo("application/octet-stream")

        val contentLength = headers["Content-Length"]?.first()!!.toInt()
        assertThat(contentLength).isGreaterThan(0)
        val bodyLength = response.body?.count()
        assertThat(contentLength).isEqualTo(bodyLength)
        assertThat(headers["Connection"]?.first()).isNotEqualTo("keep-alive")
    }

    fun downloadOutputResponseId(): String
    {
        val calibrateId = waitForModelRunResult()
        val response = testRestTemplate.getForEntity<String>("/download/submit/spectrum/$calibrateId")

        val bodyJSON = ObjectMapper().readTree(response.body)
        return bodyJSON["data"]["id"].asText()
    }
}
