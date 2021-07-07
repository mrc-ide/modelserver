package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ArrayNode
import com.fasterxml.jackson.databind.node.ObjectNode
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.db.Tables.PROJECT
import org.imperial.mrc.hint.db.Tables.PROJECT_VERSION
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.springframework.boot.test.web.client.exchange
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.*
import org.springframework.util.LinkedMultiValueMap
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.*

class ProjectTests : VersionFileTests()
{

    private val testState = "{\"state\": \"test\"}"

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can create new project`(isAuthorized: IsAuthorized)
    {
        val result = createProject()
        assertSecureWithSuccess(isAuthorized,result,null)

        if(isAuthorized == IsAuthorized.TRUE)
        {
            val data = getResponseData(result)

            assertThat(data["id"].asInt()).isGreaterThan(0)
            assertThat(data["name"].asText()).isEqualTo("testProject")
            val versions = data["versions"] as ArrayNode
            assertThat(versions.count()).isEqualTo(1)
            assertThat(versions[0]["id"].asText().count()).isGreaterThan(0)
            assertThat(versions[0]["versionNumber"].asInt()).isEqualTo(1)
            LocalDateTime.parse(versions[0]["created"].asText(), DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            LocalDateTime.parse(versions[0]["updated"].asText(), DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can save project note`(isAuthorized: IsAuthorized)
    {
        val result = createProject()
        assertSecureWithSuccess(isAuthorized,result,null)

        if(isAuthorized == IsAuthorized.TRUE)
        {
            val data = getResponseData(result)
            assertThat(data["id"].asInt()).isGreaterThan(0)
            assertThat(data["name"].asText()).isEqualTo("testProject")
            val projectId = data["id"].asInt()

            val savedProject = dsl.select(PROJECT.NOTE,
                    PROJECT.NAME)
                    .from(PROJECT)
                    .where(PROJECT.ID.eq(projectId))
                    .fetchOne()

            assertThat(savedProject[PROJECT_VERSION.NOTE]).isEqualTo("notes")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can save version note`(isAuthorized: IsAuthorized)
    {
        val result = createProject()
        assertSecureWithSuccess(isAuthorized,result,null)

        if(isAuthorized == IsAuthorized.TRUE)
        {
            val data = getResponseData(result)
            assertThat(data["id"].asInt()).isGreaterThan(0)
            assertThat(data["name"].asText()).isEqualTo("testProject")
            val projectId = data["id"].asInt()

            val versions = data["versions"] as ArrayNode
            val versionId = versions[0]["id"].asText()

            val map = LinkedMultiValueMap<String, String>()
            map.add("note", "test version note")
            map.add("parent", versionId)
            val headers = HttpHeaders()
            headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
            val httpEntity = HttpEntity(map, headers)

            val newVersionResult = testRestTemplate.postForEntity<String>("/project/${projectId}/version/", httpEntity)

            val newVersionData = getResponseData(newVersionResult)
            val newVersionId = newVersionData["id"].asText()

            val version = dsl.select(PROJECT_VERSION.NOTE)
                    .from(PROJECT_VERSION)
                    .where(PROJECT_VERSION.ID.eq(newVersionId))
                    .fetchOne()

            assertThat(version[PROJECT_VERSION.NOTE]).isEqualTo("test version note")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can update project note`(isAuthorized: IsAuthorized)
    {
        val result = createProject()
        assertSecureWithSuccess(isAuthorized,result,null)

        if(isAuthorized == IsAuthorized.TRUE)
        {
            val data = getResponseData(result)
            assertThat(data["id"].asInt()).isGreaterThan(0)
            assertThat(data["name"].asText()).isEqualTo("testProject")

            val projectId = data["id"].asInt()
            val results = saveProjectNote(projectId)
            assertThat(results.statusCode).isEqualTo(HttpStatus.OK)

            val savedProject = dsl.select(PROJECT.NOTE,
                    PROJECT.NAME)
                    .from(PROJECT)
                    .where(PROJECT.ID.eq(projectId))
                    .fetchOne()

            assertThat(savedProject[PROJECT_VERSION.NOTE]).isEqualTo("test note")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can promote project note`(isAuthorized: IsAuthorized)
    {
        val result = createProject()
        assertSecureWithSuccess(isAuthorized,result,null)

        if(isAuthorized == IsAuthorized.TRUE)
        {
            val data = getResponseData(result)
            assertThat(data["id"].asInt()).isGreaterThan(0)
            assertThat(data["name"].asText()).isEqualTo("testProject")

            val projectId = data["id"].asInt()
            val versions = data["versions"] as ArrayNode
            val versionId = versions[0]["id"].asText()

            val map = LinkedMultiValueMap<String, String>()
            map.add("name", "newProject")
            map.add("note", "test promote project note")
            val headers = HttpHeaders()
            headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
            val httpEntity = HttpEntity(map, headers)

            val promoteProjectResult = testRestTemplate.postForEntity<String>("/project/$projectId/version/$versionId/promote", httpEntity)

            val promoteProjData = getResponseData(promoteProjectResult)

            val promotedVersions = promoteProjData["versions"] as ArrayNode
            val promoteProjId = promotedVersions[0]["id"].asText()

            val savedProjectVersion = dsl.select(PROJECT_VERSION.NOTE)
                    .from(PROJECT_VERSION)
                    .where(PROJECT_VERSION.ID.eq(promoteProjId))
                    .fetchOne()

            assertThat(savedProjectVersion[PROJECT_VERSION.NOTE]).isEqualTo("test promote project note")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can update version note`(isAuthorized: IsAuthorized)
    {
        val result = createProject()
        assertSecureWithSuccess(isAuthorized,result,null)

        if(isAuthorized == IsAuthorized.TRUE)
        {
            val data = getResponseData(result)
            assertThat(data["id"].asInt()).isGreaterThan(0)
            assertThat(data["name"].asText()).isEqualTo("testProject")

            val projectId = data["id"].asInt()
            val versions = data["versions"] as ArrayNode
            val versionId = versions[0]["id"].asText()
            val results = saveVersionNote(projectId, versionId)
            assertThat(results.statusCode).isEqualTo(HttpStatus.OK)

            val savedVersion = dsl.select(PROJECT_VERSION.NOTE)
                    .from(PROJECT_VERSION)
                    .where(PROJECT_VERSION.ID.eq(versionId))
                    .fetchOne()

            assertThat(savedVersion[PROJECT_VERSION.NOTE]).isEqualTo("test note")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can create new version from parent`(isAuthorized: IsAuthorized)
    {
        val createResult = createProject()
        assertSecureWithSuccess(isAuthorized,createResult,null)

        if(isAuthorized == IsAuthorized.TRUE)
        {
            val createProjectData = getResponseData(createResult)
            val projectId = createProjectData["id"].asInt()
            val versions = createProjectData["versions"] as ArrayNode
            val versionId = versions[0]["id"].asText()
            getUpdateVersionStateResult(projectId, versionId, testState)

            val result = getNewVersionResult(projectId, versionId)
            val data = getResponseData(result)

            val newVersionId = data["id"].asText()
            assertThat(newVersionId.count()).isGreaterThan(0)
            assertThat(data["versionNumber"].asInt()).isEqualTo(2)
            LocalDateTime.parse(data["created"].asText(), DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            LocalDateTime.parse(data["updated"].asText(), DateTimeFormatter.ISO_LOCAL_DATE_TIME)

            val savedProject = dsl.select(PROJECT_VERSION.STATE,
                    PROJECT_VERSION.CREATED,
                    PROJECT_VERSION.UPDATED)
                    .from(PROJECT_VERSION)
                    .where(PROJECT_VERSION.ID.eq(newVersionId))
                    .fetchOne()

            assertThat(savedProject[PROJECT_VERSION.STATE]).isEqualTo(testState)
            assertThat(savedProject[PROJECT_VERSION.UPDATED]).isEqualTo(savedProject[PROJECT_VERSION.CREATED])
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can return expected English error when copy nonexistent version`(isAuthorized: IsAuthorized)
    {
        val result = getNewVersionResult(1, "nonExistent")
        assertSecureWithHttpStatus(isAuthorized,result,null,HttpStatus.BAD_REQUEST)

        if(isAuthorized == IsAuthorized.TRUE)
        {
            val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
            val msg = errors[0]["detail"].asText()
            assertThat(msg).isEqualTo("Version does not exist.")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can return expected French error when copy nonexistent version`(isAuthorized: IsAuthorized)
    {
        val result = getNewVersionResult(1, "nonExistent", "fr")
        assertSecureWithHttpStatus(isAuthorized,result,null,HttpStatus.BAD_REQUEST)
        if(isAuthorized == IsAuthorized.TRUE)
        {
            val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
            val msg = errors[0]["detail"].asText()
            assertThat(msg).isEqualTo("La version n'existe pas.")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can update version state`(isAuthorized: IsAuthorized)
    {
        val createResult = createProject()

        assertSecureWithSuccess(isAuthorized,createResult,null)
        if(isAuthorized == IsAuthorized.TRUE)
        {
        val data = getResponseData(createResult)
        val projectId = data["id"].asInt()
        val versions = data["versions"] as ArrayNode
        val versionId = versions[0]["id"].asText()
            getUpdateVersionStateResult(projectId, versionId, testState)
            val savedProject = dsl.select(PROJECT_VERSION.STATE,
                    PROJECT_VERSION.CREATED,
                    PROJECT_VERSION.UPDATED)
                    .from(PROJECT_VERSION)
                    .where(PROJECT_VERSION.ID.eq(versionId))
                    .fetchOne()

            assertThat(savedProject[PROJECT_VERSION.STATE]).isEqualTo(testState)
            assertThat(savedProject[PROJECT_VERSION.UPDATED]).isAfter(savedProject[PROJECT_VERSION.CREATED])
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can return expected English error when update nonexistent version state`(isAuthorized: IsAuthorized)
    {
        val result = getUpdateVersionStateResult(1, "nonExistent", "testState")
        assertSecureWithHttpStatus(isAuthorized,result,null,HttpStatus.BAD_REQUEST)
        if(isAuthorized == IsAuthorized.TRUE)
        {
            val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
            val msg = errors[0]["detail"].asText()
            assertThat(msg).isEqualTo("Version does not exist.")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can return expected French error when update nonexistent version state`(isAuthorized: IsAuthorized)
    {
        val result = getUpdateVersionStateResult(1, "nonExistent", "testState",
                "fr")
        assertSecureWithHttpStatus(isAuthorized,result,null,HttpStatus.BAD_REQUEST)
        if (isAuthorized == IsAuthorized.TRUE)
        {
            val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
            val msg = errors[0]["detail"].asText()
            assertThat(msg).isEqualTo("La version n'existe pas.")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get projects`(isAuthorized: IsAuthorized)
    {

        val createResult = createProject()
        val result = testRestTemplate.getForEntity<String>("/projects/")
        assertSecureWithSuccess(isAuthorized,createResult,null)
        if(isAuthorized == IsAuthorized.TRUE)
        {
            val data = getResponseData(result) as ArrayNode
            val createData = getResponseData(createResult) as ObjectNode
            assertThat(data.count()).isEqualTo(1)
            assertThat(data[0]["id"]).isEqualTo(createData["id"])
            assertThat(data[0]["name"].asText()).isEqualTo("testProject")
            val versions = data[0]["versions"] as ArrayNode
            assertThat(versions.count()).isEqualTo(1)
            val createVersions = createData["versions"] as ArrayNode
            assertThat(versions[0]["id"]).isEqualTo(createVersions[0]["id"])
            assertThat(versions[0]["versionNumber"].asInt()).isEqualTo(1)
            assertThat(versions[0]["created"]).isEqualTo(createVersions[0]["created"])
            assertThat(versions[0]["updated"]).isEqualTo(createVersions[0]["updated"])
        }

    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get current project`(isAuthorized: IsAuthorized)
    {
        val createResult = createProject()
        val result = testRestTemplate.getForEntity<String>("/project/current")
        assertSecureWithSuccess(isAuthorized,createResult,null)
        if(isAuthorized == IsAuthorized.TRUE)
        {
            val data = getResponseData(result)
            assertThat(data["project"]["name"].asText()).isEqualTo("testProject")
        }

    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can get version details`(isAuthorized: IsAuthorized)
    {
        var projectId:Int? =null
        var versionId:String? = null
        var pjnzHash:String? = null

        val createResult = createProject()
        assertSecureWithSuccess(isAuthorized,createResult,null)
        if(isAuthorized == IsAuthorized.TRUE)
        {
            val createProjectData = getResponseData(createResult)
            projectId = createProjectData["id"].asInt()
            val versions = createProjectData["versions"] as ArrayNode
            versionId = versions[0]["id"].asText()
            getUpdateVersionStateResult(projectId, versionId, "TEST STATE")
            pjnzHash = setUpVersionFileAndGetHash("Botswana2018.PJNZ", "/baseline/pjnz/")
        }
        val result = testRestTemplate.getForEntity<String>("/project/$projectId/version/$versionId")
        assertSecureWithSuccess(isAuthorized, result,null)
        if(isAuthorized == IsAuthorized.TRUE)
        {
            val data = getResponseData(result)
            assertThat(data["state"].asText()).isEqualTo("TEST STATE")
            assertThat(data["files"]["pjnz"]["hash"].asText()).isEqualTo(pjnzHash)
            assertThat(data["files"]["pjnz"]["filename"].asText()).isEqualTo("Botswana2018.PJNZ")
        }

    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can return expected English error when get nonexistent version details`(isAuthorized: IsAuthorized)
    {
        val result = testRestTemplate.getForEntity<String>("/project/99/version/noversion")
        assertSecureWithHttpStatus(isAuthorized,result,null,HttpStatus.BAD_REQUEST)
        if (isAuthorized == IsAuthorized.TRUE)
        {
            val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
            val msg = errors[0]["detail"].asText()
            assertThat(msg).isEqualTo("Version does not exist.")
        }

    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can return expected French error when get nonexistent version details`(isAuthorized: IsAuthorized)
    {
        val headers = getStandardHeaders("fr")
        val httpEntity = HttpEntity<String>(headers)

        val result = testRestTemplate.exchange<String>("/project/99/version/noversion", HttpMethod.GET, httpEntity)
        assertSecureWithHttpStatus(isAuthorized, result, null,HttpStatus.BAD_REQUEST)
        if(isAuthorized == IsAuthorized.TRUE)
        {
            val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
            val msg = errors[0]["detail"].asText()
            assertThat(msg).isEqualTo("La version n'existe pas.")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can delete project`(isAuthorized: IsAuthorized)
    {
        val createResult = createProject()
        assertSecureWithSuccess(isAuthorized,createResult,null)

        if(isAuthorized == IsAuthorized.TRUE)
        {
            val createProjectData = getResponseData(createResult)
            val projectId = createProjectData["id"].asInt()
            createProjectData["versions"] as ArrayNode

            var result = testRestTemplate.getForEntity<String>("/projects/")
            var data = getResponseData(result) as ArrayNode
            assertThat(data.count()).isEqualTo(1)

            testRestTemplate.delete("/project/$projectId")

            result = testRestTemplate.getForEntity<String>("/projects/")
            data = getResponseData(result) as ArrayNode
            assertThat(data.count()).isEqualTo(0)
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can rename project`(isAuthorized: IsAuthorized)
    {
        val createResult = createProject()
        assertSecureWithSuccess(isAuthorized,createResult,null)

        if(isAuthorized == IsAuthorized.TRUE)
        {
            val createProjectData = getResponseData(createResult)
            val projectId = createProjectData["id"].asInt()
            createProjectData["versions"] as ArrayNode

            var result = testRestTemplate.getForEntity<String>("/projects/")
            var data = getResponseData(result) as ArrayNode
            assertThat(data.count()).isEqualTo(1)

            val map = LinkedMultiValueMap<String, String>()
            map.add("name", "renamedProject")
            map.add("note", "new project notes")
            val headers = HttpHeaders()
            headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
            val httpEntity = HttpEntity(map, headers)

            testRestTemplate.postForEntity<String>("/project/$projectId/rename", httpEntity)

            result = testRestTemplate.getForEntity<String>("/projects/")
            data = getResponseData(result) as ArrayNode
            assertThat(data.count()).isEqualTo(1)
            assertThat(data[0]["name"].asText()).isEqualTo("renamedProject")
            assertThat(data[0]["note"].asText()).isEqualTo("new project notes")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can return expected English error when delete nonexistent project`(isAuthorized: IsAuthorized)
    {
        val headers = getStandardHeaders("en")
        val httpEntity = HttpEntity<String>(headers)

        val result = testRestTemplate.exchange<String>("/project/99/", HttpMethod.DELETE, httpEntity)
        assertSecureWithHttpStatus(isAuthorized,result,null,HttpStatus.BAD_REQUEST)

        if(isAuthorized == IsAuthorized.TRUE)
        {
            val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
            val msg = errors[0]["detail"].asText()
            assertThat(msg).isEqualTo("Project does not exist.")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can return expected French error when delete nonexistent project`(isAuthorized: IsAuthorized)
    {
        val headers = getStandardHeaders("fr")
        val httpEntity = HttpEntity<String>(headers)

        val result = testRestTemplate.exchange<String>("/project/99", HttpMethod.DELETE, httpEntity)
        assertSecureWithHttpStatus(isAuthorized,result,null, HttpStatus.BAD_REQUEST)

        if(isAuthorized == IsAuthorized.TRUE)
        {
            val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
            val msg = errors[0]["detail"].asText()
            assertThat(msg).isEqualTo("Le projet n'existe pas.")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can delete version`(isAuthorized: IsAuthorized)
    {
        val createResult = createProject()
        assertSecureWithSuccess(isAuthorized,createResult,null)

        if(isAuthorized == IsAuthorized.TRUE)
        {
            val createProjectData = getResponseData(createResult)
            val projectId = createProjectData["id"].asInt()
            val versions = createProjectData["versions"] as ArrayNode
            val versionId1 = versions[0]["id"].asText()
            val newVersionResult = getNewVersionResult(projectId, versionId1)
            val newVersionData = getResponseData(newVersionResult)
            val versionId2 = newVersionData["id"].asText()

            testRestTemplate.delete("/project/$projectId/version/$versionId1")

            val result = testRestTemplate.getForEntity<String>("/projects/")
            val data = getResponseData(result) as ArrayNode
            assertThat(data.count()).isEqualTo(1)
            val versionsData = data[0]["versions"] as ArrayNode
            assertThat(versionsData.count()).isEqualTo(1)
            assertThat(versionsData[0]["id"].asText()).isEqualTo(versionId2)
        }

    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can promote version`(isAuthorized: IsAuthorized)
    {
        if(isAuthorized == IsAuthorized.TRUE)
        {
            val createResult = createProject()
            val createProjectData = getResponseData(createResult)
            val projectId = createProjectData["id"].asInt()
            val versions = createProjectData["versions"] as ArrayNode
            val versionId = versions[0]["id"].asText()
            getUpdateVersionStateResult(projectId, versionId, testState)


            val map = LinkedMultiValueMap<String, String>()
            map.add("name", "newProject")
            val headers = HttpHeaders()
            headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
            val httpEntity = HttpEntity(map, headers)

            testRestTemplate.postForEntity<String>("/project/$projectId/version/$versionId/promote", httpEntity)

            val result = testRestTemplate.getForEntity<String>("/projects/")
            val data = getResponseData(result) as ArrayNode
            assertThat(data.count()).isEqualTo(2)
            assertThat(data[0]["name"].asText()).isEqualTo("newProject")
            val newVersionsData = data[0]["versions"] as ArrayNode
            val oldVersionsData = data[1]["versions"] as ArrayNode
            assertThat(newVersionsData.count()).isEqualTo(1)
            assertThat(oldVersionsData.count()).isEqualTo(1)

            val newVersionId = newVersionsData[0]["id"].asText()
            assertThat(newVersionId.count()).isGreaterThan(0)

            val newProject = dsl.select(PROJECT_VERSION.STATE,
                    PROJECT_VERSION.CREATED,
                    PROJECT_VERSION.UPDATED)
                    .from(PROJECT_VERSION)
                    .where(PROJECT_VERSION.ID.eq(newVersionId))
                    .fetchOne()

            assertThat(newProject[PROJECT_VERSION.STATE]).isEqualTo(testState)
            assertThat(newProject[PROJECT_VERSION.UPDATED]).isEqualTo(newProject[PROJECT_VERSION.CREATED])
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can return expected English error when delete nonexistent version`(isAuthorized: IsAuthorized)
    {
        val headers = getStandardHeaders("en")
        val httpEntity = HttpEntity<String>(headers)

        val result = testRestTemplate.exchange<String>("/project/99/version/nonexistent", HttpMethod.DELETE, httpEntity)
        assertSecureWithHttpStatus(isAuthorized,result,null, HttpStatus.BAD_REQUEST)
        if(isAuthorized == IsAuthorized.TRUE)
        {
            val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
            val msg = errors[0]["detail"].asText()
            assertThat(msg).isEqualTo("Version does not exist.")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can return expected French error when delete nonexistent version`(isAuthorized: IsAuthorized)
    {
        val headers = getStandardHeaders("fr")
        val httpEntity = HttpEntity<String>(headers)

        val result = testRestTemplate.exchange<String>("/project/99/version/nonexistent", HttpMethod.DELETE, httpEntity)
        assertSecureWithHttpStatus(isAuthorized,result,null, HttpStatus.BAD_REQUEST)
        if(isAuthorized == IsAuthorized.TRUE)
        {
            val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
            val msg = errors[0]["detail"].asText()
            assertThat(msg).isEqualTo("La version n'existe pas.")
        }
    }

    @ParameterizedTest
    @EnumSource(IsAuthorized::class)
    fun `can clone project`(isAuthorized: IsAuthorized)
    {
        var projectId:Int? = null
        val createResult = createProject()
        assertSecureWithSuccess(isAuthorized, createResult, null)
        if(isAuthorized == IsAuthorized.TRUE)
        {
            val createProjectData = getResponseData(createResult)
            projectId = createProjectData["id"].asInt()
            val versions = createProjectData["versions"] as ArrayNode
            val versionId = versions[0]["id"].asText()
            getUpdateVersionStateResult(projectId, versionId, testState)
        }

        val email = "user@email.com"
        val email2 = "another.user@email.com"
        userRepo.addUser(email, "password")
        userRepo.addUser(email2, "password")

        val result = testRestTemplate.postForEntity<String>("/project/$projectId/clone/",
                    getCloneProjectEntity(listOf(email, email2)))

        assertSecureWithSuccess(isAuthorized,result,null)
        if(isAuthorized == IsAuthorized.TRUE)
        {
            val newProjects = dsl.selectFrom(PROJECT)
                    .where(PROJECT.USER_ID.eq(email))
                    .or(PROJECT.USER_ID.eq(email2))
                    .fetch()
                    .map {
                        it[PROJECT.ID]
                    }

            assertThat(newProjects.count()).isEqualTo(2)

            val oldVersions = dsl.selectFrom(PROJECT_VERSION)
                    .where(PROJECT_VERSION.PROJECT_ID.eq(projectId))
                    .fetch()

            newProjects.forEach {
                val newVersions = dsl.selectFrom(PROJECT_VERSION)
                        .where(PROJECT_VERSION.PROJECT_ID.eq(it))
                        .fetch()

                assertThat(newVersions.count()).isEqualTo(1)
                assertThat(newVersions[0].state).isEqualTo(oldVersions[0].state)
                assertThat(newVersions[0].versionNumber).isEqualTo(oldVersions[0].versionNumber)
                assertThat(newVersions[0].created).isEqualTo(oldVersions[0].created)
                assertThat(newVersions[0].updated).isEqualTo(oldVersions[0].updated)
                assertThat(newVersions[0].deleted).isEqualTo(oldVersions[0].deleted)
            }
        }
    }

    private fun createProject(): ResponseEntity<String>
    {
        val map = LinkedMultiValueMap<String, String>()
        map.add("name", "testProject")
        map.add("note", "notes")
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
        val httpEntity = HttpEntity(map, headers)
        return testRestTemplate.postForEntity<String>("/project/", httpEntity)
    }

    private fun getCloneProjectEntity(emails: List<String>): HttpEntity<Any>
    {
        val map = LinkedMultiValueMap<String, String>()
        map.add("emails", emails.joinToString(","))
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
        return HttpEntity(map, headers)
    }

    private fun getUpdateVersionStateResult(projectId: Int, versionId: String, state: String,
                                            language: String? = null): ResponseEntity<String>
    {
        val headers = getStandardHeaders(language)

        val httpEntity = HttpEntity(state, headers)
        val url = "/project/$projectId/version/$versionId/state/"
        return testRestTemplate.postForEntity<String>(url, httpEntity)
    }

    private fun saveProjectNote(projectId: Int): ResponseEntity<String>
    {
        val headers = HttpHeaders()
        val map = LinkedMultiValueMap<String, String>()
        map.add("note", "test note")

        val httpEntity = HttpEntity(map, headers)
        val url = "/project/$projectId/note"
        return testRestTemplate.postForEntity<String>(url, httpEntity)
    }

    private fun saveVersionNote(projectId: Int, versionId: String): ResponseEntity<String>
    {
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED

        val map = LinkedMultiValueMap<String, String>()
        map.add("note", "test note")

        val httpEntity = HttpEntity(map, headers)
        val url = "/project/$projectId/version/$versionId/note"
        return testRestTemplate.postForEntity<String>(url, httpEntity)
    }

    private fun getNewVersionResult(projectId: Int, versionId: String, language: String? = null): ResponseEntity<String>
    {
        val headers = getStandardHeaders(language)
        val httpEntity = HttpEntity(null, headers)
        val url = "/project/$projectId/version/?parent=$versionId"
        return testRestTemplate.postForEntity<String>(url, httpEntity)
    }

    private fun getStandardHeaders(language: String?): HttpHeaders
    {
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        if (language != null)
        {
            headers.acceptLanguage = mutableListOf(Locale.LanguageRange(language))
        }

        return headers
    }
}
