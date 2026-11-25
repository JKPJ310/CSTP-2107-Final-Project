import React from 'react'
import { useTheme } from '../../hooks/useTheme'
import { SettingsCard } from './settingsParts'

const CHOICES = [
    { value: 'light', label: 'Light', icon: 'light_mode' },
    { value: 'dark', label: 'Dark', icon: 'dark_mode' },
    { value: 'system', label: 'Match my device', icon: 'devices' }
];

// Light, dark, or follow the computer. Remembered in this browser, like the navbar button.
const AppearanceSection = () => {

    const { choice, choose } = useTheme();

    return (
        <SettingsCard id="settings-appearance" title="Appearance">
            <fieldset>
                <legend className="sr-only">Theme</legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {CHOICES.map((option) => (
                        <label
                            key={option.value}
                            className={`h-12 px-4 rounded-xl border flex items-center gap-2 cursor-pointer text-[14px] font-medium transition-colors has-focus-visible:ring-3 has-focus-visible:ring-leaf/30 ${choice === option.value ? 'border-leaf bg-mint text-forest' : 'border-hairline text-heading hover:border-leaf'}`}
                        >
                            <input type="radio" name="theme" value={option.value} checked={choice === option.value} onChange={() => choose(option.value)} className="sr-only" />
                            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{option.icon}</span>
                            {option.label}
                        </label>
                    ))}
                </div>
            </fieldset>
        </SettingsCard>
    )
}

export default AppearanceSection
