package com.jobportal.backend.controller;

import com.jobportal.backend.dto.ApiResponse;
import com.jobportal.backend.dto.ApplicationRequest;
import com.jobportal.backend.dto.ApplicationResponse;
import com.jobportal.backend.dto.RecruiterAnalyticsResponse;
import com.jobportal.backend.service.ApplicationService;
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

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    // ─── Student endpoints (/api/student/applications) ────────────────────────

    @PostMapping("/api/student/jobs/{jobId}/apply")
    public ResponseEntity<ApplicationResponse> applyForJob(
            Authentication auth,
            @PathVariable Long jobId,
            @Valid @RequestBody ApplicationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(applicationService.applyForJob(auth.getName(), jobId, request));
    }

    @GetMapping("/api/student/applications")
    public ResponseEntity<Page<ApplicationResponse>> getMyApplications(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("appliedAt").descending());
        return ResponseEntity.ok(applicationService.getStudentApplications(auth.getName(), pageable));
    }

    @GetMapping("/api/student/applications/stats")
    public ResponseEntity<Map<String, Long>> getStudentApplicationStats(Authentication auth) {
        return ResponseEntity.ok(applicationService.getStudentApplicationStats(auth.getName()));
    }

    @DeleteMapping("/api/student/applications/{id}")
    public ResponseEntity<ApiResponse> withdrawApplication(
            Authentication auth,
            @PathVariable Long id
    ) {
        applicationService.withdrawApplication(auth.getName(), id);
        return ResponseEntity.ok(new ApiResponse(true, "Application withdrawn successfully"));
    }

    // ─── Company endpoints (/api/company/applications) ────────────────────────

    @GetMapping("/api/company/jobs/{jobId}/applications")
    public ResponseEntity<Page<ApplicationResponse>> getApplicationsForJob(
            Authentication auth,
            @PathVariable Long jobId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("appliedAt").descending());
        return ResponseEntity.ok(applicationService.getApplicationsForJob(auth.getName(), jobId, pageable));
    }

    @GetMapping("/api/company/applications")
    public ResponseEntity<Page<ApplicationResponse>> getAllCompanyApplications(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("appliedAt").descending());
        return ResponseEntity.ok(applicationService.getAllCompanyApplications(auth.getName(), pageable));
    }

    @PatchMapping("/api/company/applications/{id}/status")
    public ResponseEntity<ApplicationResponse> updateApplicationStatus(
            Authentication auth,
            @PathVariable Long id,
            @RequestParam String status
    ) {
        return ResponseEntity.ok(applicationService.updateApplicationStatus(auth.getName(), id, status));
    }

    @GetMapping("/api/company/analytics")
    public ResponseEntity<RecruiterAnalyticsResponse> getCompanyAnalytics(Authentication auth) {
        return ResponseEntity.ok(applicationService.getCompanyAnalytics(auth.getName()));
    }
}
