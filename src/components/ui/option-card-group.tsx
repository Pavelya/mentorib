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

type SingleSelectProps = {
  mode?: "single";
  onChange: (value: string) => void;
  value: string;
};

type MultiSelectProps = {
  mode: "multi";
  onToggle: (value: string) => void;
  values: readonly string[];
};

type OptionCardGroupBaseProps = {
  error?: string;
  hideLegend?: boolean;
  id?: string;
  legend: string;
  name: string;
  options: readonly OptionCardGroupOption[];
  showDescriptions?: boolean;
};

type OptionCardGroupProps = OptionCardGroupBaseProps &
  (SingleSelectProps | MultiSelectProps);

export function OptionCardGroup(props: OptionCardGroupProps) {
  const {
    error,
    hideLegend = false,
    id,
    legend,
    name,
    options,
    showDescriptions = false,
  } = props;
  const isMulti = props.mode === "multi";

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
          const isSelected = isMulti
            ? props.values.includes(option.value)
            : props.value === option.value;
          const inputId = `${name}-${option.value}`;

          return (
            <div className={styles.choice} key={option.value}>
              <input
                checked={isSelected}
                className={styles.input}
                id={inputId}
                name={isMulti ? `${name}[]` : name}
                onChange={() =>
                  isMulti
                    ? props.onToggle(option.value)
                    : props.onChange(option.value)
                }
                type={isMulti ? "checkbox" : "radio"}
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
