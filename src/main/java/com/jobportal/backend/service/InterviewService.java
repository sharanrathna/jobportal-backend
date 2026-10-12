package com.jobportal.backend.service;

import com.jobportal.backend.dto.InterviewRequest;
import com.jobportal.backend.dto.InterviewResponse;
import com.jobportal.backend.entity.*;
import com.jobportal.backend.exception.BadRequestException;
import com.jobportal.backend.exception.ForbiddenOperationException;
import com.jobportal.backend.exception.ResourceNotFoundException;
import com.jobportal.backend.repository.InterviewRepository;
import com.jobportal.backend.repository.JobApplicationRepository;
import com.jobportal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final JobApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a");

    @Transactional
    public InterviewResponse scheduleInterview(String companyEmail, Long applicationId, InterviewRequest request) {
        User company = getUserByEmail(companyEmail);
        JobApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + applicationId));

        if (!application.getJob().getCompany().getId().equals(company.getId())) {
            throw new ForbiddenOperationException("You do not own the job for this applicant");
        }

        if (request.getScheduledAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Interview scheduled time must be in the future");
        }

        Interview interview = Interview.builder()
                .application(application)
                .company(company)
                .student(application.getStudent())
                .scheduledAt(request.getScheduledAt())
                .mode(request.getMode())
                .locationOrLink(request.getLocationOrLink())
                .notes(request.getNotes())
                .status("SCHEDULED")
                .build();

        Interview saved = interviewRepository.save(interview);

        // Advance status to SHORTLISTED if currently APPLIED
        if (application.getStatus() == ApplicationStatus.APPLIED) {
            application.setStatus(ApplicationStatus.SHORTLISTED);
            applicationRepository.save(application);
        }

        // Notify student
        String timeStr = request.getScheduledAt().format(DATE_FMT);
        notificationService.createNotification(
                application.getStudent(),
                "Interview Scheduled",
                "Interview scheduled for \"" + application.getJob().getTitle() + "\" with " + company.getName() + " on " + timeStr + " (" + request.getMode() + ").",
                "INTERVIEW",
                saved.getId()
        );

        log.info("Interview #{} scheduled by {} for student {}", saved.getId(), companyEmail, application.getStudent().getEmail());
        return InterviewResponse.fromInterview(saved);
    }

    @Transactional
    public InterviewResponse updateInterview(String companyEmail, Long interviewId, InterviewRequest request) {
        User company = getUserByEmail(companyEmail);
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with id: " + interviewId));

        if (!interview.getCompany().getId().equals(company.getId())) {
            throw new ForbiddenOperationException("You do not own this interview schedule");
        }

        if (request.getScheduledAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Interview scheduled time must be in the future");
        }

        interview.setScheduledAt(request.getScheduledAt());
        interview.setMode(request.getMode());
        interview.setLocationOrLink(request.getLocationOrLink());
        interview.setNotes(request.getNotes());
        Interview saved = interviewRepository.save(interview);

        String timeStr = request.getScheduledAt().format(DATE_FMT);
        notificationService.createNotification(
                saved.getStudent(),
                "Interview Schedule Updated",
                "Your interview details for \"" + saved.getApplication().getJob().getTitle() + "\" have been updated: " + timeStr + " (" + request.getMode() + ").",
                "INTERVIEW",
                saved.getId()
        );

        return InterviewResponse.fromInterview(saved);
    }

    @Transactional
    public Map<String, Object> cancelInterview(String companyEmail, Long interviewId) {
        User company = getUserByEmail(companyEmail);
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with id: " + interviewId));

        if (!interview.getCompany().getId().equals(company.getId())) {
            throw new ForbiddenOperationException("You do not own this interview schedule");
        }

        interview.setStatus("CANCELLED");
        interviewRepository.save(interview);

        notificationService.createNotification(
                interview.getStudent(),
                "Interview Cancelled",
                "Your interview for \"" + interview.getApplication().getJob().getTitle() + "\" scheduled for " + interview.getScheduledAt().format(DATE_FMT) + " has been cancelled.",
                "INTERVIEW",
                interview.getId()
        );

        return Map.of("success", true, "message", "Interview cancelled successfully");
    }

    @Transactional(readOnly = true)
    public Page<InterviewResponse> getCompanyInterviews(String companyEmail, Pageable pageable) {
        User company = getUserByEmail(companyEmail);
        return interviewRepository.findByCompanyIdOrderByScheduledAtDesc(company.getId(), pageable)
                .map(InterviewResponse::fromInterview);
    }

    @Transactional(readOnly = true)
    public Page<InterviewResponse> getStudentInterviews(String studentEmail, Pageable pageable) {
        User student = getUserByEmail(studentEmail);
        return interviewRepository.findByStudentIdOrderByScheduledAtDesc(student.getId(), pageable)
                .map(InterviewResponse::fromInterview);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
