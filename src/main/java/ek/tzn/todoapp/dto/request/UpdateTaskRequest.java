package ek.tzn.todoapp.dto.request;

import ek.tzn.todoapp.entity.enums.Priority;
import ek.tzn.todoapp.entity.enums.Status;

public class UpdateTaskRequest {
    private String title;
    private String description;
    private Status status;
    private Priority priority;

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }
}
