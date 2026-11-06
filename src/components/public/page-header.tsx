import { SectionHeading } from "@/components/public/section-heading";

/** Opening band for inner pages; clears the fixed navbar. */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b bg-paper pt-[calc(var(--nav-height)+3rem)] pb-10 sm:pb-14">
      <div className="container-page flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading as="h1" eyebrow={eyebrow} title={title} description={description} />
        {children}
      </div>
    </div>
  );
}
