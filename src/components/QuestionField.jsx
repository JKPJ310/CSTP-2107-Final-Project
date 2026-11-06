import React from 'react'
import AvatarPicker from './AvatarPicker'

const inputClass = 'w-full h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant text-[15px] text-on-surface focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/15 aria-invalid:border-red-500';

const chipClass = 'flex items-center px-3.5 py-2 rounded-full border border-outline-variant bg-surface-container-lowest text-[14px] text-on-surface cursor-pointer select-none transition-colors hover:bg-surface-container-low has-checked:bg-primary has-checked:border-primary has-checked:text-on-primary has-focus-visible:ring-3 has-focus-visible:ring-primary/30';

const labelClass = 'block text-[14px] font-medium text-on-surface mb-2';

const optionalTag = <span className="ml-1.5 text-[12px] font-normal text-on-surface-variant/70">optional</span>;

const QuestionField = ({ question, answers, onChange, error }) => {

    const { id, type, label, required, help } = question;
    const value = answers[id];
    const helpId = help ? `${id}-help` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;
    const imperial = answers.units === 'imperial';

    const handleMultiToggle = (optionValue) => {
        const exclusive = question.exclusive ?? [];
        if (value.includes(optionValue)) {
            onChange(id, value.filter((v) => v !== optionValue));
        } else if (exclusive.includes(optionValue)) {
            onChange(id, [optionValue]);
        } else {
            onChange(id, [...value.filter((v) => !exclusive.includes(v)), optionValue]);
        }
    }

    const footer = (
        <>
            {help && <p id={helpId} className="mt-1.5 text-[12px] text-on-surface-variant">{help}</p>}
            {error && <p id={errorId} className="mt-1.5 text-[12px] font-medium text-red-600">{error}</p>}
        </>
    );

    if (type === 'avatar') {
        return <AvatarPicker answers={answers} onChange={onChange} />
    }

    if (type === 'single' || type === 'multi') {
        const isMulti = type === 'multi';
        return (
            <fieldset aria-describedby={describedBy}>
                <legend className={labelClass}>{label}{!required && optionalTag}</legend>
                <div className="flex flex-wrap gap-2">
                    {question.options.map((option) => (
                        <label key={option.value} className={chipClass}>
                            <input
                                id={`${id}-${option.value}`}
                                type={isMulti ? 'checkbox' : 'radio'}
                                name={id}
                                value={option.value}
                                checked={isMulti ? value.includes(option.value) : value === option.value}
                                onChange={() => isMulti ? handleMultiToggle(option.value) : onChange(id, option.value)}
                                className="sr-only"
                            />
                            {option.label}
                        </label>
                    ))}
                </div>
                {question.describeOption && value === question.describeOption && (
                    <input
                        id={`${id}Custom`}
                        type="text"
                        value={answers[`${id}Custom`]}
                        onChange={(e) => onChange(`${id}Custom`, e.target.value)}
                        maxLength={40}
                        placeholder="In your own words"
                        aria-label={`${label}, in your own words`}
                        aria-invalid={Boolean(error)}
                        aria-describedby={describedBy}
                        className={`${inputClass} mt-3`}
                    />
                )}
                {footer}
            </fieldset>
        )
    }

    if (type === 'checkbox') {
        return (
            <div>
                <label className="flex items-start gap-3 text-[14px] leading-snug text-on-surface cursor-pointer">
                    <input
                        id={id}
                        type="checkbox"
                        checked={value}
                        onChange={(e) => onChange(id, e.target.checked)}
                        aria-invalid={Boolean(error)}
                        aria-describedby={describedBy}
                        className="mt-0.5 w-[18px] h-[18px] shrink-0 accent-primary"
                    />
                    <span>{label}</span>
                </label>
                {footer}
            </div>
        )
    }

    if (type === 'height') {
        return (
            <fieldset aria-describedby={describedBy}>
                <legend className={labelClass}>{label}{optionalTag}</legend>
                {imperial ? (
                    <div className="flex gap-3">
                        <UnitInput id="heightFt" unit="ft" value={answers.heightFt} onChange={onChange} invalid={Boolean(error)} label="Feet" />
                        <UnitInput id="heightIn" unit="in" value={answers.heightIn} onChange={onChange} invalid={Boolean(error)} label="Inches" />
                    </div>
                ) : (
                    <UnitInput id="heightCm" unit="cm" value={answers.heightCm} onChange={onChange} invalid={Boolean(error)} label="Centimetres" />
                )}
                {footer}
            </fieldset>
        )
    }

    if (type === 'weight') {
        return (
            <fieldset aria-describedby={describedBy}>
                <legend className={labelClass}>{label}{optionalTag}</legend>
                <UnitInput id="weight" unit={imperial ? 'lb' : 'kg'} value={answers.weight} onChange={onChange} invalid={Boolean(error)} label={imperial ? 'Pounds' : 'Kilograms'} />
                {footer}
            </fieldset>
        )
    }

    return (
        <div>
            <label htmlFor={id} className={labelClass}>{label}{!required && optionalTag}</label>
            {type === 'select' ? (
                <select
                    id={id}
                    value={value}
                    onChange={(e) => onChange(id, e.target.value)}
                    aria-invalid={Boolean(error)}
                    aria-describedby={describedBy}
                    className={inputClass}
                >
                    <option value="" disabled>Choose one</option>
                    {question.options.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            ) : (
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(id, e.target.value)}
                    maxLength={question.maxLength}
                    autoComplete={question.autoComplete}
                    max={type === 'date' ? new Date().toISOString().slice(0, 10) : undefined}
                    aria-invalid={Boolean(error)}
                    aria-describedby={describedBy}
                    className={inputClass}
                />
            )}
            {footer}
        </div>
    )
}

const UnitInput = ({ id, unit, value, onChange, invalid, label }) => (
    <div className="relative flex-1">
        <input
            id={id}
            type="number"
            inputMode="decimal"
            min="0"
            value={value}
            onChange={(e) => onChange(id, e.target.value)}
            aria-label={label}
            aria-invalid={invalid}
            className={`${inputClass} pr-10`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-on-surface-variant pointer-events-none">{unit}</span>
    </div>
)

export default QuestionField
