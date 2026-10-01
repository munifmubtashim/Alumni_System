import { useCallback, useEffect, useState } from "react";
import type { Alumni } from "@alumni/shared";
import { getAlumni } from "../services/alumniApi";

export function useAlumni() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setAlumni(await getAlumni());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { alumni, loading, error, reload: load };
}
