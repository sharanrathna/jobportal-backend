package com.jobportal.backend.controller;

import com.jobportal.backend.dto.ApiResponse;
import com.jobportal.backend.dto.JobRecommendationResponse;
import com.jobportal.backend.dto.JobRequest;
import com.jobportal.backend.dto.JobResponse;
import java.util.List;
import com.jobportal.backend.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    // ─── Public endpoints (/api/public/jobs) ──────────────────────────────────

    @GetMapping("/api/public/jobs")
    public ResponseEntity<Page<JobResponse>> searchJobs(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String employmentType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(jobService.searchJobs(title, location, category, employmentType, pageable));
    }

    @GetMapping("/api/public/jobs/{id}")
    public ResponseEntity<JobResponse> getJob(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.getJobById(id));
    }

    // ─── Company endpoints (/api/company/jobs) ────────────────────────────────

    @GetMapping("/api/company/jobs")
    public ResponseEntity<Page<JobResponse>> getMyJobs(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(jobService.getCompanyJobs(auth.getName(), pageable));
    }

    @PostMapping("/api/company/jobs")
    public ResponseEntity<JobResponse> createJob(
            Authentication auth,
            @Valid @RequestBody JobRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(jobService.createJob(auth.getName(), request));
    }

    @PutMapping("/api/company/jobs/{id}")
    public ResponseEntity<JobResponse> updateJob(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody JobRequest request
    ) {
        return ResponseEntity.ok(jobService.updateJob(auth.getName(), id, request));
    }

    @PatchMapping("/api/company/jobs/{id}/close")
    public ResponseEntity<JobResponse> closeJob(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(jobService.closeJob(auth.getName(), id));
    }

    @PatchMapping("/api/company/jobs/{id}/reopen")
    public ResponseEntity<JobResponse> reopenJob(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(jobService.reopenJob(auth.getName(), id));
    }

    @DeleteMapping("/api/company/jobs/{id}")
    public ResponseEntity<ApiResponse> deleteJob(Authentication auth, @PathVariable Long id) {
        jobService.deleteJob(auth.getName(), id);
        return ResponseEntity.ok(new ApiResponse(true, "Job deleted successfully"));
    }

    // ─── Student Recommendations ─────────────────────────────────────────────

    @GetMapping("/api/student/jobs/recommendations")
    public ResponseEntity<List<JobRecommendationResponse>> getRecommendedJobs(Authentication auth) {
        return ResponseEntity.ok(jobService.getRecommendedJobs(auth.getName()));
    }
}
