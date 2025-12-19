package ek.tzn.todoapp.dto.response;

import ek.tzn.todoapp.entity.Task;
import ek.tzn.todoapp.entity.enums.Priority;
import ek.tzn.todoapp.entity.enums.Status;
import java.time.LocalDate;
import java.util.List;

public record TaskResponse(
    Long id,
    String title,
    String description,
    Priority priority,
    LocalDate deadline,
    Status status,
    Long assignedToId,
    List<SubtaskResponse> subtasks
) {

    public static TaskResponse fromEntity(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getPriority(),
                task.getDeadline(),
                task.getStatus(),
                task.getAssignedTo().getId(),
                List.of() //
        );
    }
}
