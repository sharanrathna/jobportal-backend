package com.jobportal.backend.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class InterviewRequest {

    @NotNull(message = "Interview scheduled date/time is required")
    @Future(message = "Interview date/time must be in the future")
    private LocalDateTime scheduledAt;

    @NotBlank(message = "Interview mode is required (e.g. ONLINE_VIDEO, PHONE, IN_PERSON)")
    @Size(max = 50, message = "Mode must not exceed 50 characters")
    private String mode;

    @NotBlank(message = "Meeting link or location details are required")
    @Size(max = 255, message = "Location/link must not exceed 255 characters")
    private String locationOrLink;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;
}
