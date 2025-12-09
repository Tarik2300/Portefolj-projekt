package ek.tzn.todoapp.repository;

import ek.tzn.todoapp.entity.Task;
import ek.tzn.todoapp.entity.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByAssignedToIdAndStatusNot(Long userId, Status status);

    List<Task> findByAssignedToId(Long userId);
}
