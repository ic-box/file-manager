import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Selection } from "../Browser/Selection.js";
import { Color } from "../Primitives/Color.jsx";

export function createGrid<T extends { id: string }>() {
  interface GridContext {
    entry: T;
    selection?: Selection<T>;
    size: number;
    columns: number;
    index: number;
    entries: T[];
  }

  const GridContext = createContext<GridContext | null>(null);

  function Grid({
    children,
    entries,
    selection,
    columnWidth = 100,
    columnGap = 10,
  }: {
    children?: ReactNode;
    entries?: T[];
    selection?: Selection<T>;
    columnWidth?: number;
    columnGap?: number;
  }) {
    const gridRef = useRef<HTMLDivElement | null>(null);

    const [columns, setColumns] = useState(5);

    useEffect(() => {
      if (gridRef.current == null) {
        return;
      }

      const ro = new ResizeObserver(() => {
        const { width } = gridRef.current!.getBoundingClientRect();
        setColumns(
          Math.floor((width - columnWidth) / (columnWidth + columnGap) + 1)
        );
      });
      ro.observe(gridRef.current);
      return () => ro.disconnect();
    }, []);

    return (
      <div
        css={{
          padding: 10,
          "--highlight-bg": Color.Gray[300],
          "--highlight-fg": Color.Black,
          ":focus-within": {
            "--highlight-bg": Color.Blue[500],
            "--highlight-fg": Color.White,
          },
        }}
      >
        <div
          ref={gridRef}
          css={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: columnGap,
          }}
        >
          {entries?.map((entry, index) => (
            <GridContext.Provider
              key={entry.id}
              value={{
                entry,
                selection,
                size: columnWidth,
                columns,
                index,
                entries,
              }}
            >
              {children}
            </GridContext.Provider>
          ))}
        </div>
      </div>
    );
  }

  function Entry({ children }: { children: (entry: T) => ReactNode }) {
    const ctx = useContext(GridContext);
    if (ctx == null) {
      return null;
    }

    const isSelected = ctx.selection?.isSelected(ctx.entry) || false;

    return (
      <div
        tabIndex={0}
        onMouseDown={(e) => {
          e.currentTarget.focus();
          ctx.selection?.selectWithClick(ctx.entry, e.nativeEvent);
        }}
        onKeyDown={(e) => {
          let x = ctx.index % ctx.columns;
          let y = Math.floor(ctx.index / ctx.columns);

          switch (e.key) {
            case "ArrowUp":
              y -= 1;
              break;
            case "ArrowDown":
              y += 1;
              break;
            case "ArrowLeft":
              x -= 1;
              break;
            case "ArrowRight":
              x += 1;
              break;
            case "a":
              if (!e.shiftKey && !e.altKey && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                ctx.selection?.selectAll();
              }
              return;
            default:
              return;
          }

          if (x < 0 || x >= ctx.columns) {
            return;
          }

          const newIndex = y * ctx.columns + x;
          (
            e.currentTarget.parentElement?.children.item(
              newIndex
            ) as HTMLElement | null
          )?.focus();

          const item = ctx.entries[newIndex];
          if (item) {
            ctx.selection?.selectWithKey(item, e.nativeEvent);
          }
        }}
        css={{
          flexBasis: ctx.size,
          flexGrow: 0,
          flexShrink: 0,
          background: isSelected ? "var(--highlight-bg)" : "transparent",
          color: isSelected ? "var(--highlight-fg)" : "inherit",
          cursor: "default",
          outline: 0,
          padding: 8,
          borderRadius: 4,
        }}
      >
        {children(ctx.entry)}
      </div>
    );
  }

  return { Grid, Entry };
}