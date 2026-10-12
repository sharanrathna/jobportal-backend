package com.jobportal.backend.controller;

import com.jobportal.backend.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProtectedDemoController {

    @GetMapping("/api/student/dashboard")
    public ResponseEntity<?> studentDashboard() {
        return ResponseEntity.ok(new ApiResponse(true, "Access granted to Student resource"));
    }

    @GetMapping("/api/company/dashboard")
    public ResponseEntity<?> companyDashboard() {
        return ResponseEntity.ok(new ApiResponse(true, "Access granted to Company resource"));
    }

    @GetMapping("/api/admin/dashboard")
    public ResponseEntity<?> adminDashboard() {
        return ResponseEntity.ok(new ApiResponse(true, "Access granted to Admin resource"));
    }
}
