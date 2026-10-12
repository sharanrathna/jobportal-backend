package com.jobportal.backend.dto;

import com.jobportal.backend.entity.ApplicationStatus;
import com.jobportal.backend.entity.JobApplication;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationResponse {

    private Long id;
    private Long jobId;
    private String jobTitle;
    private String companyName;
    private String jobLocation;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String coverLetter;
    private ApplicationStatus status;
    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;

    public static ApplicationResponse fromApplication(JobApplication app) {
        return ApplicationResponse.builder()
                .id(app.getId())
                .jobId(app.getJob().getId())
                .jobTitle(app.getJob().getTitle())
                .companyName(app.getJob().getCompany() != null ? app.getJob().getCompany().getName() : null)
                .jobLocation(app.getJob().getLocation())
                .studentId(app.getStudent().getId())
                .studentName(app.getStudent().getName())
                .studentEmail(app.getStudent().getEmail())
                .coverLetter(app.getCoverLetter())
                .status(app.getStatus())
                .appliedAt(app.getAppliedAt())
                .updatedAt(app.getUpdatedAt())
                .build();
    }
}
