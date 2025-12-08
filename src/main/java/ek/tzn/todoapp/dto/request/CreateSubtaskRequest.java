package ek.tzn.todoapp.dto.request;

public class CreateSubtaskRequest {
    private String description;
    private Long taskId;

    // Getters and Setters
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }
}
