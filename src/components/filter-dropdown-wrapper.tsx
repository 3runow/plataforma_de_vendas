"use client";

import FilterDropdown from "./filter-dropdown";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function FilterDropdownWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (filters: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (filters.length > 0) {
      params.set("filters", filters.join(","));
    } else {
      params.delete("filters");
    }

    router.push(`/?${params.toString()}`);
  };

  return <FilterDropdown onFilterChange={handleFilterChange} />;
}
