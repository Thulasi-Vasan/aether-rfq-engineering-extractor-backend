import { Factory } from "lucide-react";

export function NavBar() {
  return (
    <header
      className="h-14 bg-bg-primary border-b border-border flex items-center px-6 sticky top-0 z-40"
      style={{ boxShadow: "0 1px 3px rgba(10,22,40,0.08)" }}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-navy-800 flex items-center justify-center">
          <Factory className="w-4 h-4 text-white" />
        </div>
        <span className="text-navy-900 font-bold tracking-tight">
          Machining Operation Extractor
        </span>
      </div>

      <div className="ml-auto" />
    </header>
  );
}
