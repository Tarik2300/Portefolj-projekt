package ek.tzn.todoapp.dto.request;

import ek.tzn.todoapp.entity.enums.Priority;

public class CreateTaskRequest {
    private String title;
    private String description;
    private Priority priority;
    private Long userId;

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}
