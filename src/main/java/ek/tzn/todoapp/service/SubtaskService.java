package ek.tzn.todoapp.service;

import ek.tzn.todoapp.dto.request.CreateSubtaskRequest;
import ek.tzn.todoapp.dto.response.SubtaskResponse;
import ek.tzn.todoapp.entity.Subtask;
import ek.tzn.todoapp.entity.Task;
import ek.tzn.todoapp.exception.ResourceNotFoundException;
import ek.tzn.todoapp.exception.UnauthorizedException;
import ek.tzn.todoapp.repository.SubtaskRepository;
import ek.tzn.todoapp.repository.TaskRepository;
import org.springframework.stereotype.Service;

@Service
public class SubtaskService {

    private final SubtaskRepository subtaskRepository;
    private final TaskRepository taskRepository;

    public SubtaskService(SubtaskRepository subtaskRepository, TaskRepository taskRepository) {
        this.subtaskRepository = subtaskRepository;
        this.taskRepository = taskRepository;
    }

    public SubtaskResponse createSubtask(Long taskId, CreateSubtaskRequest request, Long userId) {
        Task task = findTaskById(taskId);
        checkOwnership(task, userId);

        Subtask subtask = new Subtask();
        subtask.setDescription(request.getDescription());
        subtask.setTask(task);

        return SubtaskResponse.fromEntity(subtaskRepository.save(subtask));
    }

    public SubtaskResponse updateStatus(Long subtaskId, boolean completed, Long userId) {
        Subtask subtask = findSubtaskById(subtaskId);
        checkOwnership(subtask.getTask(), userId);

        subtask.setCompleted(completed);
        return SubtaskResponse.fromEntity(subtaskRepository.save(subtask));
    }

    public void deleteSubtask(Long subtaskId, Long userId) {
        Subtask subtask = findSubtaskById(subtaskId);
        checkOwnership(subtask.getTask(), userId);

        subtaskRepository.delete(subtask);
    }

    private Task findTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }

    private Subtask findSubtaskById(Long id) {
        return subtaskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask not found"));
    }

    private void checkOwnership(Task task, Long userId) {
        if (!task.getAssignedTo().getId().equals(userId)) {
            throw new UnauthorizedException("Du kan ikke ændre subtasks på en opgave, der ikke er din.");
        }
    }
}
