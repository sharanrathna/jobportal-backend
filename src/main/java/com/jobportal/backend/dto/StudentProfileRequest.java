package com.jobportal.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class StudentProfileRequest {

    @Size(max = 150, message = "Headline must not exceed 150 characters")
    private String headline;

    @Size(max = 500, message = "Education must not exceed 500 characters")
    private String education;

    @Size(max = 500, message = "Skills must not exceed 500 characters")
    private String skills;

    @Size(max = 1000, message = "Experience must not exceed 1000 characters")
    private String experience;

    @Size(max = 1500, message = "Projects must not exceed 1500 characters")
    private String projects;

    @Size(max = 255, message = "Resume URL must not exceed 255 characters")
    private String resumeUrl;

    @Size(max = 1000, message = "Bio must not exceed 1000 characters")
    private String bio;

    @Size(max = 30, message = "Phone must not exceed 30 characters")
    private String phone;
}
