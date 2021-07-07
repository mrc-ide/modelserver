package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.db.ProjectRepository
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.exceptions.UserException
import org.imperial.mrc.hint.logic.UserLogic
import org.imperial.mrc.hint.models.*
import org.imperial.mrc.hint.security.Session
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
class ProjectsController(private val session: Session,
                         private val versionRepository: VersionRepository,
                         private val projectRepository: ProjectRepository,
                         private val userLogic: UserLogic)
{
    @PostMapping("/project/")
    @ResponseBody
    fun newProject(@RequestParam("name") name: String,
                   @RequestParam("note") note: String?): ResponseEntity<String>
    {
        val projectId = projectRepository.saveNewProject(userId(), name, note = note)

        //Generate new version id and set it as the session variable, and save new version to db
        val newVersionId = session.generateVersionId()
        session.setVersionId(newVersionId)
        versionRepository.saveVersion(newVersionId, projectId)

        val version = versionRepository.getVersion(newVersionId)
        val project = Project(projectId, name, listOf(version))
        return SuccessResponse(project).asResponseEntity()
    }

    @PostMapping("/project/{projectId}/clone")
    @ResponseBody
    fun cloneProjectToUser(@PathVariable("projectId") projectId: Int,
                           @RequestParam("emails") emails: List<String>): ResponseEntity<String>
    {

        val userIds = emails.map { userLogic.getUser(it)?.id ?: throw UserException("userDoesNotExist") }
        val currentProject = projectRepository.getProject(projectId, userId())
        userIds.forEach {
            val newProjectId = projectRepository.saveNewProject(it, currentProject.name, userId())
            currentProject.versions.forEach {
                versionRepository.cloneVersion(it.id, session.generateVersionId(), newProjectId)
            }
        }
        return SuccessResponse(null).asResponseEntity()
    }

    @PostMapping("/project/{projectId}/version/")
    fun newVersion(@PathVariable("projectId") projectId: Int,
                   @RequestParam("parent") parentVersionId: String,
                   @RequestParam("note") note: String?): ResponseEntity<String>
    {
        val newVersionId = session.generateVersionId()
        session.setVersionId(newVersionId)
        versionRepository.copyVersion(parentVersionId, newVersionId, projectId, userId(), note)
        val newVersion = versionRepository.getVersion(newVersionId)
        return SuccessResponse(newVersion).asResponseEntity();
    }

    @PostMapping("/project/{projectId}/version/{versionId}/state")
    @ResponseBody
    fun uploadState(@PathVariable("projectId") projectId: Int,
                    @PathVariable("versionId") versionId: String,
                    @RequestBody state: String): ResponseEntity<String>
    {
        versionRepository.saveVersionState(versionId, projectId, userId(), state)
        return EmptySuccessResponse.asResponseEntity()
    }

    @PostMapping("/project/{projectId}/version/{versionId}/promote")
    @ResponseBody
    fun promoteVersion(
        @PathVariable("projectId") projectId: Int,
        @PathVariable("versionId") versionId: String,
        @RequestParam("name") name: String,
        @RequestParam("note") note: String?): ResponseEntity<String>
    {
        val newProjectId = projectRepository.saveNewProject(userId(), name)
        val newVersionId = session.generateVersionId()
        versionRepository.promoteVersion(versionId, newVersionId, newProjectId, userId(), note)

        val version = versionRepository.getVersion(newVersionId)
        val project = Project(newProjectId, name, listOf(version))
        return SuccessResponse(project).asResponseEntity()
    }

    @PostMapping("/project/{projectId}/note")
    @ResponseBody
    fun updateProjectNote(
            @PathVariable("projectId") projectId: Int,
            @RequestParam("note") note: String): ResponseEntity<String>
    {
        projectRepository.updateProjectNote(projectId, userId(), note)
        return EmptySuccessResponse.asResponseEntity()
    }

    @PostMapping("/project/{projectId}/version/{versionId}/note")
    @ResponseBody
    fun updateVersionNote(
            @PathVariable("versionId") versionId: String,
            @PathVariable("projectId") projectId: Int,
            @RequestParam("note") note: String): ResponseEntity<String>
    {
        versionRepository.updateVersionNote(versionId, projectId, userId(), note)
        return EmptySuccessResponse.asResponseEntity()
    }

    @GetMapping("project/{projectId}/version/{versionId}")
    @ResponseBody
    fun loadVersionDetails(@PathVariable("projectId") projectId: Int,
                           @PathVariable("versionId") versionId: String): ResponseEntity<String>
    {
        val versionDetails = versionRepository.getVersionDetails(versionId, projectId, userId())
        session.setVersionId(versionId)
        return SuccessResponse(versionDetails).asResponseEntity();
    }

    @GetMapping("/projects/")
    @ResponseBody
    fun getProjects(): ResponseEntity<String>
    {
        if (session.userIsGuest())
        {
            return ResponseEntity(HttpStatus.UNAUTHORIZED)
        }
        return SuccessResponse(projectRepository.getProjects(userId())).asResponseEntity()
    }

    @DeleteMapping("/project/{projectId}/version/{versionId}")
    @ResponseBody
    fun deleteVersion(@PathVariable("projectId") projectId: Int,
                      @PathVariable("versionId") versionId: String): ResponseEntity<String>
    {
        versionRepository.deleteVersion(versionId, projectId, userId())
        if (session.getVersionId() == versionId){
            session.setVersionId(null)
        }
        return EmptySuccessResponse.asResponseEntity()
    }

    @DeleteMapping("/project/{projectId}")
    @ResponseBody
    fun deleteProject(@PathVariable("projectId") projectId: Int): ResponseEntity<String>
    {
        projectRepository.deleteProject(projectId, userId())
        val currentProject = projectRepository.getProjectFromVersionId(session.getVersionId(), userId())
        if (currentProject.id == projectId){
            session.setVersionId(null)
        }
        return EmptySuccessResponse.asResponseEntity()
    }

    @GetMapping("/project/current")
    @ResponseBody
    fun getCurrentProject(): ResponseEntity<String>
    {
        val versionId = session.getVersionId()
        val currentProject = if (versionRepository.versionExists(versionId, userId()))
        {
            val version = versionRepository.getVersion(versionId)
            val project = projectRepository.getProjectFromVersionId(versionId, userId())
            CurrentProject(project, version)
        }
        else
        {
            CurrentProject(null, null)
        }

        return SuccessResponse(currentProject).asResponseEntity()
    }

    @PostMapping("/project/{projectId}/rename")
    @ResponseBody
    fun renameProject(
        @PathVariable("projectId") projectId: Int,
        @RequestParam("name") name: String,
        @RequestParam("note") note: String?): ResponseEntity<String>
    {
        projectRepository.renameProject(projectId, userId(), name, note)
        return EmptySuccessResponse.asResponseEntity()
    }

    private fun userId(): String
    {
        return session.getUserProfile().id
    }

}
