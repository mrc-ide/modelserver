package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.clients.HintrAPIClient
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import javax.xml.ws.Response

@RestController
@RequestMapping("/meta")
class MetadataController(val apiClient: HintrAPIClient)
{
    @GetMapping("/plotting/{iso3}")
    @ResponseBody
    fun plotting(@PathVariable("iso3") iso3: String): ResponseEntity<String>
    {
        return apiClient.getPlottingMetadata(iso3)
    }

    @GetMapping("/hintr/version")
    @ResponseBody
    fun version(): ResponseEntity<String>
    {
        return apiClient.getVersion()
    }

    @GetMapping("/adr/{id}")
    @ResponseBody
    fun uploadMetadata(@PathVariable("id") id: String): ResponseEntity<String>
    {
        return apiClient.getUploadMetadata(id)
    }
}
