package org.imperial.mrc.hint.database

import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.assertj.core.api.AssertionsForClassTypes
import org.imperial.mrc.hint.db.ProjectRepository
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.db.tables.Project.PROJECT
import org.imperial.mrc.hint.db.tables.ProjectVersion.PROJECT_VERSION
import org.imperial.mrc.hint.exceptions.ProjectException
import org.imperial.mrc.hint.logic.UserLogic
import org.jooq.DSLContext
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.sql.Timestamp
import java.time.Instant
import java.time.Instant.now
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

@ActiveProfiles(profiles = ["test"])
@SpringBootTest
@Transactional
class ProjectRepositoryTests
{
    @Autowired
    private lateinit var sut: ProjectRepository

    @Autowired
    private lateinit var userRepo: UserLogic

    @Autowired
    private lateinit var versionRepo: VersionRepository

    @Autowired
    private lateinit var dsl: DSLContext

    private val testEmail = "test@test.com"
    @Test
    fun `can get project`()
    {
        val uid = setupUser()

        val projectId = sut.saveNewProject(uid, "testProjectRepo")
        versionRepo.saveVersion("v1", projectId)
        val project = sut.getProject(projectId, uid)
        assertThat(project.name).isEqualTo("testProjectRepo")
        assertThat(project.sharedBy).isEqualTo(null)
        assertThat(project.id).isEqualTo(projectId)
        assertThat(project.versions.count()).isEqualTo(1)
        assertThat(project.versions[0].versionNumber).isEqualTo(1)
        assertThat(project.versions[0].id).isEqualTo("v1")
        assertThat(project.versions[0].created).isNotNull()
        assertThat(project.versions[0].updated).isNotNull()
    }

    @Test
    fun `can get project notes`()
    {
        val uid = setupUser()

        val projectId = sut.saveNewProject(uid, "testProjectRepo", note = "test project notes")
        versionRepo.saveVersion("v11", projectId)
        val project = sut.getProject(projectId, uid)
        assertThat(project.name).isEqualTo("testProjectRepo")
        assertThat(project.note).isEqualTo("test project notes")
        assertThat(project.id).isEqualTo(projectId)
        assertThat(project.versions[0].id).isEqualTo("v11")
    }

    @Test
    fun `can get project when cloned`()
    {
        val uid = setupUser()

        val projectId = sut.saveNewProject(uid, "testProjectRepo", uid, "test cloned note")
        versionRepo.saveVersion("v1", projectId)
        val project = sut.getProject(projectId, uid)
        assertThat(project.name).isEqualTo("testProjectRepo")
        assertThat(project.sharedBy).isEqualTo(uid)
        assertThat(project.note).isEqualTo("test cloned note")
        assertThat(project.id).isEqualTo(projectId)
        assertThat(project.versions.count()).isEqualTo(1)
        assertThat(project.versions[0].versionNumber).isEqualTo(1)
        assertThat(project.versions[0].id).isEqualTo("v1")
        assertThat(project.versions[0].created).isNotNull()
        assertThat(project.versions[0].updated).isNotNull()
    }

    @Test
    fun `getProject throws project exception if project id does not exist`()
    {

        assertThatThrownBy {
            sut.getProject(1234, "uid")
        }.isInstanceOf(ProjectException::class.java)
                .hasMessageContaining("projectDoesNotExist")
    }

    @Test
    fun `getProject throws project exception if project id does not belong to user`()
    {

        val uid = setupUser()
        val projectId = sut.saveNewProject(uid, "testProjectRepo")
        assertThatThrownBy {
            sut.getProject(projectId, "testProjectRepo")
        }.isInstanceOf(ProjectException::class.java)
                .hasMessageContaining("projectDoesNotExist")
    }

    @Test
    fun `can get project from version id`()
    {
        val uid = setupUser()

        val projectId = sut.saveNewProject(uid, "testProjectRepo", note = "notes")
        versionRepo.saveVersion("v1", projectId, "notes")
        val project = sut.getProjectFromVersionId("v1", uid)
        assertThat(project.name).isEqualTo("testProjectRepo")
        assertThat(project.sharedBy).isEqualTo(null)
        assertThat(project.note).isEqualTo("notes")
        assertThat(project.id).isEqualTo(projectId)
        assertThat(project.versions.count()).isEqualTo(1)
        assertThat(project.versions[0].versionNumber).isEqualTo(1)
        assertThat(project.versions[0].id).isEqualTo("v1")
        assertThat(project.versions[0].created).isNotNull()
        assertThat(project.versions[0].updated).isNotNull()
    }

