type VazioProps = {
  titulo: string;
  children?: React.ReactNode;
};

/** Estado vazio de uma listagem. */
export function Vazio({ titulo, children }: VazioProps) {
  return (
    <div className="rounded-2xl border border-dashed border-creme-200 bg-white px-6 py-12 text-center">
      <p className="font-semibold text-marinho-800">{titulo}</p>
      {children && (
        <div className="mx-auto mt-2 max-w-md text-sm text-marinho-600">
          {children}
        </div>
      )}
    </div>
  );
}
