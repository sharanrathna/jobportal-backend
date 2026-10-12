package com.jobportal.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminMetricsResponse {

    private long totalUsers;
    private long totalStudents;
    private long totalCompanies;
    private long activeUsers;
    private long totalJobs;
    private long openJobs;
    private long closedJobs;
    private long totalApplications;
    private long pendingApplications;
}
