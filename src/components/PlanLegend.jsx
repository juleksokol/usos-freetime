// Legenda osób (kolor = osoba) jako osobny blok, który można przesuwać
export default function PlanLegend({ layers }) {
  return (
    <section className="flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow">
      {layers.map((layer) => (
        <span
          key={layer.id}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
        >
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: layer.color }}
          />
          {layer.name}
        </span>
      ))}
    </section>
  )
}