package com.jobportal.backend.controller;

import com.jobportal.backend.dto.*;
import com.jobportal.backend.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    // ─── Student Profile (/api/student/profile) ───────────────────────────────

    @GetMapping("/api/student/profile")
    public ResponseEntity<StudentProfileResponse> getStudentProfile(Authentication auth) {
        return ResponseEntity.ok(profileService.getStudentProfile(auth.getName()));
    }

    @PostMapping("/api/student/profile")
    public ResponseEntity<StudentProfileResponse> createStudentProfile(
            Authentication auth,
            @Valid @RequestBody StudentProfileRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(profileService.createStudentProfile(auth.getName(), request));
    }

    @PutMapping("/api/student/profile")
    public ResponseEntity<StudentProfileResponse> updateStudentProfile(
            Authentication auth,
            @Valid @RequestBody StudentProfileRequest request
    ) {
        return ResponseEntity.ok(profileService.updateStudentProfile(auth.getName(), request));
    }

    // ─── Company Profile (/api/company/profile) ───────────────────────────────

    @GetMapping("/api/company/profile")
    public ResponseEntity<CompanyProfileResponse> getCompanyProfile(Authentication auth) {
        return ResponseEntity.ok(profileService.getCompanyProfile(auth.getName()));
    }

    @PostMapping("/api/company/profile")
    public ResponseEntity<CompanyProfileResponse> createCompanyProfile(
            Authentication auth,
            @Valid @RequestBody CompanyProfileRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(profileService.createCompanyProfile(auth.getName(), request));
    }

    @PutMapping("/api/company/profile")
    public ResponseEntity<CompanyProfileResponse> updateCompanyProfile(
            Authentication auth,
            @Valid @RequestBody CompanyProfileRequest request
    ) {
        return ResponseEntity.ok(profileService.updateCompanyProfile(auth.getName(), request));
    }

    // ─── Public profile lookup (/api/public/profiles) ────────────────────────

    @GetMapping("/api/public/profiles/student/{userId}")
    public ResponseEntity<StudentProfileResponse> getPublicStudentProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(profileService.getStudentProfileById(userId));
    }

    @GetMapping("/api/public/profiles/company/{userId}")
    public ResponseEntity<CompanyProfileResponse> getPublicCompanyProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(profileService.getCompanyProfileById(userId));
    }
}
