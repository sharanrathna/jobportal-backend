package com.jobportal.backend.dto;

import com.jobportal.backend.entity.StudentProfile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentProfileResponse {

    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String headline;
    private String education;
    private String skills;
    private String experience;
    private String projects;
    private String resumeUrl;
    private String bio;
    private String phone;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static StudentProfileResponse fromProfile(StudentProfile p) {
        return StudentProfileResponse.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .name(p.getUser().getName())
                .email(p.getUser().getEmail())
                .headline(p.getHeadline())
                .education(p.getEducation())
                .skills(p.getSkills())
                .experience(p.getExperience())
                .projects(p.getProjects())
                .resumeUrl(p.getResumeUrl())
                .bio(p.getBio())
                .phone(p.getPhone())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
