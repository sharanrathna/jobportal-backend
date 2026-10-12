package com.jobportal.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecruiterAnalyticsResponse {

    private long totalJobs;
    private long openJobs;
    private long closedJobs;
    private long totalApplicants;
    private long appliedCount;
    private long shortlistedCount;
    private long hiredCount;
    private long rejectedCount;
    private double hiringConversionRate;
    private List<JobApplicantMetric> jobMetrics;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class JobApplicantMetric {
        private Long jobId;
        private String jobTitle;
        private String jobLocation;
        private String status;
        private long applicantCount;
    }
}
