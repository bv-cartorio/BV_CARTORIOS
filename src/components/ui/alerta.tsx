type AlertaProps = {
  tipo?: "erro" | "sucesso" | "aviso";
  children: React.ReactNode;
};

const ESTILOS = {
  erro: "border-laranja-200 bg-laranja-50 text-laranja-700",
  sucesso: "border-marinho-200 bg-marinho-50 text-marinho-800",
  aviso: "border-creme-200 bg-creme text-marinho-700",
} as const;

export function Alerta({ tipo = "erro", children }: AlertaProps) {
  return (
    <div
      role={tipo === "erro" ? "alert" : "status"}
      className={`rounded-lg border px-4 py-3 text-sm ${ESTILOS[tipo]}`}
    >
      {children}
    </div>
  );
}
