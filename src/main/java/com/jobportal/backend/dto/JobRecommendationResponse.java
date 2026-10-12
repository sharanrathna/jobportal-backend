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
public class JobRecommendationResponse {

    private JobResponse job;
    private int matchPercentage;
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private String matchReason;
}
