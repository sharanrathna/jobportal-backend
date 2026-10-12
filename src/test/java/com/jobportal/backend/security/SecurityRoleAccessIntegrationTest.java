package com.jobportal.backend.security;

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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityRoleAccessIntegrationTest {

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
    private JwtUtils jwtUtils;

    private String studentToken;
    private String companyToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        interviewRepository.deleteAll();
        notificationRepository.deleteAll();
        jobApplicationRepository.deleteAll();
        jobRepository.deleteAll();
        studentProfileRepository.deleteAll();
        companyProfileRepository.deleteAll();
        userRepository.deleteAll();

        User student = User.builder()
                .name("Student User")
                .email("student@test.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.ROLE_STUDENT)
                .active(true)
                .build();
        User savedStudent = userRepository.save(student);
        studentToken = jwtUtils.generateToken(UserDetailsImpl.build(savedStudent));

        User company = User.builder()
                .name("Company User")
                .email("company@test.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.ROLE_COMPANY)
                .active(true)
                .build();
        User savedCompany = userRepository.save(company);
        companyToken = jwtUtils.generateToken(UserDetailsImpl.build(savedCompany));

        User admin = User.builder()
                .name("Admin User")
                .email("admin@test.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.ROLE_ADMIN)
                .active(true)
                .build();
        User savedAdmin = userRepository.save(admin);
        adminToken = jwtUtils.generateToken(UserDetailsImpl.build(savedAdmin));
    }

    @Test
    void testStudentCanAccessStudentDashboard() throws Exception {
        mockMvc.perform(get("/api/student/dashboard")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Access granted to Student resource"));
    }

    @Test
    void testCompanyCannotAccessStudentDashboard() throws Exception {
        mockMvc.perform(get("/api/student/dashboard")
                        .header("Authorization", "Bearer " + companyToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testCompanyCanAccessCompanyDashboard() throws Exception {
        mockMvc.perform(get("/api/company/dashboard")
                        .header("Authorization", "Bearer " + companyToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Access granted to Company resource"));
    }

    @Test
    void testStudentCannotAccessCompanyDashboard() throws Exception {
        mockMvc.perform(get("/api/company/dashboard")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testStudentOrCompanyCannotAccessAdminDashboard() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + companyToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testAdminCanAccessAdminDashboard() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Access granted to Admin resource"));
    }

    @Test
    void testUnauthenticatedAccessIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/student/dashboard"))
                .andExpect(status().isUnauthorized());
    }
}
