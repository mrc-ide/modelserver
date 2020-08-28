package org.imperial.mrc.hint.database

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.db.ProjectRepository
import org.imperial.mrc.hint.db.tables.Project.PROJECT
import org.imperial.mrc.hint.db.tables.ProjectVersion.PROJECT_VERSION
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
class ProjectRepositoryTests {
    @Autowired
    private lateinit var sut: ProjectRepository

    @Autowired
    private lateinit var userRepo: UserLogic

    @Autowired
    private lateinit var dsl: DSLContext

    private val testEmail = "test@test.com"

    @Test
    fun `can save new project`()
    {
        userRepo.addUser(testEmail, "pw")
        val uid = userRepo.getUser(testEmail)!!.id

        val projectId = sut.saveNewProject(uid, "testProjectRepo")

        val project = dsl.selectFrom(PROJECT)
                .where(PROJECT.ID.eq(projectId))
                .fetchOne()

        assertThat(project[PROJECT.USER_ID]).isEqualTo(uid)
        assertThat(project[PROJECT.NAME]).isEqualTo("testProjectRepo")
    }

    @Test
    fun `can get projects for user`()
    {
        userRepo.addUser(testEmail, "pw")
        val userId = userRepo.getUser(testEmail)!!.id

        userRepo.addUser("another.user@example.com", "pw")
        val anotherUserId = userRepo.getUser("another.user@example.com")!!.id

        val ago_1h = now().minus(1, ChronoUnit.HOURS)
        val ago_2h = now().minus(2, ChronoUnit.HOURS)
        val ago_3h = now().minus(3, ChronoUnit.HOURS)
        val ago_4h = now().minus(4, ChronoUnit.HOURS)


        val v1Id = insertProject("v1", userId)
        val v2Id = insertProject("v2", userId)
        val anotherProject = insertProject("v2", anotherUserId) //should not be returned

        insertSnapshot("v1s1", v1Id, ago_4h, ago_3h, false)
        insertSnapshot("v1s2", v1Id, ago_2h, ago_2h, false)

        insertSnapshot("deletedSnap", v2Id, ago_1h, now(), true) //should not be returned
        insertSnapshot("v2s1", v2Id, ago_3h, ago_1h, false)

        insertSnapshot("anotherSnap", anotherProject, ago_1h, ago_1h, false)

        val projects = sut.getProjects(userId)
        assertThat(projects.count()).isEqualTo(2)

        val p2 = projects[0]
        assertThat(p2.id).isEqualTo(v2Id)
        assertThat(p2.name).isEqualTo("v2")
        assertThat(p2.snapshots.count()).isEqualTo(1)
        assertThat(p2.snapshots[0].id).isEqualTo("v2s1")
        assertThat(p2.snapshots[0].created).isEqualTo(format(ago_3h))
        assertThat(p2.snapshots[0].updated).isEqualTo(format(ago_1h))

        val p1 = projects[1]
        assertThat(p1.id).isEqualTo(v1Id)
        assertThat(p1.name).isEqualTo("v1")
        assertThat(p1.snapshots.count()).isEqualTo(2)
        assertThat(p1.snapshots[0].id).isEqualTo("v1s2")
        assertThat(p1.snapshots[0].created).isEqualTo(format(ago_2h))
        assertThat(p1.snapshots[0].updated).isEqualTo(format(ago_2h))
        assertThat(p1.snapshots[1].id).isEqualTo("v1s1")
        assertThat(p1.snapshots[1].created).isEqualTo(format(ago_4h))
        assertThat(p1.snapshots[1].updated).isEqualTo(format(ago_3h))
    }

    private fun format(time: Instant): String
    {
        val formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME
        return formatter.format(LocalDateTime.ofInstant(time, ZoneId.systemDefault()))
    }

    private fun insertProject(name: String, userId: String): Int
    {
        val saved = dsl.insertInto(PROJECT, PROJECT.USER_ID, PROJECT.NAME)
                .values(userId, name)
                .returning(PROJECT.ID)
                .fetchOne()

        return saved[PROJECT.ID]
    }

    private fun insertSnapshot(snapshotId: String, projectId: Int, created: Instant, updated: Instant, deleted: Boolean)
    {
        dsl.insertInto(PROJECT_VERSION,
                PROJECT_VERSION.ID,
                PROJECT_VERSION.PROJECT_ID,
                PROJECT_VERSION.CREATED,
                PROJECT_VERSION.UPDATED,
                PROJECT_VERSION.DELETED)
                .values(snapshotId, projectId, Timestamp.from(created), Timestamp.from(updated), deleted)
                .execute()
    }
}