    @Test
    fun `getProjectFromVersionId throws project exception if project does not exist`()
    {

        assertThatThrownBy {
            sut.getProjectFromVersionId("v1", "uid")
        }.isInstanceOf(ProjectException::class.java)
                .hasMessageContaining("projectDoesNotExist")
    }

    @Test
    fun `getProjectFromVersionId throws project exception if project does not belong to user`()
    {
        val uid = setupUser()
        assertThatThrownBy {
            sut.getProjectFromVersionId("v1", uid)
        }.isInstanceOf(ProjectException::class.java)
                .hasMessageContaining("projectDoesNotExist")
    }

    @Test
    fun `can save new project`()
    {
        val uid = setupUser()

        val projectId = sut.saveNewProject(uid, "testProjectRepo")

        val project = dsl.selectFrom(PROJECT)
                .where(PROJECT.ID.eq(projectId))
                .fetchOne()

        assertThat(project[PROJECT.USER_ID]).isEqualTo(uid)
        assertThat(project[PROJECT.NAME]).isEqualTo("testProjectRepo")
    }

    @Test
    fun `can save cloned project`()
    {
        val uid = setupUser()

        val projectId = sut.saveNewProject(uid, "testProjectRepo", uid, "test note")

        val project = dsl.selectFrom(PROJECT)
                .where(PROJECT.ID.eq(projectId))
                .fetchOne()

        assertThat(project[PROJECT.USER_ID]).isEqualTo(uid)
        assertThat(project[PROJECT.NAME]).isEqualTo("testProjectRepo")
        assertThat(project[PROJECT.SHARED_BY]).isEqualTo(uid)
        assertThat(project[PROJECT.NOTE]).isEqualTo("test note")
    }

    @Test
    fun `delete project throws error if project does not exist`()
    {
        val uid = setupUser()
        AssertionsForClassTypes.assertThatThrownBy { sut.deleteProject(9999, uid) }
                .isInstanceOf(ProjectException::class.java)
                .hasMessageContaining("projectDoesNotExist")
    }

    @Test
    fun `can delete project`()
    {
        val uid = setupUser()

        val projectId = sut.saveNewProject(uid, "testProjectRepo")
        val versionId1 = "testVersion"
        val versionId2 = "testVersion2"
        versionRepo.saveVersion(versionId1, projectId)
        versionRepo.saveVersion(versionId2, projectId)

        sut.deleteProject(projectId, uid)

        val savedVersion1 = dsl.select(PROJECT_VERSION.DELETED)
                .from(PROJECT_VERSION)
                .where(PROJECT_VERSION.ID.eq(versionId1))
                .and(PROJECT_VERSION.PROJECT_ID.eq(projectId))
                .fetchOne()
        assertThat(savedVersion1[PROJECT_VERSION.DELETED]).isTrue()

        val savedVersion2 = dsl.select(PROJECT_VERSION.DELETED)
                .from(PROJECT_VERSION)
                .where(PROJECT_VERSION.ID.eq(versionId2))
                .and(PROJECT_VERSION.PROJECT_ID.eq(projectId))
                .fetchOne()
        assertThat(savedVersion2[PROJECT_VERSION.DELETED]).isTrue()
    }

    @Test
    fun `can rename project`()
    {
        val uid = setupUser()

        val projectId = sut.saveNewProject(uid, "testProjectRepo")
        val versionId1 = "testVersion"
        versionRepo.saveVersion(versionId1, projectId)

        sut.renameProject(projectId, uid, "renamedProject", "project notes")

        val renamedProject = dsl.selectFrom(PROJECT)
                .where(PROJECT.ID.eq(projectId))
                .and(PROJECT.USER_ID.eq(uid))
                .fetchOne()
        assertThat(renamedProject[PROJECT.NAME]).isEqualTo("renamedProject")
        assertThat(renamedProject[PROJECT.NOTE]).isEqualTo("project notes")
    }

    @Test
    fun `can rename project with empty note`()
    {
        val uid = setupUser()

        val projectId = sut.saveNewProject(uid, "testProjectRepo")
        val versionId1 = "testVersion"
        versionRepo.saveVersion(versionId1, projectId)

        sut.renameProject(projectId, uid, "renamedProject")

        val renamedProject = dsl.selectFrom(PROJECT)
                .where(PROJECT.ID.eq(projectId))
                .and(PROJECT.USER_ID.eq(uid))
                .fetchOne()
        assertThat(renamedProject[PROJECT.NAME]).isEqualTo("renamedProject")
        assertThat(renamedProject[PROJECT.NOTE]).isEqualTo(null)
    }

