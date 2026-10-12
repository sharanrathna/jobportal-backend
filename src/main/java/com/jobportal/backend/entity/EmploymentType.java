package com.jobportal.backend.entity;

public enum EmploymentType {
    FULL_TIME,
    PART_TIME,
    CONTRACT,
    INTERNSHIP,
    REMOTE;

    public static EmploymentType fromString(String typeStr) {
        if (typeStr == null || typeStr.trim().isEmpty()) {
            throw new IllegalArgumentException("Employment type cannot be null or empty");
        }
        return EmploymentType.valueOf(typeStr.trim().toUpperCase());
    }
}
