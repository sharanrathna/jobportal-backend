package com.jobportal.backend.dto;

import com.jobportal.backend.entity.EmploymentType;
import com.jobportal.backend.entity.Job;
import com.jobportal.backend.entity.JobStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobResponse {

    private Long id;
    private String title;
    private String description;
    private String category;
    private String location;
    private EmploymentType employmentType;
    private String salaryRange;
    private String requirements;
    private JobStatus status;
    private Long companyId;
    private String companyName;
    private String companyLogo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static JobResponse fromJob(Job job) {
        JobResponseBuilder builder = JobResponse.builder()
                .id(job.getId())
                .title(job.getTitle())
                .description(job.getDescription())
                .category(job.getCategory())
                .location(job.getLocation())
                .employmentType(job.getEmploymentType())
                .salaryRange(job.getSalaryRange())
                .requirements(job.getRequirements())
                .status(job.getStatus())
                .companyId(job.getCompany().getId())
                .companyName(job.getCompany().getName())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt());
        return builder.build();
    }
}
