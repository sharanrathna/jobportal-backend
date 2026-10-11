package com.jobportal.backend.entity;

public enum JobStatus {
    OPEN,
    CLOSED;

    public static JobStatus fromString(String statusStr) {
        if (statusStr == null || statusStr.trim().isEmpty()) {
            throw new IllegalArgumentException("Job status cannot be null or empty");
        }
        return JobStatus.valueOf(statusStr.trim().toUpperCase());
    }
}
