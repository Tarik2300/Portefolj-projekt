package ek.tzn.todoapp.dto.request;

import ek.tzn.todoapp.entity.enums.Priority;
import java.time.LocalDate;

public class CreateTaskRequest {
    private String title;
    private String description;
    private Priority priority;
    private LocalDate deadline;
    private Long assignedToId;

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }

    public Long getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Long assignedToId) { this.assignedToId = assignedToId; }
}
