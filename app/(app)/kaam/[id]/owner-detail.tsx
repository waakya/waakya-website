import { Avatar } from "@/components/ui/avatar";
import { getDictionary } from "@/lib/i18n";
import { formatTime } from "@/lib/tasks/time";
import { availableTransitions } from "@/lib/tasks/authz";
import type { MemberRole } from "@/lib/supabase/types";
import { TaskShell, type DetailProps } from "./task-shell";
import { OwnerActions } from "./owner-actions";

/**
 * The owner's task detail (screens/TaskOwner.png): the stepper and clocks
 * first, then the instruction, then the timeline, then five equal actions
 * along the bottom with Call as the primary.
 */
export function OwnerTaskDetail(
  props: DetailProps & {
    role: MemberRole | null;
    members: { id: string; name: string }[];
    assigneePhone: string | null;
  },
) {
  const t = getDictionary(props.locale);
  const { task } = props;
  const allowed = availableTransitions(
    { role: props.role, isAssignee: task.assigneeId === props.viewerId },
    task.state,
  );

  return (
    <TaskShell
      {...props}
      heading={t.detail.title}
      lead={
        <div className="flex items-center gap-3">
          <Avatar name={task.assigneeName} size={44} />
          <div className="min-w-0">
            <p className="text-[17px] leading-[22px] font-bold text-ink-900">
              {task.assigneeName}
            </p>
            {task.deliveredAt ? (
              <p className="num text-[15px] leading-[20px] text-ink-500">
                {t.detail.sentBy(
                  task.createdByName,
                  formatTime(task.deliveredAt),
                )}
              </p>
            ) : null}
          </div>
        </div>
      }
    >
      <OwnerActions
        locale={props.locale}
        taskId={task.id}
        state={task.state}
        allowed={allowed}
        members={props.members}
        assigneePhone={props.assigneePhone}
      />
    </TaskShell>
  );
}
