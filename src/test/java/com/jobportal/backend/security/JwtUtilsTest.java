package com.jobportal.backend.security;

import com.jobportal.backend.entity.Role;
import com.jobportal.backend.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilsTest {

    private JwtUtils jwtUtils;
    private final String validSecret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private final long expirationMs = 3600000;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", validSecret);
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", expirationMs);
        jwtUtils.init();
    }

    @Test
    void testGenerateAndValidateToken() {
        User user = User.builder()
                .id(1L)
                .name("Test Student")
                .email("student@example.com")
                .password("encoded_pass")
                .role(Role.ROLE_STUDENT)
                .active(true)
                .build();

        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        String token = jwtUtils.generateToken(userDetails);

        assertNotNull(token);
        assertTrue(jwtUtils.validateJwtToken(token));
        assertEquals("student@example.com", jwtUtils.getUsernameFromJwtToken(token));
        assertEquals("ROLE_STUDENT", jwtUtils.getRoleFromJwtToken(token));
        assertEquals(1L, jwtUtils.getIdFromJwtToken(token));
    }

    @Test
    void testValidateTamperedToken() {
        User user = User.builder()
                .id(2L)
                .name("Company Rep")
                .email("company@example.com")
                .password("encoded_pass")
                .role(Role.ROLE_COMPANY)
                .active(true)
                .build();

        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        String token = jwtUtils.generateToken(userDetails);

        String tamperedToken = token.substring(0, token.length() - 5) + "abcde";
        assertFalse(jwtUtils.validateJwtToken(tamperedToken));
    }

    @Test
    void testValidateMalformedToken() {
        assertFalse(jwtUtils.validateJwtToken("not.a.valid.jwt.token"));
        assertFalse(jwtUtils.validateJwtToken(""));
        assertFalse(jwtUtils.validateJwtToken(null));
    }

    @Test
    void testExpiredTokenValidation() throws InterruptedException {
        JwtUtils shortLivedJwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(shortLivedJwtUtils, "jwtSecret", validSecret);
        ReflectionTestUtils.setField(shortLivedJwtUtils, "jwtExpirationMs", 5L);
        shortLivedJwtUtils.init();

        User user = User.builder()
                .id(3L)
                .name("Expiring User")
                .email("expire@example.com")
                .password("pass")
                .role(Role.ROLE_STUDENT)
                .active(true)
                .build();

        String token = shortLivedJwtUtils.generateToken(UserDetailsImpl.build(user));
        Thread.sleep(25);

        assertFalse(shortLivedJwtUtils.validateJwtToken(token));
    }

    @Test
    void testRejectsShortSecretKey() {
        JwtUtils insecureJwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(insecureJwtUtils, "jwtSecret", "too-short-secret");
        ReflectionTestUtils.setField(insecureJwtUtils, "jwtExpirationMs", 3600000L);

        assertThrows(IllegalStateException.class, insecureJwtUtils::init);
    }
}
