package com.jobportal.backend.entity;

public enum Role {
    ROLE_STUDENT,
    ROLE_COMPANY,
    ROLE_ADMIN;

    public static Role fromString(String roleStr) {
        if (roleStr == null || roleStr.trim().isEmpty()) {
            throw new IllegalArgumentException("Role cannot be null or empty");
        }
        String clean = roleStr.trim().toUpperCase();
        if (!clean.startsWith("ROLE_")) {
            clean = "ROLE_" + clean;
        }
        return Role.valueOf(clean);
    }
}
