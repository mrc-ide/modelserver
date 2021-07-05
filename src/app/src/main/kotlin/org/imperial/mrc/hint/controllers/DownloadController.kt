package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.clients.HintrAPIClient
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody

@RestController
@RequestMapping("/download")
class DownloadController(val apiClient: HintrAPIClient)
{
    @GetMapping("/submit/{type}/{id}")
    @ResponseBody
    fun getDownloadOutput(@PathVariable("type") type: String,
                  @PathVariable("id") id: String): ResponseEntity<String>
    {
        return apiClient.downloadOutput(type, id)
    }

    @GetMapping("/status/{id}")
    @ResponseBody
    fun getDownloadOutputStatus(@PathVariable("id") id: String): ResponseEntity<String>
    {
        return apiClient.downloadOutputStatus(id)
    }

    @GetMapping("/result/{id}")
    @ResponseBody
    fun getDownloadOutputResult(@PathVariable("id") id: String): ResponseEntity<StreamingResponseBody>
    {
        return apiClient.downloadOutputResult(id)
    }
}
