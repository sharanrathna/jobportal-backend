package com.jobportal.backend.service;

import com.jobportal.backend.dto.NotificationResponse;
import com.jobportal.backend.entity.Notification;
import com.jobportal.backend.entity.User;
import com.jobportal.backend.exception.ResourceNotFoundException;
import com.jobportal.backend.repository.NotificationRepository;
import com.jobportal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public Notification createNotification(User recipient, String title, String message, String type, Long referenceId) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .read(false)
                .build();
        Notification saved = notificationRepository.save(notification);
        log.info("Notification created for user #{} [{}]: {}", recipient.getId(), recipient.getEmail(), title);
        return saved;
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getMyNotifications(String userEmail, Pageable pageable) {
        User user = getUserByEmail(userEmail);
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(NotificationResponse::fromNotification);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getUnreadCount(String userEmail) {
        User user = getUserByEmail(userEmail);
        long count = notificationRepository.countByRecipientIdAndReadFalse(user.getId());
        return Map.of("unreadCount", count);
    }

    @Transactional
    public NotificationResponse markAsRead(String userEmail, Long notificationId) {
        User user = getUserByEmail(userEmail);
        Notification notification = notificationRepository.findByIdAndRecipientId(notificationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));
        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return NotificationResponse.fromNotification(saved);
    }

    @Transactional
    public Map<String, Object> markAllAsRead(String userEmail) {
        User user = getUserByEmail(userEmail);
        notificationRepository.markAllAsReadByRecipientId(user.getId());
        return Map.of("success", true, "message", "All notifications marked as read");
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
