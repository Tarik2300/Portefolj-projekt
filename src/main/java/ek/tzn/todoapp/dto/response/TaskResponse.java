package ek.tzn.todoapp.dto.response;

import ek.tzn.todoapp.entity.enums.Priority;
import ek.tzn.todoapp.entity.enums.Status;
import java.time.LocalDateTime;
import java.util.List;

public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private Status status;
    private Priority priority;
    private Long userId;
    private List<SubtaskResponse> subtasks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public List<SubtaskResponse> getSubtasks() { return subtasks; }
    public void setSubtasks(List<SubtaskResponse> subtasks) { this.subtasks = subtasks; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