    @Test
    fun `can save project note`()
    {
        val uid = setupUser()

        val projectId = sut.saveNewProject(uid, "testProjectRepo")
        sut.updateProjectNote(projectId, uid, "test project notes")

        val project = dsl.selectFrom(PROJECT)
                .where(PROJECT.ID.eq(projectId))
                .and(PROJECT.USER_ID.eq(uid))
                .fetchOne()
        assertThat(project[PROJECT.NOTE]).isEqualTo("test project notes")
    }

    @Test
    fun `can get projects for user`()
    {
        val userId = setupUser()

        userRepo.addUser("another.user@example.com", "pw")
        val anotherUserId = userRepo.getUser("another.user@example.com")!!.id

        val ago_1h = now().minus(1, ChronoUnit.HOURS)
        val ago_2h = now().minus(2, ChronoUnit.HOURS)
        val ago_3h = now().minus(3, ChronoUnit.HOURS)
        val ago_4h = now().minus(4, ChronoUnit.HOURS)


        val v1Id = insertProject("v1", userId, "another.user@example.com", "test project note")
        val v2Id = insertProject("v2", userId)
        val anotherProject = insertProject("v2", anotherUserId) //should not be returned

        insertVersion("v1s1", v1Id, ago_4h, ago_3h, false, 1)
        insertVersion("v1s2", v1Id, ago_2h, ago_2h, false, 2)

        insertVersion("deletedVersion", v2Id, ago_1h, now(), true, 2) //should not be returned
        insertVersion("v2s1", v2Id, ago_3h, ago_1h, false, 1)

        insertVersion("anotherVersion", anotherProject, ago_1h, ago_1h, false, 3)

        val projects = sut.getProjects(userId)
        assertThat(projects.count()).isEqualTo(2)

        val p2 = projects[0]
        assertThat(p2.id).isEqualTo(v2Id)
        assertThat(p2.name).isEqualTo("v2")
        assertThat(p2.sharedBy).isEqualTo(null)
        assertThat(p2.versions.count()).isEqualTo(1)
        assertThat(p2.versions[0].id).isEqualTo("v2s1")
        assertThat(p2.versions[0].created).isEqualTo(format(ago_3h))
        assertThat(p2.versions[0].updated).isEqualTo(format(ago_1h))
        assertThat(p2.versions[0].versionNumber).isEqualTo(1)

        val p1 = projects[1]
        assertThat(p1.id).isEqualTo(v1Id)
        assertThat(p1.name).isEqualTo("v1")
        assertThat(p1.sharedBy).isEqualTo("another.user@example.com")
        assertThat(p1.note).isEqualTo("test project note")
        assertThat(p1.versions.count()).isEqualTo(2)
        assertThat(p1.versions[0].id).isEqualTo("v1s2")
        assertThat(p1.versions[0].created).isEqualTo(format(ago_2h))
        assertThat(p1.versions[0].updated).isEqualTo(format(ago_2h))
        assertThat(p1.versions[0].versionNumber).isEqualTo(2)
        assertThat(p1.versions[1].id).isEqualTo("v1s1")
        assertThat(p1.versions[1].created).isEqualTo(format(ago_4h))
        assertThat(p1.versions[1].updated).isEqualTo(format(ago_3h))
        assertThat(p1.versions[1].versionNumber).isEqualTo(1)
    }

    private fun setupUser(email: String = testEmail): String
    {
        userRepo.addUser(email, "pw")
        return userRepo.getUser(email)!!.id
    }

    private fun format(time: Instant): String
    {
        val formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME
        return formatter.format(LocalDateTime.ofInstant(time, ZoneId.systemDefault()))
    }

    private fun insertProject(name: String, userId: String, sharedBy: String? = null, note: String? = null): Int
    {
        val saved = dsl.insertInto(PROJECT, PROJECT.USER_ID, PROJECT.NAME, PROJECT.SHARED_BY, PROJECT.NOTE)
                .values(userId, name, sharedBy, note)
                .returning(PROJECT.ID)
                .fetchOne()

        return saved[PROJECT.ID]
    }

    private fun insertVersion(versionId: String, projectId: Int, created: Instant, updated: Instant, deleted: Boolean,
                              versionNumber: Int)
    {
        dsl.insertInto(PROJECT_VERSION,
                PROJECT_VERSION.ID,
                PROJECT_VERSION.PROJECT_ID,
                PROJECT_VERSION.CREATED,
                PROJECT_VERSION.UPDATED,
                PROJECT_VERSION.DELETED,
                PROJECT_VERSION.VERSION_NUMBER)
                .values(versionId, projectId, Timestamp.from(created), Timestamp.from(updated), deleted, versionNumber)
                .execute()
    }
}
