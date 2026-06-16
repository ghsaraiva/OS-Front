import { ChevronDownIcon } from "../../icons";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
  error?: boolean;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Selecione uma opção",
  onChange,
  className = "",
  defaultValue = "",
  value,
  disabled = false,
  error = false,
}) => {
  const currentValue = value !== undefined ? value : defaultValue;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  let selectClasses = `h-11 w-full appearance-none rounded-lg border bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 ${className} `;

  if (disabled) {
    selectClasses += "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700";
  } else if (error) {
    selectClasses += "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:border-error-500";
  } else {
    selectClasses += "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-800";
  }

  const textClasses = currentValue
    ? "text-gray-800 dark:text-white/90"
    : "text-gray-400 dark:text-gray-400";

  return (
    <div className="relative">
      <select
        className={`${selectClasses} ${textClasses}`}
        value={currentValue}
        onChange={handleChange}
        disabled={disabled}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
        <ChevronDownIcon className="size-5" />
      </span>
    </div>
  );
};

export default Select;
