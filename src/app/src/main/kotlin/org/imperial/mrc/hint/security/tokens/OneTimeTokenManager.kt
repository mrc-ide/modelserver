package org.imperial.mrc.hint.security.tokens

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.db.TokenRepository
import org.pac4j.core.profile.CommonProfile
import org.pac4j.jwt.config.signature.RSASignatureConfiguration
import org.pac4j.jwt.profile.JwtGenerator
import org.springframework.stereotype.Component
import java.time.Duration
import java.security.KeyPair
import java.security.SecureRandom
import java.time.Instant
import java.util.*

@Component
class OneTimeTokenManager(
        appProperties: AppProperties,
        private val tokenRepository: TokenRepository
)
{
    private val keyPair: KeyPair = KeyHelper.keyPair
    private val signatureConfiguration = RSASignatureConfiguration(keyPair)
    private val generator = JwtGenerator<CommonProfile>(signatureConfiguration)
    private val issuer = appProperties.tokenIssuer
    private val random = SecureRandom()


    fun generateOnetimeSetPasswordToken(user: CommonProfile): String
    {
        val token= generator.generate(mapOf(
                "iss" to issuer,
                "sub" to user.username,
                "exp" to Date.from(Instant.now().plus(Duration.ofDays(1))),
                "nonce" to getNonce()
        ))

        tokenRepository.storeToken(token)

        return token
    }

    fun verifyOneTimeToken(compressedToken: String, oneTimeTokenChecker: OneTimeTokenChecker): Map<String, Any>
    {
        val authenticator = OneTimeTokenAuthenticator(signatureConfiguration, oneTimeTokenChecker, issuer)
        return authenticator.validateTokenAndGetClaims(compressedToken)
    }

    private fun getNonce(): String
    {
        val bytes = ByteArray(32)
        random.nextBytes(bytes)
        return Base64.getEncoder().encodeToString(bytes)
    }
}