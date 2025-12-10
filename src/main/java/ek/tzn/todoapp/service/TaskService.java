package ek.tzn.todoapp.service;

import ek.tzn.todoapp.dto.request.CreateTaskRequest;
import ek.tzn.todoapp.dto.request.UpdateTaskRequest;
import ek.tzn.todoapp.dto.response.TaskResponse;
import ek.tzn.todoapp.entity.Task;
import ek.tzn.todoapp.entity.User;
import ek.tzn.todoapp.entity.enums.Status;
import ek.tzn.todoapp.exception.ResourceNotFoundException;
import ek.tzn.todoapp.repository.TaskRepository;
import ek.tzn.todoapp.repository.UserRepository;
import org.springframework.stereotype.Service;
import ek.tzn.todoapp.exception.UnauthorizedException;


import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

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

    // OBS: Rettet til at tage currentUserId med og lave check:
    public TaskResponse updateStatus(Long taskId, Status newStatus, Long currentUserId) {
        Task task = findTaskById(taskId);

        // Ejer-check: kun den bruger, som opgaven er tildelt, må ændre status
        if (!task.getAssignedTo().getId().equals(currentUserId)) {
            throw new UnauthorizedException("Du kan ikke ændre status på en opgave, der ikke er din.");
        }

        task.setStatus(newStatus);
        return TaskResponse.fromEntity(taskRepository.save(task));
    }


    // TODO: Tilføj ownership check når auth er implementeret
    public TaskResponse archiveTask(Long taskId) {
        Task task = findTaskById(taskId);
        task.setStatus(Status.ARCHIVED);
        return TaskResponse.fromEntity(taskRepository.save(task));
    }
    //sdfsdf
}
