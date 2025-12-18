package ek.tzn.todoapp.repository;

import ek.tzn.todoapp.entity.Task;
import ek.tzn.todoapp.entity.enums.Priority;
import ek.tzn.todoapp.entity.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByAssignedToIdAndStatusNot(Long userId, Status status);

    // Filtrering på én parameter
    List<Task> findByStatus(Status status);

    List<Task> findByPriority(Priority priority);

    List<Task> findByAssignedToId(Long assignedToId);

    // Kombination af to filtre
    List<Task> findByStatusAndPriority(Status status, Priority priority);

    List<Task> findByStatusAndAssignedToId(Status status, Long assignedToId);

    List<Task> findByPriorityAndAssignedToId(Priority priority, Long assignedToId);

    // Alle tre filtre på én gang
    List<Task> findByStatusAndPriorityAndAssignedToId(Status status, Priority priority, Long assignedToId);
}
