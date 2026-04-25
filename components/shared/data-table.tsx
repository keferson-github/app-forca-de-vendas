import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type DataTableColumn = {
  id: string;
  label: React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn[];
  data: T[];
  getRowKey: (item: T) => string;
  renderRow: (item: T) => React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  tableClassName?: string;
  hideOnMobile?: boolean;
};

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  renderRow,
  footer,
  className,
  tableClassName,
  hideOnMobile = true,
}: DataTableProps<T>) {
  return (
    <div className={cn(hideOnMobile ? "hidden md:block" : "block", className)}>
      <Table className={tableClassName}>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id} className={column.className}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((item) => (
            <TableRow key={getRowKey(item)}>{renderRow(item)}</TableRow>
          ))}
        </TableBody>

        {footer ? <TableFooter>{footer}</TableFooter> : null}
      </Table>
    </div>
  );
}
