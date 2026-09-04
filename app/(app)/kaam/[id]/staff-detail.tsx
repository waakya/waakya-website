import { Avatar } from "@/components/ui/avatar";
import { getDictionary } from "@/lib/i18n";
import { formatTime } from "@/lib/tasks/time";
import { availableTransitions } from "@/lib/tasks/authz";
import type { MemberRole } from "@/lib/supabase/types";
import { TaskShell, type DetailProps } from "./task-shell";
import { StaffActions } from "./staff-actions";

/**
 * The staff task detail (screens/TaskStaff.png): the owner's name above the
 * title, the deadline in a Neel band with the time left, and **one 60px
 * button**. No coloured header, nothing else to decide.
 */
export function StaffTaskDetail(props: DetailProps & { role: MemberRole | null }) {
  const t = getDictionary(props.locale);
  const { task } = props;
  const allowed = availableTransitions(
    { role: props.role, isAssignee: task.assigneeId === props.viewerId },
    task.state,
  );

  return (
    <TaskShell
      {...props}
      heading={task.state === "delivered" ? t.detail.newTaskTitle : t.detail.title}
      lead={
        <div className="flex items-center gap-3">
          <Avatar name={task.createdByName} size={44} />
          <div className="min-w-0">
            <p className="text-[17px] leading-[22px] font-bold text-ink-900">
              {task.createdByName}
            </p>
            {task.deliveredAt ? (
              <p className="num text-[15px] leading-[20px] text-ink-500">
                {t.detail.sentAt(formatTime(task.deliveredAt))}
              </p>
            ) : null}
          </div>
        </div>
      }
    >
      <StaffActions
        locale={props.locale}
        taskId={task.id}
        state={task.state}
        allowed={allowed}
        proofRequired={task.proofRequired}
      />
    </TaskShell>
  );
}
