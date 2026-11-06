"use client";

import { CATALOGUE_FORM_ID } from "@/components/catalogue/catalogue-filters";
import { NativeSelect } from "@/components/catalogue/native-select";
import { SORT_OPTIONS, type CatalogueSort } from "@/lib/validations/catalogue-params";

/** Lives in the results toolbar but belongs to the filter form via the `form` attribute. */
export function SortSelect({ value }: { value: CatalogueSort }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="catalogue-sort" className="text-sm whitespace-nowrap text-muted-foreground">
        Sort by
      </label>
      <NativeSelect
        id="catalogue-sort"
        name="sort"
        form={CATALOGUE_FORM_ID}
        defaultValue={value}
        className="w-48"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {Object.entries(SORT_OPTIONS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
