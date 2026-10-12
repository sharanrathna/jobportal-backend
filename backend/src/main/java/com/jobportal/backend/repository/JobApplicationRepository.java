package com.jobportal.backend.repository;

import com.jobportal.backend.entity.ApplicationStatus;
import com.jobportal.backend.entity.JobApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    Page<JobApplication> findByStudentId(Long studentId, Pageable pageable);

    Page<JobApplication> findByJobId(Long jobId, Pageable pageable);

    boolean existsByJobIdAndStudentId(Long jobId, Long studentId);

    Optional<JobApplication> findByJobIdAndStudentId(Long jobId, Long studentId);

    @Query("SELECT ja FROM JobApplication ja WHERE ja.job.company.id = :companyId")
    Page<JobApplication> findByJobCompanyId(@Param("companyId") Long companyId, Pageable pageable);

    long countByStatus(ApplicationStatus status);

    long countByStudentId(Long studentId);

    long countByStudentIdAndStatus(Long studentId, ApplicationStatus status);

    long countByJobId(Long jobId);

    long countByJobCompanyId(Long companyId);

    long countByJobCompanyIdAndStatus(Long companyId, ApplicationStatus status);
}
