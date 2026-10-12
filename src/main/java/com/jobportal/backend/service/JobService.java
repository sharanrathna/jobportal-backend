package com.jobportal.backend.service;

import com.jobportal.backend.dto.JobRequest;
import com.jobportal.backend.dto.JobResponse;
import com.jobportal.backend.entity.*;
import com.jobportal.backend.exception.ForbiddenOperationException;
import com.jobportal.backend.exception.ResourceNotFoundException;
import com.jobportal.backend.repository.JobRepository;
import com.jobportal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jobportal.backend.dto.JobRecommendationResponse;
import com.jobportal.backend.repository.JobApplicationRepository;
import com.jobportal.backend.repository.StudentProfileRepository;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final JobApplicationRepository applicationRepository;

    // ─── Public ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<JobResponse> searchJobs(String title, String location, String category,
                                        String employmentType, Pageable pageable) {
        EmploymentType et = null;
        if (employmentType != null && !employmentType.isBlank()) {
            try {
                et = EmploymentType.valueOf(employmentType.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid employment type: " + employmentType);
            }
        }
        return jobRepository.searchJobs(JobStatus.OPEN, title, location, category, et, pageable)
                .map(JobResponse::fromJob);
    }

    @Transactional(readOnly = true)
    public JobResponse getJobById(Long id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found with id: " + id));
        return JobResponse.fromJob(job);
    }

    // ─── Company ─────────────────────────────────────────────────────────────

    @Transactional
    public JobResponse createJob(String companyEmail, JobRequest request) {
        User company = getUserByEmail(companyEmail);

        Job job = Job.builder()
                .company(company)
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .location(request.getLocation())
                .employmentType(request.getEmploymentType())
                .salaryRange(request.getSalaryRange())
                .requirements(request.getRequirements())
                .build();

        Job saved = jobRepository.save(job);
        log.info("Company {} created job #{}: {}", companyEmail, saved.getId(), saved.getTitle());
        return JobResponse.fromJob(saved);
    }

    @Transactional(readOnly = true)
    public Page<JobResponse> getCompanyJobs(String companyEmail, Pageable pageable) {
        User company = getUserByEmail(companyEmail);
        return jobRepository.findByCompanyId(company.getId(), pageable).map(JobResponse::fromJob);
    }

    @Transactional
    public JobResponse updateJob(String companyEmail, Long jobId, JobRequest request) {
        Job job = getJobOwnedByCompany(companyEmail, jobId);

        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setCategory(request.getCategory());
        job.setLocation(request.getLocation());
        job.setEmploymentType(request.getEmploymentType());
        job.setSalaryRange(request.getSalaryRange());
        job.setRequirements(request.getRequirements());

        return JobResponse.fromJob(jobRepository.save(job));
    }

    @Transactional
    public JobResponse closeJob(String companyEmail, Long jobId) {
        Job job = getJobOwnedByCompany(companyEmail, jobId);
        job.setStatus(JobStatus.CLOSED);
        return JobResponse.fromJob(jobRepository.save(job));
    }

    @Transactional
    public JobResponse reopenJob(String companyEmail, Long jobId) {
        Job job = getJobOwnedByCompany(companyEmail, jobId);
        job.setStatus(JobStatus.OPEN);
        return JobResponse.fromJob(jobRepository.save(job));
    }

    @Transactional
    public void deleteJob(String companyEmail, Long jobId) {
        Job job = getJobOwnedByCompany(companyEmail, jobId);
        jobRepository.delete(job);
        log.info("Company {} deleted job #{}", companyEmail, jobId);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<JobResponse> getAllJobs(Pageable pageable) {
        return jobRepository.findAll(pageable).map(JobResponse::fromJob);
    }

    @Transactional
    public void adminDeleteJob(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found with id: " + jobId));
        jobRepository.delete(job);
        log.info("Admin deleted job #{}", jobId);
    }

    // ─── Student Recommendations ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<JobRecommendationResponse> getRecommendedJobs(String studentEmail) {
        User student = getUserByEmail(studentEmail);
        Optional<StudentProfile> profileOpt = studentProfileRepository.findByUser(student);

        // Fetch all open jobs
        List<Job> openJobs = jobRepository.findByStatus(JobStatus.OPEN);

        // Student's applied jobs
        Set<Long> appliedJobIds = applicationRepository.findByStudentId(student.getId(), Pageable.unpaged())
                .getContent()
                .stream()
                .map(app -> app.getJob().getId())
                .collect(Collectors.toSet());

        // Parse student skills & headline
        Set<String> studentSkills = new HashSet<>();
        String headline = "";
        if (profileOpt.isPresent()) {
            StudentProfile profile = profileOpt.get();
            if (profile.getSkills() != null && !profile.getSkills().isBlank()) {
                Arrays.stream(profile.getSkills().split("[,;|/\\n]"))
                        .map(s -> s.trim())
                        .filter(s -> !s.isEmpty())
                        .map(s -> s.toLowerCase())
                        .forEach(studentSkills::add);
            }
            if (profile.getHeadline() != null) {
                headline = profile.getHeadline().toLowerCase();
            }
        }

        List<JobRecommendationResponse> recommendations = new ArrayList<>();

        for (Job job : openJobs) {
            if (appliedJobIds.contains(job.getId())) {
                continue; // Do not recommend jobs already applied to
            }

            List<String> jobSkills = new ArrayList<>();
            if (job.getRequirements() != null && !job.getRequirements().isBlank()) {
                Arrays.stream(job.getRequirements().split("[,;|/\\n]"))
                        .map(s -> s.trim())
                        .filter(s -> !s.isEmpty())
                        .forEach(jobSkills::add);
            }

            List<String> matchedSkills = new ArrayList<>();
            List<String> missingSkills = new ArrayList<>();

            for (String js : jobSkills) {
                String normalizedJs = js.toLowerCase().trim();
                boolean matches = studentSkills.stream().anyMatch(ss -> ss.contains(normalizedJs) || normalizedJs.contains(ss));
                if (matches) {
                    matchedSkills.add(js);
                } else {
                    missingSkills.add(js);
                }
            }

            int score = 0;
            StringBuilder reasons = new StringBuilder();

            if (!jobSkills.isEmpty()) {
                int skillScore = (int) Math.round(((double) matchedSkills.size() / jobSkills.size()) * 70.0);
                score += skillScore;
                if (!matchedSkills.isEmpty()) {
                    reasons.append("Matches skills: ").append(String.join(", ", matchedSkills)).append(". ");
                }
            } else {
                score += 45;
                reasons.append("Open opportunity matching your career path. ");
            }

            String jobTitleLower = job.getTitle().toLowerCase();
            String jobCatLower = job.getCategory() != null ? job.getCategory().toLowerCase() : "";
            if (!headline.isEmpty() && (headline.contains(jobTitleLower) || jobTitleLower.contains(headline) || headline.contains(jobCatLower))) {
                score += 20;
                reasons.append("Role aligns with your headline. ");
            } else {
                score += 10;
            }

            if (job.getLocation() != null && (job.getLocation().toLowerCase().contains("remote") || job.getLocation().toLowerCase().contains("hybrid"))) {
                score += 10;
                reasons.append("Remote/Hybrid work model. ");
            } else {
                score += 5;
            }

            score = Math.min(100, Math.max(20, score));

            recommendations.add(JobRecommendationResponse.builder()
                    .job(JobResponse.fromJob(job))
                    .matchPercentage(score)
                    .matchedSkills(matchedSkills)
                    .missingSkills(missingSkills)
                    .matchReason(reasons.toString().trim())
                    .build());
        }

        recommendations.sort(Comparator.comparingInt((JobRecommendationResponse r) -> r.getMatchPercentage()).reversed());
        return recommendations;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private Job getJobOwnedByCompany(String companyEmail, Long jobId) {
        User company = getUserByEmail(companyEmail);
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found with id: " + jobId));
        if (!job.getCompany().getId().equals(company.getId())) {
            throw new ForbiddenOperationException("You do not own this job posting");
        }
        return job;
    }
}
