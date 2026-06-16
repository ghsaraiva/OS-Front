import { useState, useEffect, useRef } from "react";
import { Cidade } from "../../store/useAppStore";
import Input from "./input/InputField";
import api from "../../services/api";

interface AutocompleteCityProps {
  value?: string; // id_cidade
  onChange: (city: Cidade | null) => void;
  cities?: Cidade[]; // Prop opcional para manter compatibilidade
  error?: boolean;
  placeholder?: string;
  initialCityName?: string;
}

// Cache of resolved cities by ID to avoid redundant lookups
const resolvedCitiesCache = new Map<string, Cidade>();

// Helper to convert text to Title Case
const toTitleCase = (str: string) => {
  if (!str) return "";
  return str.toLowerCase().replace(/(?:^|\s|-)\S/g, (a) => a.toUpperCase());
};

export default function AutocompleteCity({
  value,
  onChange,
  error,
  placeholder = "Digite o nome da cidade...",
  initialCityName = "",
}: AutocompleteCityProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [localCities, setLocalCities] = useState<Cidade[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Effect to sync and fetch initial/changed city name by ID
  useEffect(() => {
    let active = true;

    if (value) {
      if (resolvedCitiesCache.has(value)) {
        setSearchTerm(toTitleCase(resolvedCitiesCache.get(value)!.cidade));
      } else {
        api.get<Cidade>(`/cidades/${value}`)
          .then((res) => {
            if (!active) return;
            const record = res.data;
            resolvedCitiesCache.set(value, record);
            setSearchTerm(toTitleCase(record.cidade));
          })
          .catch(() => {
            if (active) {
              setSearchTerm("");
            }
          });
      }
    } else if (initialCityName) {
      setSearchTerm(toTitleCase(initialCityName));
    } else {
      setSearchTerm("");
    }

    return () => {
      active = false;
    };
  }, [value, initialCityName]);

  // Effect to perform database search when search term changes
  useEffect(() => {
    const termClean = searchTerm ? searchTerm.trim() : "";
    if (termClean.length < 3) {
      setLocalCities([]);
      setIsSearching(false);
      return;
    }

    // Skip query if search term matches currently selected city
    if (value) {
      const cached = resolvedCitiesCache.get(value);
      if (cached && toTitleCase(termClean) === toTitleCase(cached.cidade)) {
        setIsSearching(false);
        return;
      }
    }

    setIsSearching(true);
    let active = true;

    const delayDebounceFn = setTimeout(() => {
      api.get<Cidade[]>('/cidades', {
        params: { search: termClean }
      })
        .then((res) => {
          if (!active) return;
          const items = res.data.slice(0, 10);
          items.forEach((c) => resolvedCitiesCache.set(c.id, c));
          setLocalCities(items);
          setIsSearching(false);
        })
        .catch(() => {
          if (active) {
            setLocalCities([]);
            setIsSearching(false);
          }
        });
    }, 400);

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [searchTerm, value]);

  const handleSelect = (city: Cidade) => {
    setSearchTerm(toTitleCase(city.cidade));
    setIsOpen(false);
    onChange(city);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < localCities.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(localCities[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <Input
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => {
          const val = e.target.value;
          setSearchTerm(val);
          setIsOpen(true);
          setActiveIndex(-1);
          if (!val) {
            onChange(null);
            setIsSearching(false);
          } else if (val.trim().length >= 3) {
            setIsSearching(true);
          } else {
            setIsSearching(false);
          }
        }}
        onFocus={() => {
          if (searchTerm) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        error={error}
        autoComplete="off"
      />

      {isOpen && searchTerm.trim().length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg max-h-60 overflow-auto animate-fadeIn">
          {searchTerm.trim().length < 3 ? (
            <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 text-center">
              Digite pelo menos 3 caracteres para buscar...
            </div>
          ) : isSearching ? (
            <div className="px-4 py-3 space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-brand-500 animate-pulse"></span>
                <span className="font-medium">Buscando cidades...</span>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                <div className="h-2.5 w-1/2 bg-gray-100 dark:bg-gray-800/60 rounded animate-pulse"></div>
              </div>
            </div>
          ) : localCities.length > 0 ? (
            <ul className="py-1">
              {localCities.map((city, index) => (
                <li
                  key={city.id}
                  onClick={() => handleSelect(city)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                    index === activeIndex
                      ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="font-medium">{toTitleCase(city.cidade)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {toTitleCase(city.estado)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
              Nenhuma cidade encontrada
            </div>
          )}
        </div>
      )}
    </div>
  );
}
