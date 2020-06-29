package org.imperial.mrc.hint.database

import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.db.SessionRepository
import org.imperial.mrc.hint.db.Tables.SESSION_FILE
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.db.tables.UserSession.USER_SESSION
import org.imperial.mrc.hint.exceptions.SessionException
import org.imperial.mrc.hint.helpers.TranslationAssert
import org.imperial.mrc.hint.logic.UserLogic
import org.imperial.mrc.hint.models.SessionFile
import org.jooq.DSLContext
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME

@ActiveProfiles(profiles = ["test"])
@SpringBootTest
@Transactional
class SessionRepositoryTests {

    @Autowired
    private lateinit var sut: SessionRepository

    @Autowired
    private lateinit var versionRepo: VersionRepository

    @Autowired
    private lateinit var userRepo: UserLogic

    @Autowired
    private lateinit var dsl: DSLContext

    private val sessionId = "sid"
    private val testEmail = "test@test.com"

    @Test
    fun `can save session without version id`() {
        userRepo.addUser(testEmail, "pw")
        val uid = userRepo.getUser(testEmail)!!.id
        sut.saveSession(sessionId, uid, null)

        val session = dsl.selectFrom(USER_SESSION)
                .fetchOne()

        assertThat(session[USER_SESSION.USER_ID]).isEqualTo(uid)
        assertThat(session[USER_SESSION.SESSION]).isEqualTo(sessionId)
        assertThat(session[USER_SESSION.VERSION_ID]).isEqualTo(null)
    }

    @Test
    fun `can save session with version id`() {
        userRepo.addUser(testEmail, "pw")
        val uid = userRepo.getUser(testEmail)!!.id
        val versionId = versionRepo.saveNewVersion(uid, "testVersion")
        sut.saveSession(sessionId, uid, versionId)

        val session = dsl.selectFrom(USER_SESSION)
                .fetchOne()

        assertThat(session[USER_SESSION.USER_ID]).isEqualTo(uid)
        assertThat(session[USER_SESSION.SESSION]).isEqualTo(sessionId)
        assertThat(session[USER_SESSION.VERSION_ID]).isEqualTo(versionId)
    }

    @Test
    fun `saveSession is idempotent`() {
        userRepo.addUser(testEmail, "pw")
        val uid = userRepo.getUser(testEmail)!!.id
        sut.saveSession(sessionId, uid, null)
        sut.saveSession(sessionId, uid, null)

        val session = dsl.selectFrom(USER_SESSION)
                .fetchOne()

        assertThat(session[USER_SESSION.USER_ID]).isEqualTo(uid)
        assertThat(session[USER_SESSION.SESSION]).isEqualTo(sessionId)
    }

    @Test
    fun `saveNewHash returns true if a new hash is saved`() {
        val result = sut.saveNewHash("newhash")
        assertThat(result).isTrue()
    }

    @Test
    fun `saveNewHash returns false if the hash already exists`() {
        sut.saveNewHash("newhash")
        val result = sut.saveNewHash("newhash")
        assertThat(result).isFalse()
    }

    @Test
    fun `saves new session file`() {
        setUpSessionAndHash()
        sut.saveSessionFile(sessionId, FileType.PJNZ, "newhash", "original.pjnz")

        val record = dsl.selectFrom(SESSION_FILE)
                .fetchOne()

        assertThat(record[SESSION_FILE.FILENAME]).isEqualTo("original.pjnz")
        assertThat(record[SESSION_FILE.HASH]).isEqualTo("newhash")
        assertThat(record[SESSION_FILE.SESSION]).isEqualTo(sessionId)
        assertThat(record[SESSION_FILE.TYPE]).isEqualTo("pjnz")
    }

    @Test
    fun `correct session file is removed`() {
        setUpSessionAndHash()
        val hash = "newhash"
        sut.saveSessionFile(sessionId, FileType.PJNZ, hash, "original.pjnz")
        assertSessionFileExists(hash)

        // different file type
        sut.removeSessionFile(sessionId, FileType.Survey)
        assertSessionFileExists(hash)

        // different session
        sut.removeSessionFile("wrongid", FileType.PJNZ)
        assertSessionFileExists(hash)

        // correct details
        sut.removeSessionFile(sessionId, FileType.PJNZ)
        val records = dsl.selectFrom(SESSION_FILE)
                .where(SESSION_FILE.HASH.eq(hash))

        assertThat(records.count()).isEqualTo(0)
    }

