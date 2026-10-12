package com.jobportal.backend.entity;

public enum ApplicationStatus {
    APPLIED,
    SHORTLISTED,
    REJECTED,
    HIRED;

    public static ApplicationStatus fromString(String statusStr) {
        if (statusStr == null || statusStr.trim().isEmpty()) {
            throw new IllegalArgumentException("Application status cannot be null or empty");
        }
        return ApplicationStatus.valueOf(statusStr.trim().toUpperCase());
    }
}
