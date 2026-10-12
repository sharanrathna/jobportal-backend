package com.jobportal.backend.controller;

import com.jobportal.backend.dto.*;
import com.jobportal.backend.entity.Role;
import com.jobportal.backend.entity.User;
import com.jobportal.backend.repository.UserRepository;
import com.jobportal.backend.security.JwtUtils;
import com.jobportal.backend.security.UserDetailsImpl;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthController(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtils jwtUtils
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        // Check duplicate email
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(false, "Email is already registered"));
        }

        // Validate Role (only STUDENT and COMPANY self-registration is allowed)
        Role role;
        try {
            role = Role.fromString(request.getRole());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(false, "Invalid role. Role must be STUDENT or COMPANY"));
        }

        if (role == Role.ROLE_ADMIN) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(false, "Public registration as ADMIN is not permitted"));
        }

        // Create user
        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .active(true)
                .build();

        User savedUser = userRepository.save(user);

        // Generate JWT
        UserDetailsImpl userDetails = UserDetailsImpl.build(savedUser);
        String token = jwtUtils.generateToken(userDetails);

        log.info("Successfully registered user: {} with role: {}", email, role);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(token, "Bearer", UserResponse.fromUser(savedUser)));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        // Check if account exists
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        // Reject inactive accounts
        if (!user.isActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse(false, "Account is inactive. Please contact support."));
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String token = jwtUtils.generateToken(userDetails);

        log.info("User logged in successfully: {}", email);

        return ResponseEntity.ok(new AuthResponse(token, "Bearer", UserResponse.fromUser(user)));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse(false, "Full authentication is required"));
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        if (!user.isActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse(false, "Account is inactive."));
        }

        return ResponseEntity.ok(UserResponse.fromUser(user));
    }
}
