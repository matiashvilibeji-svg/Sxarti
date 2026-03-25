export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 sm:px-6">
      <div className="w-full max-w-md rounded-lg bg-surface-container-lowest p-6 shadow-ambient sm:p-8">
        {children}
      </div>
    </div>
  );
}
