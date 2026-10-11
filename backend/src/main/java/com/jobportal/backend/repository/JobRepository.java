package com.jobportal.backend.repository;

import com.jobportal.backend.entity.EmploymentType;
import com.jobportal.backend.entity.Job;
import com.jobportal.backend.entity.JobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    Page<Job> findByStatus(JobStatus status, Pageable pageable);

    Page<Job> findByCompanyId(Long companyId, Pageable pageable);

    Page<Job> findByCompanyIdAndStatus(Long companyId, JobStatus status, Pageable pageable);

    @Query("SELECT j FROM Job j WHERE (:status IS NULL OR j.status = :status) " +
           "AND (:title IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', :title, '%'))) " +
           "AND (:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))) " +
           "AND (:category IS NULL OR LOWER(j.category) LIKE LOWER(CONCAT('%', :category, '%'))) " +
           "AND (:employmentType IS NULL OR j.employmentType = :employmentType)")
    Page<Job> searchJobs(
            @Param("status") JobStatus status,
            @Param("title") String title,
            @Param("location") String location,
            @Param("category") String category,
            @Param("employmentType") EmploymentType employmentType,
            Pageable pageable
    );

    long countByStatus(JobStatus status);
}
