package com.jobportal.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.backend.dto.LoginRequest;
import com.jobportal.backend.dto.RegisterRequest;
import com.jobportal.backend.entity.Role;
import com.jobportal.backend.entity.User;
import com.jobportal.backend.repository.CompanyProfileRepository;
import com.jobportal.backend.repository.InterviewRepository;
import com.jobportal.backend.repository.JobApplicationRepository;
import com.jobportal.backend.repository.JobRepository;
import com.jobportal.backend.repository.NotificationRepository;
import com.jobportal.backend.repository.StudentProfileRepository;
import com.jobportal.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private CompanyProfileRepository companyProfileRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        interviewRepository.deleteAll();
        notificationRepository.deleteAll();
        jobApplicationRepository.deleteAll();
        jobRepository.deleteAll();
        studentProfileRepository.deleteAll();
        companyProfileRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void testRegisterStudentSuccess() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("Alice Smith")
                .email("alice@student.com")
                .password("password123")
                .role("STUDENT")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.type").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("alice@student.com"))
                .andExpect(jsonPath("$.user.name").value("Alice Smith"))
                .andExpect(jsonPath("$.user.role").value("ROLE_STUDENT"))
                .andExpect(jsonPath("$.user.active").value(true))
                .andExpect(jsonPath("$.user.password").doesNotExist());
    }

    @Test
    void testRegisterCompanySuccess() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("Acme Corp")
                .email("hr@acme.com")
                .password("companyPass123")
                .role("ROLE_COMPANY")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.role").value("ROLE_COMPANY"));
    }

    @Test
    void testRegisterAdminRejected() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("Malicious Admin")
                .email("admin@hacker.com")
                .password("adminSecret")
                .role("ROLE_ADMIN")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Public registration as ADMIN is not permitted")));
    }

    @Test
    void testRegisterDuplicateEmailRejected() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("Original User")
                .email("duplicate@example.com")
                .password("pass123")
                .role("STUDENT")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Attempt second registration with same email
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Email is already registered")));
    }

    @Test
    void testRegisterInvalidInputValidationFailed() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("")
                .email("not-an-email")
                .password("123")
                .role("STUDENT")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    @Test
    void testLoginSuccess() throws Exception {
        User user = User.builder()
                .name("Bob Jones")
                .email("bob@example.com")
                .password(passwordEncoder.encode("secret123"))
                .role(Role.ROLE_STUDENT)
                .active(true)
                .build();
        userRepository.save(user);

        LoginRequest loginRequest = LoginRequest.builder()
                .email("bob@example.com")
                .password("secret123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.email").value("bob@example.com"))
                .andExpect(jsonPath("$.user.password").doesNotExist());
    }

    @Test
    void testLoginInvalidCredentials() throws Exception {
        User user = User.builder()
                .name("Bob Jones")
                .email("bob@example.com")
                .password(passwordEncoder.encode("correctPassword"))
                .role(Role.ROLE_STUDENT)
                .active(true)
                .build();
        userRepository.save(user);

        LoginRequest loginRequest = LoginRequest.builder()
                .email("bob@example.com")
                .password("wrongPassword")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", containsString("Invalid email or password")));
    }

    @Test
    void testLoginInactiveAccountRejected() throws Exception {
        User inactiveUser = User.builder()
                .name("Deactivated User")
                .email("inactive@example.com")
                .password(passwordEncoder.encode("secret123"))
                .role(Role.ROLE_STUDENT)
                .active(false)
                .build();
        userRepository.save(inactiveUser);

        LoginRequest loginRequest = LoginRequest.builder()
                .email("inactive@example.com")
                .password("secret123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("inactive")));
    }

    @Test
    void testGetCurrentUserWithValidToken() throws Exception {
        RegisterRequest registerRequest = RegisterRequest.builder()
                .name("Carol White")
                .email("carol@example.com")
                .password("carolPass123")
                .role("STUDENT")
                .build();

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode responseNode = objectMapper.readTree(result.getResponse().getContentAsString());
        String token = responseNode.get("token").asText();
        assertNotNull(token);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("carol@example.com"))
                .andExpect(jsonPath("$.name").value("Carol White"))
                .andExpect(jsonPath("$.role").value("ROLE_STUDENT"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void testGetCurrentUserWithoutTokenUnauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}
