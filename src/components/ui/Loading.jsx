import { PawPrint } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex justify-center items-center py-10">
      <PawPrint
        className="
          text-orange-500
          animate-bounce
        "
        size={40}
      />
    </div>
  );
}