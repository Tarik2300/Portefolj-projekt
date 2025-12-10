package ek.tzn.todoapp.dto.response;

import ek.tzn.todoapp.entity.Subtask;

public record SubtaskResponse(
    Long id,
    String description,
    boolean completed,
    Long taskId
) {
    public static SubtaskResponse fromEntity(Subtask subtask) {
        return new SubtaskResponse(
            subtask.getId(),
            subtask.getDescription(),
            subtask.isCompleted(),
            subtask.getTask().getId()
        );
    }
}
