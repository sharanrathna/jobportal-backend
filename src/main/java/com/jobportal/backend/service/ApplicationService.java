package com.jobportal.backend.service;

import com.jobportal.backend.dto.ApplicationRequest;
import com.jobportal.backend.dto.ApplicationResponse;
import com.jobportal.backend.entity.*;
import com.jobportal.backend.exception.BadRequestException;
import com.jobportal.backend.exception.DuplicateResourceException;
import com.jobportal.backend.exception.ForbiddenOperationException;
import com.jobportal.backend.exception.ResourceNotFoundException;
import com.jobportal.backend.repository.JobApplicationRepository;
import com.jobportal.backend.repository.JobRepository;
import com.jobportal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jobportal.backend.dto.RecruiterAnalyticsResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final JobApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // ─── Student ──────────────────────────────────────────────────────────────

    @Transactional
    public ApplicationResponse applyForJob(String studentEmail, Long jobId, ApplicationRequest request) {
        User student = getUserByEmail(studentEmail);
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found with id: " + jobId));

        if (job.getStatus() != JobStatus.OPEN) {
            throw new BadRequestException("This job is not accepting applications");
        }
        if (applicationRepository.existsByJobIdAndStudentId(jobId, student.getId())) {
            throw new DuplicateResourceException("You have already applied for this job");
        }

        JobApplication application = JobApplication.builder()
                .job(job)
                .student(student)
                .coverLetter(request.getCoverLetter())
                .build();

        JobApplication saved = applicationRepository.save(application);
        log.info("Student {} applied for job #{}", studentEmail, jobId);
        return ApplicationResponse.fromApplication(saved);
    }

    @Transactional(readOnly = true)
    public Page<ApplicationResponse> getStudentApplications(String studentEmail, Pageable pageable) {
        User student = getUserByEmail(studentEmail);
        return applicationRepository.findByStudentId(student.getId(), pageable)
                .map(ApplicationResponse::fromApplication);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getStudentApplicationStats(String studentEmail) {
        User student = getUserByEmail(studentEmail);
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", applicationRepository.countByStudentId(student.getId()));
        stats.put("applied", applicationRepository.countByStudentIdAndStatus(student.getId(), ApplicationStatus.APPLIED));
        stats.put("shortlisted", applicationRepository.countByStudentIdAndStatus(student.getId(), ApplicationStatus.SHORTLISTED));
        stats.put("hired", applicationRepository.countByStudentIdAndStatus(student.getId(), ApplicationStatus.HIRED));
        stats.put("rejected", applicationRepository.countByStudentIdAndStatus(student.getId(), ApplicationStatus.REJECTED));
        return stats;
    }

    @Transactional
    public void withdrawApplication(String studentEmail, Long applicationId) {
        User student = getUserByEmail(studentEmail);
        JobApplication app = getApplicationById(applicationId);

        if (!app.getStudent().getId().equals(student.getId())) {
            throw new ForbiddenOperationException("You do not own this application");
        }
        if (app.getStatus() != ApplicationStatus.APPLIED) {
            throw new BadRequestException("Cannot withdraw an application that has been reviewed");
        }

        applicationRepository.delete(app);
        log.info("Student {} withdrew application #{}", studentEmail, applicationId);
    }

    // ─── Company ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ApplicationResponse> getApplicationsForJob(String companyEmail, Long jobId, Pageable pageable) {
        User company = getUserByEmail(companyEmail);
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found with id: " + jobId));
        if (!job.getCompany().getId().equals(company.getId())) {
            throw new ForbiddenOperationException("You do not own this job posting");
        }
        return applicationRepository.findByJobId(jobId, pageable).map(ApplicationResponse::fromApplication);
    }

    @Transactional(readOnly = true)
    public Page<ApplicationResponse> getAllCompanyApplications(String companyEmail, Pageable pageable) {
        User company = getUserByEmail(companyEmail);
        return applicationRepository.findByJobCompanyId(company.getId(), pageable)
                .map(ApplicationResponse::fromApplication);
    }

    @Transactional
    public ApplicationResponse updateApplicationStatus(String companyEmail, Long applicationId, String status) {
        User company = getUserByEmail(companyEmail);
        JobApplication app = getApplicationById(applicationId);

        if (!app.getJob().getCompany().getId().equals(company.getId())) {
            throw new ForbiddenOperationException("You do not own the job for this application");
        }

        ApplicationStatus newStatus;
        try {
            newStatus = ApplicationStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid application status: " + status);
        }

        app.setStatus(newStatus);
        JobApplication saved = applicationRepository.save(app);
        notificationService.createNotification(
                saved.getStudent(),
                "Application Status Updated",
                "Your application for \"" + saved.getJob().getTitle() + "\" has been updated to " + newStatus.name() + ".",
                "APPLICATION_STATUS",
                saved.getId()
        );
        return ApplicationResponse.fromApplication(saved);
    }

    @Transactional(readOnly = true)
    public RecruiterAnalyticsResponse getCompanyAnalytics(String companyEmail) {
        User company = getUserByEmail(companyEmail);
        Long companyId = company.getId();

        long totalJobs = jobRepository.countByCompanyId(companyId);
        long openJobs = jobRepository.countByCompanyIdAndStatus(companyId, JobStatus.OPEN);
        long closedJobs = jobRepository.countByCompanyIdAndStatus(companyId, JobStatus.CLOSED);

        long totalApplicants = applicationRepository.countByJobCompanyId(companyId);
        long appliedCount = applicationRepository.countByJobCompanyIdAndStatus(companyId, ApplicationStatus.APPLIED);
        long shortlistedCount = applicationRepository.countByJobCompanyIdAndStatus(companyId, ApplicationStatus.SHORTLISTED);
        long hiredCount = applicationRepository.countByJobCompanyIdAndStatus(companyId, ApplicationStatus.HIRED);
        long rejectedCount = applicationRepository.countByJobCompanyIdAndStatus(companyId, ApplicationStatus.REJECTED);

        double conversionRate = totalApplicants > 0
                ? Math.round(((double) hiredCount / totalApplicants) * 1000.0) / 10.0
                : 0.0;

        List<Job> companyJobs = jobRepository.findByCompanyId(companyId);
        List<RecruiterAnalyticsResponse.JobApplicantMetric> jobMetrics = companyJobs.stream()
                .map(j -> RecruiterAnalyticsResponse.JobApplicantMetric.builder()
                        .jobId(j.getId())
                        .jobTitle(j.getTitle())
                        .jobLocation(j.getLocation())
                        .status(j.getStatus().name())
                        .applicantCount(applicationRepository.countByJobId(j.getId()))
                        .build())
                .collect(Collectors.toList());

        return RecruiterAnalyticsResponse.builder()
                .totalJobs(totalJobs)
                .openJobs(openJobs)
                .closedJobs(closedJobs)
                .totalApplicants(totalApplicants)
                .appliedCount(appliedCount)
                .shortlistedCount(shortlistedCount)
                .hiredCount(hiredCount)
                .rejectedCount(rejectedCount)
                .hiringConversionRate(conversionRate)
                .jobMetrics(jobMetrics)
                .build();
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ApplicationResponse> getAllApplications(Pageable pageable) {
        return applicationRepository.findAll(pageable).map(ApplicationResponse::fromApplication);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private JobApplication getApplicationById(Long id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + id));
    }
}
