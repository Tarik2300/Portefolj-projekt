package ek.tzn.todoapp.dto.request;

public class CreateSubtaskRequest {
    private String title;
    private Long taskId;

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }
}
