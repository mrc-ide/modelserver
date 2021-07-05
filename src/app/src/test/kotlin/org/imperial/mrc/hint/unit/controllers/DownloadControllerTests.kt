package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.controllers.DownloadController
import org.junit.jupiter.api.Test
import org.springframework.http.ResponseEntity
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody

class DownloadControllerTests
{
    @Test
    fun `get download spectrum data`()
    {
        val mockResponse = mock<ResponseEntity<String>>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { downloadOutput("spectrum", "id1") } doReturn mockResponse
        }

        val sut = DownloadController(mockAPIClient)
        val result = sut.getDownloadOutput("spectrum", "id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `get download summary data`()
    {
        val mockResponse = mock<ResponseEntity<String>>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { downloadOutput("summary", "id1") } doReturn mockResponse
        }

        val sut = DownloadController(mockAPIClient)
        val result = sut.getDownloadOutput("summary", "id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `get download coarse-output data`()
    {
        val mockResponse = mock<ResponseEntity<String>>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { downloadOutput("coarse-output", "id1") } doReturn mockResponse
        }

        val sut = DownloadController(mockAPIClient)
        val result = sut.getDownloadOutput("coarse-output", "id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `can get download submit status data`()
    {
        val mockResponse = mock<ResponseEntity<String>>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { downloadOutputStatus("id1") } doReturn mockResponse
        }

        val sut = DownloadController(mockAPIClient)
        val result = sut.getDownloadOutputStatus("id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `can get download submit result data`()
    {
        val mockResponse = mock<ResponseEntity<StreamingResponseBody>>()
        val mockApiClient = mock<HintrAPIClient>
        {
            on { downloadOutputResult("id1") } doReturn mockResponse
        }

        val sut = DownloadController(mockApiClient)
        val result = sut.getDownloadOutputResult("id1")
        Assertions.assertThat(result).isSameAs(mockResponse)
    }
}
