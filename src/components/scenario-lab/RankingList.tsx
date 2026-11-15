import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

function RankingItem({ item, rank }: { item: string; rank: number }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`relative flex min-h-16 items-center gap-3 border border-report-rule bg-report-paper p-3 ${isDragging ? "z-30 opacity-80" : ""}`}>
      <span className="w-4 shrink-0 font-system text-sm font-bold">{rank + 1}</span>
      <span className="min-w-0 flex-1 text-[11px] font-semibold leading-5">{item}</span>
      <Button ref={setActivatorNodeRef} type="button" variant="ghost" size="icon" className="size-10 shrink-0 touch-none cursor-grab active:cursor-grabbing" title="Reorder priority" aria-label={`Reorder ${item}`} {...attributes} {...listeners}><GripVertical className="size-5" /></Button>
    </li>
  );
}

export function RankingList({ items, onChange, label }: { items: string[]; onChange: (items: string[]) => void; label: string }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
      if (!over || active.id === over.id) return;
      const from = items.indexOf(String(active.id));
      const to = items.indexOf(String(over.id));
      if (from < 0 || to < 0) return;
      const next = [...items];
      const moved = next.splice(from, 1)[0];
      if (moved === undefined) return;
      next.splice(to, 0, moved);
      onChange(next);
    }}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <ol className="space-y-2" aria-label={label}>{items.map((item, rank) => <RankingItem key={item} item={item} rank={rank} />)}</ol>
      </SortableContext>
    </DndContext>
  );
}