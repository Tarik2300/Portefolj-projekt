package ek.tzn.todoapp.service;

import ek.tzn.todoapp.dto.request.CreateTaskRequest;
import ek.tzn.todoapp.dto.request.UpdateTaskRequest;
import ek.tzn.todoapp.dto.response.TaskResponse;
import ek.tzn.todoapp.entity.Subtask;
import ek.tzn.todoapp.entity.Task;
import ek.tzn.todoapp.entity.User;
import ek.tzn.todoapp.entity.enums.Status;
import ek.tzn.todoapp.exception.ResourceNotFoundException;
import ek.tzn.todoapp.exception.UnauthorizedException;
import ek.tzn.todoapp.exception.ValidationException;
import ek.tzn.todoapp.repository.TaskRepository;
import ek.tzn.todoapp.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    private static final List<Status> STATUS_FLOW = List.of(Status.TODO, Status.IN_PROGRESS, Status.DONE);

    public TaskService(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    public List<TaskResponse> getAllTasks(Long assignedToId) {
        List<Task> tasks;
        if (assignedToId != null) {
            tasks = taskRepository.findByAssignedToId(assignedToId);
        } else {
            tasks = taskRepository.findAll();
        }
        return tasks.stream().map(TaskResponse::fromEntity).toList();
    }

    public List<TaskResponse> getTasksForUser(Long userId) {
        return taskRepository.findByAssignedToIdAndStatusNot(userId, Status.ARCHIVED)
                .stream().map(TaskResponse::fromEntity).toList();
    }

    public TaskResponse getTaskById(Long id) {
        Task task = findTaskById(id);
        return TaskResponse.fromEntity(task);
    }

    public TaskResponse createTask(CreateTaskRequest request) {
        User user = userRepository.findById(request.getAssignedToId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setPriority(request.getPriority());
        task.setDeadline(request.getDeadline());
        task.setAssignedTo(user);

        return TaskResponse.fromEntity(taskRepository.save(task));
    }

    public TaskResponse updateTask(Long id, UpdateTaskRequest request) {
        Task task = findTaskById(id);

        if (task.getStatus() == Status.ARCHIVED) {
            throw new IllegalStateException("Arkiverede opgaver kan ikke ændres.");
        }

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getDeadline() != null) task.setDeadline(request.getDeadline());
        if (request.getStatus() != null) task.setStatus(request.getStatus());

        return TaskResponse.fromEntity(taskRepository.save(task));
    }

    private Task findTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }

    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }

    public TaskResponse updateStatus(Long taskId, Status newStatus, Long currentUserId) {
        Task task = findTaskById(taskId);

        if (task.getStatus() == Status.ARCHIVED) {
            throw new IllegalStateException("Arkiverede opgaver kan ikke ændres.");
        }

        // Ejer-check: kun den bruger, som opgaven er tildelt, må ændre status
        if (!task.getAssignedTo().getId().equals(currentUserId)) {
            throw new UnauthorizedException("Du kan ikke ændre status på en opgave, der ikke er din.");
        }

        // Status-flow validering (Drag & Drop)
        validateStatusTransition(task.getStatus(), newStatus);

        task.setStatus(newStatus);
        return TaskResponse.fromEntity(taskRepository.save(task));
    }

    private void validateStatusTransition(Status from, Status to) {
        if (to == null) {
            throw new ValidationException("Status må ikke være null.");
        }

        // ARCHIVED må kun ske via /archive endpoint
        if (to == Status.ARCHIVED) {
            throw new ValidationException("Brug arkivér-endpointet for at arkivere en opgave.");
        }

        // Hvis allerede arkiveret, må den ikke flyttes
        if (from == Status.ARCHIVED) {
            throw new ValidationException("Du kan ikke ændre status på en arkiveret opgave.");
        }

        // ingen ændring er ok
        if (from == to) return;

        int fromIdx = STATUS_FLOW.indexOf(from);
        int toIdx = STATUS_FLOW.indexOf(to);

        if (fromIdx == -1 || toIdx == -1) {
            throw new ValidationException("Ugyldigt status-skift.");
        }

        // kun én kolonne ad gangen (begge retninger)
        if (Math.abs(toIdx - fromIdx) != 1) {
            throw new ValidationException("Ugyldigt status-skift: du kan kun flytte en kolonne ad gangen.");
        }
    }

    public TaskResponse archiveTask(Long taskId, Long currentUserId) {
        Task task = findTaskById(taskId);

        // 3.4 – ejer-check: må kun arkiveres af den, der er assignedTo
        if (!task.getAssignedTo().getId().equals(currentUserId)) {
            throw new UnauthorizedException("Du kan ikke arkivere en opgave, der ikke er din.");
        }

        // 3.3 – cascade: markér alle subtasks som completed
        if (task.getSubtasks() != null) {
            for (Subtask subtask : task.getSubtasks()) {
                subtask.setCompleted(true);
            }
        }

        task.setStatus(Status.ARCHIVED);
        return TaskResponse.fromEntity(taskRepository.save(task));
    }
}
