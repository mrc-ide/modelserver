package org.imperial.mrc.hint.integration.clients

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.clients.ADRClient
import org.imperial.mrc.hint.ConfiguredAppProperties
import org.junit.jupiter.api.Test

class ADRClientTests {

    @Test
    fun `can parse successful response from ADR`() {
        val sut = ADRClient(ConfiguredAppProperties(), "fakekey")
        val response = sut.get("/organization_list_for_user")
        assertThat(response.statusCodeValue).isEqualTo(200)
        val data = ObjectMapper().readValue<JsonNode>(response.body!!)["data"]
        assertThat(data.isArray).isTrue()
        assertThat(data.count()).isEqualTo(0) // no orgs because the key isn't valid
    }

    @Test
    fun `can parse error response from ADR`() {
        val sut = ADRClient(ConfiguredAppProperties(), "fakekey")
        val response = sut.get("/member_list?id=nonsense")
        assertThat(response.statusCodeValue).isEqualTo(500)
        val errors = ObjectMapper().readValue<JsonNode>(response.body!!)["errors"]
        assertThat(errors.isArray).isTrue()
        assertThat(errors.count()).isEqualTo(1)
        assertThat(errors[0]["error"].textValue()).isEqualTo("ADR_ERROR")
        assertThat(errors[0]["detail"].textValue()).isEqualTo("Not found")
    }

    @Test
    fun `returns error if ADR response not correctly formatted`() {
        val sut = ADRClient(ConfiguredAppProperties(), "fakekey")
        val response = sut.get("/garbage")
        assertThat(response.statusCodeValue).isEqualTo(500)
        val errors = ObjectMapper().readValue<JsonNode>(response.body!!)["errors"]
        assertThat(errors.isArray).isTrue()
        assertThat(errors.count()).isEqualTo(1)
        assertThat(errors[0]["error"].textValue()).isEqualTo("OTHER_ERROR")
        assertThat(errors[0]["detail"].textValue()).isEqualTo("Could not parse response.")
    }
}