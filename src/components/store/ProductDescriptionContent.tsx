import { productDescriptionSections } from '@/lib/product-description-sections';

/** Text nodes only, shared by the server summary and the interactive product page. */
export default function ProductDescriptionContent({ value }: { value: string }) {
  const sections = productDescriptionSections(value);
  return <div className="space-y-6 break-words text-sm leading-7 text-slate-700 sm:text-base [overflow-wrap:anywhere]">{sections.map(section => <section key={section.title}>
    {(sections.length > 1 || section.title !== 'Sobre este material') && <h3 className="mb-2 text-base font-bold text-slate-950">{section.title}</h3>}
    {section.text.split(/\n\s*\n/).map((paragraph, index) => {
      const lines = paragraph.split('\n').filter(line => line.trim());
      return lines.length > 0 && lines.every(line => /^\s*(?:[•*-]|\d+[.)])\s+/.test(line))
        ? <ul key={index} className="mb-3 list-disc space-y-1 pl-5">{lines.map((line, i) => <li key={i}>{line.replace(/^\s*(?:[•*-]|\d+[.)])\s+/, '')}</li>)}</ul>
        : <p key={index} className="mb-3 whitespace-pre-line">{paragraph}</p>;
    })}
  </section>)}</div>;
}
