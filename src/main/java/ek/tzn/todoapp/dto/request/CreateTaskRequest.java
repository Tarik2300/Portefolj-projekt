package ek.tzn.todoapp.dto.request;

import ek.tzn.todoapp.entity.enums.Priority;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class CreateTaskRequest {

    @NotBlank(message = "Titel må ikke være tom")
    private String title;

    private String description;

    private Priority priority;

    @FutureOrPresent(message = "Deadline må ikke være i fortiden")
    private LocalDate deadline;

    @NotNull(message = "Opgaven skal tildeles en bruger")
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
