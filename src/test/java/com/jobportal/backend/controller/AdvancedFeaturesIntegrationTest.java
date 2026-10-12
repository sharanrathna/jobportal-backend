package com.jobportal.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.backend.dto.StudentProfileRequest;
import com.jobportal.backend.entity.*;
import com.jobportal.backend.repository.*;
import com.jobportal.backend.security.JwtUtils;
import com.jobportal.backend.security.UserDetailsImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AdvancedFeaturesIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private CompanyProfileRepository companyProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    private User student;
    private User company;
    private String studentToken;
    private String companyToken;
    private Job job;
    private JobApplication application;

    @BeforeEach
    void setUp() {
        interviewRepository.deleteAll();
        notificationRepository.deleteAll();
        jobApplicationRepository.deleteAll();
        jobRepository.deleteAll();
        studentProfileRepository.deleteAll();
        companyProfileRepository.deleteAll();
        userRepository.deleteAll();

        student = userRepository.save(User.builder()
                .name("Alex Student")
                .email("alex@university.edu")
                .password(passwordEncoder.encode("password123"))
                .role(Role.ROLE_STUDENT)
                .active(true)
                .build());
        studentToken = jwtUtils.generateToken(UserDetailsImpl.build(student));

        company = userRepository.save(User.builder()
                .name("Acme Corp")
                .email("hr@acme.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.ROLE_COMPANY)
                .active(true)
                .build());
        companyToken = jwtUtils.generateToken(UserDetailsImpl.build(company));

        job = jobRepository.save(Job.builder()
                .company(company)
                .title("Full Stack Engineer")
                .description("Build modern web apps with Spring Boot and React")
                .category("Software Engineering")
                .location("Remote")
                .employmentType(EmploymentType.FULL_TIME)
                .requirements("Java, React, Spring Boot, MySQL")
                .status(JobStatus.OPEN)
                .build());

        application = jobApplicationRepository.save(JobApplication.builder()
                .student(student)
                .job(job)
                .status(ApplicationStatus.APPLIED)
                .coverLetter("Excited to apply!")
                .build());
    }

    @Test
    void testResumeBuilder_CreateAndRetrieveProfile() throws Exception {
        StudentProfileRequest request = new StudentProfileRequest();
        request.setHeadline("Software Engineering Candidate");
        request.setEducation("B.S. Computer Science 2026");
        request.setSkills("Java, React, Spring Boot, MySQL");
        request.setExperience("Intern at Tech Lab");
        request.setProjects("Full Stack Job Portal with React & Spring Boot");
        request.setBio("Passionate developer");
        request.setPhone("+1234567890");

        mockMvc.perform(post("/api/student/profile")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.headline").value("Software Engineering Candidate"))
                .andExpect(jsonPath("$.projects").value("Full Stack Job Portal with React & Spring Boot"));

        mockMvc.perform(get("/api/student/profile")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skills").value("Java, React, Spring Boot, MySQL"));
    }

    @Test
    void testSmartJobRecommendations_MatchesStudentSkills() throws Exception {
        // Setup student profile with matching skills
        studentProfileRepository.save(StudentProfile.builder()
                .user(student)
                .skills("Java, Spring Boot, React")
                .headline("Full Stack Engineer")
                .build());

        // Create a new job that student hasn't applied to
        jobRepository.save(Job.builder()
                .company(company)
                .title("Backend Java Developer")
                .description("Build scalable APIs")
                .category("Software Engineering")
                .location("Remote")
                .employmentType(EmploymentType.FULL_TIME)
                .requirements("Java, Spring Boot, Microservices")
                .status(JobStatus.OPEN)
                .build());

        mockMvc.perform(get("/api/student/jobs/recommendations")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].job.title").value("Backend Java Developer"))
                .andExpect(jsonPath("$[0].matchPercentage").isNumber());
    }

    @Test
    void testRecruiterAnalytics_OwnershipAndMetrics() throws Exception {
        mockMvc.perform(get("/api/company/analytics")
                        .header("Authorization", "Bearer " + companyToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalJobs").value(1))
                .andExpect(jsonPath("$.openJobs").value(1))
                .andExpect(jsonPath("$.totalApplicants").value(1))
                .andExpect(jsonPath("$.appliedCount").value(1));
    }

    @Test
    void testInterviewScheduling_FullLifecycle() throws Exception {
        String interviewJson = """
                {
                    "scheduledAt": "2026-10-20T10:00:00",
                    "mode": "ONLINE_VIDEO",
                    "locationOrLink": "https://meet.google.com/test-room",
                    "notes": "First round technical discussion"
                }
                """;

        // 1. Company schedules interview
        mockMvc.perform(post("/api/company/applications/" + application.getId() + "/interviews")
                        .header("Authorization", "Bearer " + companyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(interviewJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mode").value("ONLINE_VIDEO"))
                .andExpect(jsonPath("$.locationOrLink").value("https://meet.google.com/test-room"));

        // 2. Student views scheduled interviews
        mockMvc.perform(get("/api/student/interviews")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].jobTitle").value("Full Stack Engineer"))
                .andExpect(jsonPath("$.content[0].status").value("SCHEDULED"));

        // 3. Student has persistent notification
        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").isNumber());
    }
}
