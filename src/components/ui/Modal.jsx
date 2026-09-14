export default function Modal({
  open,
  onClose,
  title,
  children,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-6xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-5">
            {title}
          </h2>

          {children}
        </div>
      </div>
    </div>
  );
}