    @Test
    fun `updates session file if an entry for the given type already exists`() {
        setUpSessionAndHash()
        sut.saveSessionFile(sessionId, FileType.PJNZ, "newhash", "original.pjnz")

        sut.saveNewHash("anotherhash")
        sut.saveSessionFile(sessionId, FileType.PJNZ, "anotherhash", "anotherfilename.pjnz")

        val records = dsl.selectFrom(SESSION_FILE)
                .fetch()

        assertThat(records.count()).isEqualTo(1)
        assertThat(records[0][SESSION_FILE.FILENAME]).isEqualTo("anotherfilename.pjnz")
        assertThat(records[0][SESSION_FILE.HASH]).isEqualTo("anotherhash")
        assertThat(records[0][SESSION_FILE.SESSION]).isEqualTo(sessionId)
        assertThat(records[0][SESSION_FILE.TYPE]).isEqualTo("pjnz")
    }

    @Test
    fun `can get session file hash`() {
        setUpSessionAndHash()
        sut.saveSessionFile(sessionId, FileType.PJNZ, "newhash", "original.pjnz")
        val result = sut.getSessionFile(sessionId, FileType.PJNZ)!!
        assertThat(result.hash).isEqualTo("newhash")
        assertThat(result.filename).isEqualTo("original.pjnz")
    }

    @Test
    fun `can get all session file hashes`() {
        setUpSessionAndHash()
        sut.saveNewHash("pjnzhash")
        sut.saveNewHash("surveyhash")
        sut.saveSessionFile(sessionId, FileType.PJNZ, "pjnzhash", "original.pjnz")
        sut.saveSessionFile(sessionId, FileType.Survey, "surveyhash", "original.csv")
        val result = sut.getHashesForSession(sessionId)
        assertThat(result["survey"]).isEqualTo("surveyhash")
        assertThat(result["pjnz"]).isEqualTo("pjnzhash")
    }

    @Test
    fun `can get all session files`() {
        setUpSessionAndHash()
        sut.saveNewHash("pjnzhash")
        sut.saveNewHash("surveyhash")
        sut.saveSessionFile(sessionId, FileType.PJNZ, "pjnzhash", "original.pjnz")
        sut.saveSessionFile(sessionId, FileType.Survey, "surveyhash", "original.csv")
        val result = sut.getSessionFiles(sessionId)
        assertThat(result["survey"]!!.filename).isEqualTo("original.csv")
        assertThat(result["survey"]!!.hash).isEqualTo("surveyhash")
        assertThat(result["pjnz"]!!.filename).isEqualTo("original.pjnz")
        assertThat(result["pjnz"]!!.hash).isEqualTo("pjnzhash")
    }

    @Test
    fun `can set files for session`() {
        setUpSession()
        sut.saveNewHash("pjnz_hash")
        sut.saveNewHash("shape_hash")

        sut.setFilesForSession(sessionId, mapOf(
                "pjnz" to SessionFile("pjnz_hash", "pjnz_file"),
                "shape" to SessionFile("shape_hash", "shape_file"),
                "population" to null //should not attempt to save a null file
        ));

        val records = dsl.selectFrom(SESSION_FILE)
                .orderBy(SESSION_FILE.TYPE)
                .fetch()

        assertThat(records.count()).isEqualTo(2);

        assertThat(records[0][SESSION_FILE.FILENAME]).isEqualTo("pjnz_file")
        assertThat(records[0][SESSION_FILE.HASH]).isEqualTo("pjnz_hash")
        assertThat(records[0][SESSION_FILE.SESSION]).isEqualTo(sessionId)
        assertThat(records[0][SESSION_FILE.TYPE]).isEqualTo("pjnz")

        assertThat(records[1][SESSION_FILE.FILENAME]).isEqualTo("shape_file")
        assertThat(records[1][SESSION_FILE.HASH]).isEqualTo("shape_hash")
        assertThat(records[1][SESSION_FILE.SESSION]).isEqualTo(sessionId)
        assertThat(records[1][SESSION_FILE.TYPE]).isEqualTo("shape")
    }

