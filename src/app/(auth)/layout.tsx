export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="w-full max-w-md rounded-lg bg-surface-container-lowest p-8 shadow-ambient">
        {children}
      </div>
    </div>
  );
}
