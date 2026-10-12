package com.jobportal.backend.dto;

import com.jobportal.backend.entity.CompanyProfile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyProfileResponse {

    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String companyName;
    private String description;
    private String website;
    private String industry;
    private String location;
    private String logoUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CompanyProfileResponse fromProfile(CompanyProfile p) {
        return CompanyProfileResponse.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .name(p.getUser().getName())
                .email(p.getUser().getEmail())
                .companyName(p.getCompanyName())
                .description(p.getDescription())
                .website(p.getWebsite())
                .industry(p.getIndustry())
                .location(p.getLocation())
                .logoUrl(p.getLogoUrl())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
