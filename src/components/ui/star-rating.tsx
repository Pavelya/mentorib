"use client";

import {
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { Icon } from "./icon";
import styles from "./star-rating.module.css";

const DEFAULT_MAX = 5;

type StarRatingDisplayProps = {
  mode: "display";
  value: number;
  max?: number;
  "aria-label"?: string;
};

type StarRatingInputProps = {
  mode: "input";
  name: string;
  value: number;
  max?: number;
  onChange?: (next: number) => void;
  required?: boolean;
  legend: string;
  hideLegend?: boolean;
  error?: string;
  size?: number;
};

export type StarRatingProps = StarRatingDisplayProps | StarRatingInputProps;

export function StarRating(props: StarRatingProps) {
  if (props.mode === "display") {
    return <StarRatingDisplay {...props} />;
  }
  return <StarRatingInput {...props} />;
}

function StarRatingDisplay({
  value,
  max = DEFAULT_MAX,
  "aria-label": ariaLabel,
}: StarRatingDisplayProps) {
  const clamped = Math.max(0, Math.min(max, Math.round(value)));
  const label = ariaLabel ?? `${clamped} out of ${max} stars`;

  return (
    <span aria-label={label} className={styles.display} role="img">
      {Array.from({ length: max }, (_, index) => {
        const isFilled = index < clamped;
        return (
          <Icon
            className={isFilled ? styles.starFilled : styles.starEmpty}
            filled={isFilled}
            key={index}
            name="star"
          />
        );
      })}
    </span>
  );
}

function StarRatingInput({
  name,
  value,
  max = DEFAULT_MAX,
  onChange,
  required,
  legend,
  hideLegend,
  error,
  size = 28,
}: StarRatingInputProps) {
  const reactId = useId().replaceAll(":", "");
  const groupId = `star-rating-${reactId}`;
  const errorId = error ? `${groupId}-error` : undefined;
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const currentValue = value > 0 && value <= max ? value : 0;
  const focusIndex = currentValue > 0 ? currentValue - 1 : 0;

  const select = (next: number) => {
    onChange?.(next);
    const target = inputsRef.current[next - 1];
    if (target) {
      target.focus();
    }
  };

  const handleKeyDown = (
    event: ReactKeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    const optionValue = index + 1;
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowUp": {
        event.preventDefault();
        const next = optionValue === 1 ? max : optionValue - 1;
        select(next);
        break;
      }
      case "ArrowRight":
      case "ArrowDown": {
        event.preventDefault();
        const next = optionValue === max ? 1 : optionValue + 1;
        select(next);
        break;
      }
      case "Home": {
        event.preventDefault();
        select(1);
        break;
      }
      case "End": {
        event.preventDefault();
        select(max);
        break;
      }
      case " ":
      case "Enter": {
        event.preventDefault();
        select(optionValue);
        break;
      }
      default:
        break;
    }
  };

  return (
    <div>
      <fieldset
        aria-describedby={errorId}
        aria-invalid={error ? true : undefined}
        className={styles.group}
        id={groupId}
      >
        <legend
          className={[styles.legend, hideLegend ? styles.legendHidden : ""]
            .filter(Boolean)
            .join(" ")}
        >
          {legend}
        </legend>
        {Array.from({ length: max }, (_, index) => {
          const optionValue = index + 1;
          const isFilled = currentValue >= optionValue;
          const isFocusTarget = index === focusIndex;
          return (
            <label className={styles.starOption} key={optionValue}>
              <input
                aria-label={`${optionValue} ${optionValue === 1 ? "star" : "stars"}`}
                checked={currentValue === optionValue}
                className={styles.starInput}
                name={name}
                onChange={() => onChange?.(optionValue)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                ref={(node) => {
                  inputsRef.current[index] = node;
                }}
                required={required && optionValue === 1 ? true : undefined}
                tabIndex={isFocusTarget ? 0 : -1}
                type="radio"
                value={optionValue}
              />
              <Icon
                className={isFilled ? styles.starFilled : styles.starEmpty}
                filled={isFilled}
                name="star"
                size={size}
              />
            </label>
          );
        })}
      </fieldset>
      {error ? (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