    @Test
    fun `setFilesForSession deletes existing files for this session only`() {
        val uid = setUpSession()
        sut.saveSession("sid2", uid, null);

        sut.saveNewHash("shape_hash")
        setUpHashAndSessionFile("old_pjnz_hash", "old_pjnz", sessionId, "pjnz")
        setUpHashAndSessionFile("other_shape_hash", "other_shape_file", "sid2", "shape")

        sut.setFilesForSession(sessionId, mapOf(
                "shape" to SessionFile("shape_hash", "shape_file")))

        val records = dsl.selectFrom(SESSION_FILE)
                .orderBy(SESSION_FILE.SESSION)
                .fetch()

        assertThat(records.count()).isEqualTo(2)

        assertThat(records[0][SESSION_FILE.FILENAME]).isEqualTo("shape_file")
        assertThat(records[0][SESSION_FILE.HASH]).isEqualTo("shape_hash")
        assertThat(records[0][SESSION_FILE.SESSION]).isEqualTo(sessionId)
        assertThat(records[0][SESSION_FILE.TYPE]).isEqualTo("shape")

        assertThat(records[1][SESSION_FILE.FILENAME]).isEqualTo("other_shape_file")
        assertThat(records[1][SESSION_FILE.HASH]).isEqualTo("other_shape_hash")
        assertThat(records[1][SESSION_FILE.SESSION]).isEqualTo("sid2")
        assertThat(records[1][SESSION_FILE.TYPE]).isEqualTo("shape")
    }

    @Test
    fun `setFilesForSession rolls back transaction on error, leaving existing session files unchanged`() {
        setUpSession()
        setUpHashAndSessionFile("pjnz_hash", "pjnz_file", sessionId, "pjnz")

        TranslationAssert.assertThatThrownBy {
            sut.setFilesForSession(sessionId, mapOf(
                    "shape" to SessionFile("bad_hash", "bad_file")))
        }
                .isInstanceOf(SessionException::class.java)
                .hasTranslatedMessage("Unable to load files for session. Specified files do not exist on the server.")

        val records = dsl.selectFrom(SESSION_FILE)
                .orderBy(SESSION_FILE.SESSION)
                .fetch();

        assertThat(records.count()).isEqualTo(1);

        assertThat(records[0][SESSION_FILE.FILENAME]).isEqualTo("pjnz_file")
        assertThat(records[0][SESSION_FILE.HASH]).isEqualTo("pjnz_hash")
        assertThat(records[0][SESSION_FILE.SESSION]).isEqualTo(sessionId)
        assertThat(records[0][SESSION_FILE.TYPE]).isEqualTo("pjnz")

    }

    @Test
    fun `can get session snapshot`()
    {
        val now = LocalDateTime.now(ZoneOffset.UTC)
        val soon = now.plusSeconds(5)
        val uid = setUpSession()
        val snapshot = sut.getSessionSnapshot(sessionId, uid)

        assertThat(snapshot.id).isEqualTo(sessionId)

        val created = LocalDateTime.parse(snapshot.created, ISO_LOCAL_DATE_TIME)
        assertThat(created).isBetween(now, soon)

        val updated = LocalDateTime.parse(snapshot.updated, ISO_LOCAL_DATE_TIME)
        assertThat(updated).isBetween(now, soon)
    }

    private fun assertSessionFileExists(hash: String) {
        val records = dsl.selectFrom(SESSION_FILE)
                .where(SESSION_FILE.HASH.eq(hash))

        assertThat(records.count()).isEqualTo(1)
    }

    private fun setUpSessionAndHash(): String {
        sut.saveNewHash("newhash")
        return setUpSession()
    }

    private fun setUpSession(): String {
        userRepo.addUser(testEmail, "pw")
        val uid = userRepo.getUser(testEmail)!!.id
        val versionId = versionRepo.saveNewVersion(uid, "testversion")
        sut.saveSession(sessionId, uid, versionId)

        return uid
    }

    private fun setUpHashAndSessionFile(hash: String, filename: String, sessionId: String, type: String) {
        sut.saveNewHash(hash)
        dsl.insertInto(SESSION_FILE)
                .set(SESSION_FILE.FILENAME, filename)
                .set(SESSION_FILE.HASH, hash)
                .set(SESSION_FILE.SESSION, sessionId)
                .set(SESSION_FILE.TYPE, type)
                .execute()
    }
}
