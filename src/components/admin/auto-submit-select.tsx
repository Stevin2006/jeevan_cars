"use client";

import { NativeSelect } from "@/components/catalogue/native-select";

/** Filter select that submits its GET form as soon as it changes. */
export function AutoSubmitSelect({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  options: [value: string, label: string][];
}) {
  return (
    <NativeSelect
      name={name}
      aria-label={label}
      defaultValue={defaultValue ?? ""}
      className="sm:w-44"
      onChange={(event) => event.currentTarget.form?.requestSubmit()}
    >
      {options.map(([value, text]) => (
        <option key={value} value={value}>
          {text}
        </option>
      ))}
    </NativeSelect>
  );
}
