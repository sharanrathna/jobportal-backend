package com.jobportal.backend.repository;

import com.jobportal.backend.entity.Interview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {

    List<Interview> findByStudentIdOrderByScheduledAtDesc(Long studentId);

    Page<Interview> findByStudentIdOrderByScheduledAtDesc(Long studentId, Pageable pageable);

    List<Interview> findByCompanyIdOrderByScheduledAtDesc(Long companyId);

    Page<Interview> findByCompanyIdOrderByScheduledAtDesc(Long companyId, Pageable pageable);

    Optional<Interview> findByApplicationId(Long applicationId);

    Optional<Interview> findByIdAndCompanyId(Long id, Long companyId);

    long countByCompanyId(Long companyId);

    long countByStudentId(Long studentId);
}
