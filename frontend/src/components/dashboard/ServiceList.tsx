import type { Service } from "../../types/dashboard";
import ServiceCard from "../ServiceCard";

interface ServiceListProps {
  services: Service[];
  busy: boolean;
  onToggle: (service: Service) => void;
}

export default function ServiceList({ services, busy, onToggle }: ServiceListProps) {
  return (
    <section aria-label="Available services" className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {services.map((service) => (
        <ServiceCard key={service.name} service={service} busy={busy} onToggle={() => onToggle(service)} />
      ))}
    </section>
  );
}
