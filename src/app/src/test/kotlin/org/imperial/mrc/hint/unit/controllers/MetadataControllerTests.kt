package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.controllers.MetadataController
import org.junit.jupiter.api.Test
import org.springframework.http.ResponseEntity

class MetadataControllerTests
{

    @Test
    fun `gets plotting metadata`()
    {
        val mockResponse = mock<ResponseEntity<String>>()

        val mockAPIClient = mock<HintrAPIClient> {
            on { getPlottingMetadata("MWI") } doReturn mockResponse
        }

        val sut = MetadataController(mockAPIClient)
        val result = sut.plotting("MWI")
        assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `getting hintr version`()
    {
        val mockResponse = mock<ResponseEntity<String>>()

        val mockAPIClient = mock<HintrAPIClient>
        {
            on { getVersion() } doReturn mockResponse
        }

        val sut = MetadataController(mockAPIClient)
        val result = sut.version()
        assertThat(result).isSameAs(mockResponse)
    }

    @Test
    fun `can get uploadToADR metadata`()
    {
        val mockResponse = mock<ResponseEntity<String>>()
        val mockAPIClient = mock<HintrAPIClient> {
            on { getUploadMetadata("id1") } doReturn mockResponse
        }

        val sut = MetadataController(mockAPIClient)
        val result = sut.uploadMetadata("id1")
        assertThat(result).isSameAs(mockResponse)
    }
}