export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-white to-secondary/10">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">VitaVerse</h1>
          <p className="mt-1 text-sm text-gray-500">
            Fitness Challenge Verification
          </p>
        </div>
        <div className="rounded-xl bg-white p-8 shadow-lg">{children}</div>
      </div>
    </div>
  );
}
