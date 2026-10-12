package com.jobportal.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ApplicationRequest {

    @Size(max = 2000, message = "Cover letter must not exceed 2000 characters")
    private String coverLetter;
}
