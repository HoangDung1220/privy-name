import { PrivyName } from "@/components/PrivyName";

export default function Home() {
  return (
    <main className="h-full">
      <div className="flex h-full flex-col gap-8 items-center sm:items-start w-full px-3 md:px-0">
        <PrivyName />
      </div>
    </main>
  );
}
