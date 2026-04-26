import { Flag, type FlagCode } from "./flag";
import { Icon, type IconKey } from "./icon";
import styles from "./option-card-group.module.css";

export type OptionCardGroupOption = {
  description?: string | null;
  flagCode?: FlagCode | null;
  iconKey?: IconKey | null;
  label: string;
  value: string;
};

type OptionCardGroupProps = {
  error?: string;
  hideLegend?: boolean;
  id?: string;
  legend: string;
  name: string;
  onChange: (value: string) => void;
  options: readonly OptionCardGroupOption[];
  showDescriptions?: boolean;
  value: string;
};

export function OptionCardGroup({
  error,
  hideLegend = false,
  id,
  legend,
  name,
  onChange,
  options,
  showDescriptions = false,
  value,
}: OptionCardGroupProps) {
  return (
    <fieldset
      aria-invalid={error ? true : undefined}
      className={styles.group}
      id={id}
    >
      <legend
        className={[styles.legend, hideLegend ? styles.hiddenLegend : ""]
          .filter(Boolean)
          .join(" ")}
      >
        {legend}
      </legend>
      <div className={styles.grid}>
        {options.map((option) => {
          const isSelected = value === option.value;
          const inputId = `${name}-${option.value}`;

          return (
            <div className={styles.choice} key={option.value}>
              <input
                checked={isSelected}
                className={styles.input}
                id={inputId}
                name={name}
                onChange={() => onChange(option.value)}
                type="radio"
                value={option.value}
              />
              <label
                className={[
                  styles.card,
                  !showDescriptions ? styles.compactCard : "",
                  isSelected ? styles.selectedCard : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                htmlFor={inputId}
              >
                <span className={styles.main}>
                  {option.iconKey || option.flagCode ? (
                    <span
                      className={[
                        styles.visual,
                        option.flagCode ? styles.flagVisual : styles.iconVisual,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {option.flagCode ? (
                        <Flag code={option.flagCode} />
                      ) : option.iconKey ? (
                        <Icon name={option.iconKey} />
                      ) : null}
                    </span>
                  ) : null}
                  <span className={styles.text}>
                    <span className={styles.title}>{option.label}</span>
                    {showDescriptions && option.description ? (
                      <span className={styles.description}>{option.description}</span>
                    ) : null}
                  </span>
                </span>
                <span aria-hidden="true" className={styles.indicator} />
              </label>
            </div>
          );
        })}
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
    </fieldset>
  );
}
