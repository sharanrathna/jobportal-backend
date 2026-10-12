package com.jobportal.backend.service;

import com.jobportal.backend.dto.*;
import com.jobportal.backend.entity.*;
import com.jobportal.backend.exception.DuplicateResourceException;
import com.jobportal.backend.exception.ForbiddenOperationException;
import com.jobportal.backend.exception.ResourceNotFoundException;
import com.jobportal.backend.repository.CompanyProfileRepository;
import com.jobportal.backend.repository.StudentProfileRepository;
import com.jobportal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileService {

    private final StudentProfileRepository studentProfileRepository;
    private final CompanyProfileRepository companyProfileRepository;
    private final UserRepository userRepository;

    // ─── Student Profile ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public StudentProfileResponse getStudentProfile(String email) {
        User user = getUserByEmail(email);
        StudentProfile profile = studentProfileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));
        return StudentProfileResponse.fromProfile(profile);
    }

    @Transactional(readOnly = true)
    public StudentProfileResponse getStudentProfileById(Long userId) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user " + userId));
        return StudentProfileResponse.fromProfile(profile);
    }

    @Transactional
    public StudentProfileResponse createStudentProfile(String email, StudentProfileRequest request) {
        User user = getUserByEmail(email);
        enforceRole(user, Role.ROLE_STUDENT, "Only students can create a student profile");

        if (studentProfileRepository.existsByUserId(user.getId())) {
            throw new DuplicateResourceException("Student profile already exists");
        }

        StudentProfile profile = StudentProfile.builder()
                .user(user)
                .headline(request.getHeadline())
                .education(request.getEducation())
                .skills(request.getSkills())
                .experience(request.getExperience())
                .projects(request.getProjects())
                .resumeUrl(request.getResumeUrl())
                .bio(request.getBio())
                .phone(request.getPhone())
                .build();

        return StudentProfileResponse.fromProfile(studentProfileRepository.save(profile));
    }

    @Transactional
    public StudentProfileResponse updateStudentProfile(String email, StudentProfileRequest request) {
        User user = getUserByEmail(email);
        StudentProfile profile = studentProfileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found. Create one first."));

        profile.setHeadline(request.getHeadline());
        profile.setEducation(request.getEducation());
        profile.setSkills(request.getSkills());
        profile.setExperience(request.getExperience());
        profile.setProjects(request.getProjects());
        profile.setResumeUrl(request.getResumeUrl());
        profile.setBio(request.getBio());
        profile.setPhone(request.getPhone());

        return StudentProfileResponse.fromProfile(studentProfileRepository.save(profile));
    }

    // ─── Company Profile ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CompanyProfileResponse getCompanyProfile(String email) {
        User user = getUserByEmail(email);
        CompanyProfile profile = companyProfileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Company profile not found"));
        return CompanyProfileResponse.fromProfile(profile);
    }

    @Transactional(readOnly = true)
    public CompanyProfileResponse getCompanyProfileById(Long userId) {
        CompanyProfile profile = companyProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Company profile not found for user " + userId));
        return CompanyProfileResponse.fromProfile(profile);
    }

    @Transactional
    public CompanyProfileResponse createCompanyProfile(String email, CompanyProfileRequest request) {
        User user = getUserByEmail(email);
        enforceRole(user, Role.ROLE_COMPANY, "Only companies can create a company profile");

        if (companyProfileRepository.existsByUserId(user.getId())) {
            throw new DuplicateResourceException("Company profile already exists");
        }

        CompanyProfile profile = CompanyProfile.builder()
                .user(user)
                .companyName(request.getCompanyName())
                .description(request.getDescription())
                .website(request.getWebsite())
                .industry(request.getIndustry())
                .location(request.getLocation())
                .logoUrl(request.getLogoUrl())
                .build();

        return CompanyProfileResponse.fromProfile(companyProfileRepository.save(profile));
    }

    @Transactional
    public CompanyProfileResponse updateCompanyProfile(String email, CompanyProfileRequest request) {
        User user = getUserByEmail(email);
        CompanyProfile profile = companyProfileRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Company profile not found. Create one first."));

        profile.setCompanyName(request.getCompanyName());
        profile.setDescription(request.getDescription());
        profile.setWebsite(request.getWebsite());
        profile.setIndustry(request.getIndustry());
        profile.setLocation(request.getLocation());
        profile.setLogoUrl(request.getLogoUrl());

        return CompanyProfileResponse.fromProfile(companyProfileRepository.save(profile));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private void enforceRole(User user, Role required, String message) {
        if (user.getRole() != required) {
            throw new ForbiddenOperationException(message);
        }
    }
}
