package com.jobportal.backend.controller;

import com.jobportal.backend.dto.InterviewRequest;
import com.jobportal.backend.dto.InterviewResponse;
import com.jobportal.backend.service.InterviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    // ─── Company endpoints ────────────────────────────────────────────────────

    @PostMapping("/api/company/applications/{applicationId}/interviews")
    public ResponseEntity<InterviewResponse> scheduleInterview(
            Authentication auth,
            @PathVariable Long applicationId,
            @Valid @RequestBody InterviewRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(interviewService.scheduleInterview(auth.getName(), applicationId, request));
    }

    @PutMapping("/api/company/interviews/{id}")
    public ResponseEntity<InterviewResponse> updateInterview(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody InterviewRequest request
    ) {
        return ResponseEntity.ok(interviewService.updateInterview(auth.getName(), id, request));
    }

    @DeleteMapping("/api/company/interviews/{id}")
    public ResponseEntity<Map<String, Object>> cancelInterview(
            Authentication auth,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(interviewService.cancelInterview(auth.getName(), id));
    }

    @GetMapping("/api/company/interviews")
    public ResponseEntity<Page<InterviewResponse>> getCompanyInterviews(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(interviewService.getCompanyInterviews(auth.getName(), pageable));
    }

    // ─── Student endpoints ────────────────────────────────────────────────────

    @GetMapping("/api/student/interviews")
    public ResponseEntity<Page<InterviewResponse>> getStudentInterviews(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(interviewService.getStudentInterviews(auth.getName(), pageable));
    }
}
