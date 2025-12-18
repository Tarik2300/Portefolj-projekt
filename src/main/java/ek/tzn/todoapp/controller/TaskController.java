package ek.tzn.todoapp.controller;

import ek.tzn.todoapp.dto.request.CreateTaskRequest;
import ek.tzn.todoapp.dto.request.StatusUpdateRequest;
import ek.tzn.todoapp.dto.request.UpdateTaskRequest;
import ek.tzn.todoapp.dto.response.TaskResponse;
import ek.tzn.todoapp.entity.enums.Priority;
import ek.tzn.todoapp.entity.enums.Status;
import ek.tzn.todoapp.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public List<TaskResponse> getAllTasks(
            @RequestParam(required = false) Status status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) Long assignedToId
    ) {
        return taskService.getAllTasks(status, priority, assignedToId);
    }

    @GetMapping("/my")
    public List<TaskResponse> getMyTasks(@RequestParam Long userId) {
        return taskService.getTasksForUser(userId);
    }

    @GetMapping("/{id}")
    public TaskResponse getTaskById(@PathVariable Long id) {
        return taskService.getTaskById(id);
    }

    @PostMapping
    public TaskResponse createTask(@Valid @RequestBody CreateTaskRequest request) {
        return taskService.createTask(request);
    }

    @PutMapping("/{id}")
    public TaskResponse updateTask(@PathVariable Long id, @RequestBody UpdateTaskRequest request) {
        return taskService.updateTask(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
    // OBS: Rettet til at sende userId med
    @PatchMapping("/{id}/status")
    public TaskResponse updateStatus(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestBody StatusUpdateRequest request
    ) {
        return taskService.updateStatus(id, request.getStatus(), userId);
    }


    @PatchMapping("/{id}/archive")
    public TaskResponse archiveTask(
            @PathVariable Long id,
            @RequestParam Long userId
    ) {
        return taskService.archiveTask(id, userId);
    }
}
