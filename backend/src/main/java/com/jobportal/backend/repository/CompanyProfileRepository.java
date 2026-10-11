package com.jobportal.backend.repository;

import com.jobportal.backend.entity.CompanyProfile;
import com.jobportal.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyProfileRepository extends JpaRepository<CompanyProfile, Long> {
    Optional<CompanyProfile> findByUserId(Long userId);
    Optional<CompanyProfile> findByUser(User user);
    boolean existsByUserId(Long userId);
}
