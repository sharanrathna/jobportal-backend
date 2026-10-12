package com.jobportal.backend.service;

import com.jobportal.backend.dto.AdminMetricsResponse;
import com.jobportal.backend.dto.UserResponse;
import com.jobportal.backend.entity.*;
import com.jobportal.backend.exception.BadRequestException;
import com.jobportal.backend.exception.ResourceNotFoundException;
import com.jobportal.backend.repository.JobApplicationRepository;
import com.jobportal.backend.repository.JobRepository;
import com.jobportal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final JobApplicationRepository applicationRepository;

    @Transactional(readOnly = true)
    public AdminMetricsResponse getMetrics() {
        long totalUsers        = userRepository.count();
        long totalStudents     = userRepository.countByRole(Role.ROLE_STUDENT);
        long totalCompanies    = userRepository.countByRole(Role.ROLE_COMPANY);
        long activeUsers       = userRepository.countByActiveTrue();
        long totalJobs         = jobRepository.count();
        long openJobs          = jobRepository.countByStatus(JobStatus.OPEN);
        long closedJobs        = jobRepository.countByStatus(JobStatus.CLOSED);
        long totalApplications = applicationRepository.count();
        long pendingApps       = applicationRepository.countByStatus(ApplicationStatus.APPLIED);

        return AdminMetricsResponse.builder()
                .totalUsers(totalUsers)
                .totalStudents(totalStudents)
                .totalCompanies(totalCompanies)
                .activeUsers(activeUsers)
                .totalJobs(totalJobs)
                .openJobs(openJobs)
                .closedJobs(closedJobs)
                .totalApplications(totalApplications)
                .pendingApplications(pendingApps)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(UserResponse::fromUser);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return UserResponse.fromUser(user);
    }

    @Transactional
    public UserResponse setUserActive(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getRole() == Role.ROLE_ADMIN) {
            throw new BadRequestException("Cannot deactivate another admin account");
        }

        user.setActive(active);
        User saved = userRepository.save(user);
        log.info("Admin set user #{} active={}", userId, active);
        return UserResponse.fromUser(saved);
    }
}
