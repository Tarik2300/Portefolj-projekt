package ek.tzn.todoapp.repository;

import ek.tzn.todoapp.entity.Subtask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubtaskRepository extends JpaRepository<Subtask, Long> {

    List<Subtask> findByTask_IdOrderByIdAsc(Long taskId);
}
