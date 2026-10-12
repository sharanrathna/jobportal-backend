package com.jobportal.backend.dto;

import com.jobportal.backend.entity.Interview;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewResponse {

    private Long id;
    private Long applicationId;
    private Long jobId;
    private String jobTitle;
    private Long companyId;
    private String companyName;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private LocalDateTime scheduledAt;
    private String mode;
    private String locationOrLink;
    private String notes;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static InterviewResponse fromInterview(Interview i) {
        return InterviewResponse.builder()
                .id(i.getId())
                .applicationId(i.getApplication().getId())
                .jobId(i.getApplication().getJob().getId())
                .jobTitle(i.getApplication().getJob().getTitle())
                .companyId(i.getCompany().getId())
                .companyName(i.getCompany().getName())
                .studentId(i.getStudent().getId())
                .studentName(i.getStudent().getName())
                .studentEmail(i.getStudent().getEmail())
                .scheduledAt(i.getScheduledAt())
                .mode(i.getMode())
                .locationOrLink(i.getLocationOrLink())
                .notes(i.getNotes())
                .status(i.getStatus())
                .createdAt(i.getCreatedAt())
                .updatedAt(i.getUpdatedAt())
                .build();
    }
}
