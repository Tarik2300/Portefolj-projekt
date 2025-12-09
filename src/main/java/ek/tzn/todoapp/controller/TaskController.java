package ek.tzn.todoapp.controller;

import ek.tzn.todoapp.dto.request.CreateTaskRequest;
import ek.tzn.todoapp.dto.request.StatusUpdateRequest;
import ek.tzn.todoapp.dto.request.UpdateTaskRequest;
import ek.tzn.todoapp.entity.Task;
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
    public List<Task> getAllTasks(@RequestParam(required = false) Long assignedToId) {
        return taskService.getAllTasks(assignedToId);
    }

    @GetMapping("/my")
    public List<Task> getMyTasks(@RequestParam Long userId) {
        return taskService.getTasksForUser(userId);
    }

    @GetMapping("/{id}")
    public Task getTaskById(@PathVariable Long id) {
        return taskService.getTaskById(id);
    }

    @PostMapping
    public Task createTask(@Valid @RequestBody CreateTaskRequest request) {
        return taskService.createTask(request);
    }

    @PutMapping("/{id}")
    public Task updateTask(@PathVariable Long id, @RequestBody UpdateTaskRequest request) {
        return taskService.updateTask(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public Task updateStatus(@PathVariable Long id, @RequestBody StatusUpdateRequest request) {
        return taskService.updateStatus(id, request.getStatus());
    }

    @PatchMapping("/{id}/archive")
    public Task archiveTask(@PathVariable Long id) {
        return taskService.archiveTask(id);
    }
}
