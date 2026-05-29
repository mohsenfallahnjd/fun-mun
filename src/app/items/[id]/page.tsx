import { ItemDetailView } from "@/components/ItemDetailView";
import { AppHeader } from "@/components/SiteNav";

export default function ItemPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="mx-auto hidden w-full max-w-2xl px-4 pt-6 sm:block sm:px-6">
        <AppHeader />
      </div>
      <ItemDetailView />
    </div>
  );
}
